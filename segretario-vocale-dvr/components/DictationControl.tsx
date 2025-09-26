import React from 'react';
import { MicrophoneIcon, ProcessingSpinnerIcon } from './Icons';

interface DictationControlProps {
  isRecording: boolean;
  isProcessing: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  interimTranscript: string;
}

export const DictationControl: React.FC<DictationControlProps> = ({
  isRecording,
  isProcessing,
  startRecording,
  stopRecording,
  interimTranscript,
}) => {
  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getButtonState = () => {
    if (isProcessing) {
      return { text: 'Elaborazione...', icon: <ProcessingSpinnerIcon />, disabled: true, bg: 'bg-gray-600' };
    }
    if (isRecording) {
      return { text: 'Ferma Dettatura', icon: <MicrophoneIcon />, disabled: false, bg: 'bg-red-600 hover:bg-red-700' };
    }
    return { text: 'Avvia Dettatura', icon: <MicrophoneIcon />, disabled: false, bg: 'bg-cyan-600 hover:bg-cyan-700' };
  };

  const { text, icon, disabled, bg } = getButtonState();

  return (
    <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
      <div className="text-center">
        <button
          onClick={handleClick}
          disabled={disabled}
          className={\`relative w-24 h-24 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-xl mx-auto focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 \${bg} \${isRecording ? 'animate-pulse' : ''}\`}
        >
          <span className="text-4xl">{icon}</span>
        </button>
        <p className="mt-4 text-lg font-semibold">{text}</p>
        <div className="mt-2 text-slate-400 min-h-[2.5em] px-4">
          <p>
            {isRecording ? (interimTranscript || 'In ascolto...') : 'Tocca il microfono per iniziare a dettare il tuo sopralluogo.'}
          </p>
        </div>
      </div>
    </div>
  );
};