import React from 'react';
import JannyInterface from './components/JannyInterface';
import AvatarPlayground from './components/AvatarPlayground';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  if (window.location.pathname === '/avatar') {
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
