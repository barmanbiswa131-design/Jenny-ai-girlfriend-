import React from 'react';
import JannyInterface from './components/JannyInterface';
import AvatarPlayground from './components/AvatarPlayground';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  if (new URLSearchParams(window.location.search).get('avatar') === '1') {
    return <AvatarPlayground />;
  }
  return (
    <AuthProvider>
      <div className="w-full h-screen bg-black">
        <JannyInterface />
      </div>
    </AuthProvider>
  );
}
