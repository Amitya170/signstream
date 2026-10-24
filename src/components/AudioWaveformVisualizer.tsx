import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Mic } from 'lucide-react';

interface AudioWaveformVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
  className?: string;
  showDecibelMeter?: boolean;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  stream,
  isActive,
  className = '',
  showDecibelMeter = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [decibels, setDecibels] = useState<number>(-Infinity);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);

  useEffect(() => {
    if (!isActive || !stream) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setIsVoiceActive(false);
      setDecibels(-Infinity);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.75;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;

        // Convert 0-255 amplitude to approximate dBFS (-60 to 0)
        const normalized = Math.max(0.001, avg / 255);
        const approxDb = Math.round(20 * Math.log10(normalized));
        setDecibels(approxDb);

        const voiceDetected = avg > 20;
        setIsVoiceActive(voiceDetected);

        // Draw frequency equalizer bars
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;

          // Gradient color: teal to emerald
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, '#0d9488');
          gradient.addColorStop(1, '#34d399');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

          x += barWidth + 1;
        }

        animFrameRef.current = requestAnimationFrame(draw);
      };

      draw();
    } catch {
      // AudioContext not available in headless or unsupported
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [isActive, stream]);

  return (
    <div className={`relative flex items-center gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 ${className}`}>
      {/* Deaf-Friendly Sound Flash Alert Ring */}
      {isVoiceActive && (
        <span
          className="absolute -inset-0.5 rounded-2xl bg-emerald-500/25 border-2 border-emerald-400 animate-pulse pointer-events-none"
          aria-hidden="true"
        />
      )}

      <div className="flex items-center gap-2">
        <div
          className={`p-2 rounded-xl transition-colors ${
            isVoiceActive
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {isVoiceActive ? <Volume2 className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            {isVoiceActive ? 'Voice Detected' : 'Listening for Speech...'}
            {isVoiceActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </span>
          {showDecibelMeter && (
            <span className="text-[10px] text-slate-400">
              Input Level: <strong>{decibels > -60 ? `${decibels} dB` : 'Silent'}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Real-time Canvas Equalizer */}
      <canvas
        ref={canvasRef}
        width={140}
        height={32}
        className="ml-auto rounded-lg bg-slate-950/60 border border-slate-800/80"
        aria-hidden="true"
      />
    </div>
  );
};
