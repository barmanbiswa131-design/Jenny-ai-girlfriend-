/**
 * AudioStreamer handles microphone capture and audio playback for the Gemini Live API.
 * Converts any device sample rate (44.1kHz, 48kHz, 16kHz) to 16kHz PCM16 for Gemini input,
 * and gaplessly plays back 24kHz PCM16 from Gemini.
 */
export class AudioStreamer {
  private inputAudioContext: AudioContext | null = null;
  private playbackAudioContext: AudioContext | null = null;
  private playbackGainNode: GainNode | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private activeSources: AudioBufferSourceNode[] = [];
  private nextPlaybackTime = 0;
  private volume = 0.85;
  private isMuted = false;
  private isCurrentlyPlaying = false;
  private playbackCheckTimer: any = null;

  public onPlaybackStateChange?: (isPlaying: boolean) => void;

  constructor(private onAudioData: (base64Data: string) => void) {}

  async start() {
    this.stop(); // Clean up any existing instances first

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("Web Audio API is not supported in this browser.");
    }

    // 1. Request microphone stream with robust acoustic constraints
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: { ideal: 1 },
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
        }
      });
    } catch (err: any) {
      console.error("Microphone access error:", err);
      throw err;
    }

    // 2. Initialize Input Audio Context with native sample rate (avoids mobile resampling bugs)
    this.inputAudioContext = new AudioContextClass();
    if (this.inputAudioContext.state === 'suspended') {
      await this.inputAudioContext.resume().catch(() => {});
    }

    this.source = this.inputAudioContext.createMediaStreamSource(this.stream);

    // Buffer size 4096 gives ~85ms latency at 48kHz or ~256ms at 16kHz
    const bufferSize = 4096;
    this.scriptNode = this.inputAudioContext.createScriptProcessor(bufferSize, 1, 1);

    const inputSampleRate = this.inputAudioContext.sampleRate;

    this.scriptNode.onaudioprocess = (event) => {
      if (this.isMuted) return;

      const inputData = event.inputBuffer.getChannelData(0);
      
      // Resample smoothly to 16,000 Hz if hardware uses 44.1kHz / 48kHz / etc.
      const resampled = this.resampleTo16k(inputData, inputSampleRate);
      const pcm16 = this.floatToPcm16(resampled);
      const base64 = this.arrayBufferToBase64(pcm16.buffer);
      
      this.onAudioData(base64);
    };

    this.source.connect(this.scriptNode);
    // Connect to destination to keep ScriptProcessor alive in Chromium
    this.scriptNode.connect(this.inputAudioContext.destination);

    // 3. Initialize Output Playback Audio Context (24kHz for Gemini output)
    this.initPlaybackContext();
  }

  private initPlaybackContext() {
    if (!this.playbackAudioContext || this.playbackAudioContext.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.playbackAudioContext = new AudioContextClass({ sampleRate: 24000 });
      this.playbackGainNode = this.playbackAudioContext.createGain();
      this.playbackGainNode.gain.value = this.volume;
      this.playbackGainNode.connect(this.playbackAudioContext.destination);
      this.nextPlaybackTime = this.playbackAudioContext.currentTime;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.stream) {
      this.stream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(volNormalized: number) {
    this.volume = Math.max(0, Math.min(1, volNormalized));
    if (this.playbackGainNode) {
      this.playbackGainNode.gain.value = this.volume;
    }
  }

  public isPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }

  stop() {
    this.stopPlayback();
    if (this.playbackCheckTimer) {
      clearTimeout(this.playbackCheckTimer);
      this.playbackCheckTimer = null;
    }

    try {
      this.stream?.getTracks().forEach(track => {
        track.stop();
      });
    } catch {}

    try {
      this.scriptNode?.disconnect();
      this.source?.disconnect();
      this.inputAudioContext?.close();
    } catch {}

    try {
      this.playbackAudioContext?.close();
    } catch {}

    this.inputAudioContext = null;
    this.playbackAudioContext = null;
    this.playbackGainNode = null;
    this.stream = null;
    this.source = null;
    this.scriptNode = null;
    this.isCurrentlyPlaying = false;
  }

  /**
   * Clears queued/currently playing audio when model is interrupted by the user
   */
  stopPlayback() {
    for (const src of this.activeSources) {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    }
    this.activeSources = [];
    if (this.playbackAudioContext) {
      this.nextPlaybackTime = this.playbackAudioContext.currentTime;
    }
    this.setIsPlaying(false);
  }

  private setIsPlaying(playing: boolean) {
    if (this.isCurrentlyPlaying !== playing) {
      this.isCurrentlyPlaying = playing;
      this.onPlaybackStateChange?.(playing);
    }
  }

  /**
   * Plays back 24kHz PCM16 data from the model with gapless scheduling.
   */
  addPlaybackData(base64Data: string) {
    this.initPlaybackContext();
    if (!this.playbackAudioContext || !this.playbackGainNode) return;

    if (this.playbackAudioContext.state === 'suspended') {
      this.playbackAudioContext.resume().catch(() => {});
    }

    try {
      const buffer = this.base64ToArrayBuffer(base64Data);
      const pcm16 = new Int16Array(buffer);
      const float32 = this.pcm16ToFloat32(pcm16);

      const audioBuffer = this.playbackAudioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = this.playbackAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackGainNode);

      const currentTime = this.playbackAudioContext.currentTime;
      // If we fell behind, reset scheduled playback time with tiny buffer
      if (this.nextPlaybackTime < currentTime) {
        this.nextPlaybackTime = currentTime + 0.02;
      }

      source.start(this.nextPlaybackTime);
      this.nextPlaybackTime += audioBuffer.duration;
      this.activeSources.push(source);
      this.setIsPlaying(true);

      source.onended = () => {
        const index = this.activeSources.indexOf(source);
        if (index !== -1) {
          this.activeSources.splice(index, 1);
        }

        // If no more active buffers scheduled, check if playback ended
        if (this.activeSources.length === 0) {
          if (this.playbackCheckTimer) clearTimeout(this.playbackCheckTimer);
          this.playbackCheckTimer = setTimeout(() => {
            if (this.activeSources.length === 0) {
              this.setIsPlaying(false);
            }
          }, 150);
        }
      };
    } catch (err) {
      console.warn("Playback chunk error:", err);
    }
  }

  /**
   * Resamples raw audio input float buffer to 16,000 Hz using linear interpolation
   */
  private resampleTo16k(inputData: Float32Array, inputSampleRate: number): Float32Array {
    if (inputSampleRate === 16000) {
      return inputData;
    }
    const ratio = inputSampleRate / 16000;
    const newLength = Math.round(inputData.length / ratio);
    const result = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const originIndex = i * ratio;
      const leftIndex = Math.floor(originIndex);
      const rightIndex = Math.min(leftIndex + 1, inputData.length - 1);
      const weight = originIndex - leftIndex;
      result[i] = inputData[leftIndex] * (1 - weight) + inputData[rightIndex] * weight;
    }
    return result;
  }

  private floatToPcm16(float32: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm16;
  }

  private pcm16ToFloat32(pcm16: Int16Array): Float32Array {
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 0x8000;
    }
    return float32;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
