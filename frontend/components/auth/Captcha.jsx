'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RotateCw, Volume2, ShieldAlert, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

export function Captcha({ onCaptchaChange, inputCode, setInputCode, error }) {
  const canvasRef = useRef(null);
  const [captchaCode, setCaptchaCode] = useState('');

  const generateRandomCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const drawCaptcha = (code) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas dimensions
    const width = canvas.width;
    const height = canvas.height;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#ecfdf5');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Background noise dots
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${Math.floor(Math.random() * 120)}, ${Math.floor(
        Math.random() * 180
      )}, ${Math.floor(Math.random() * 120)}, 0.25)`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 2.5 + 0.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Noise wave lines
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 100)}, ${Math.floor(
        Math.random() * 160 + 50
      )}, ${Math.floor(Math.random() * 120)}, 0.45)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * height);
      ctx.bezierCurveTo(
        width / 3,
        Math.random() * height,
        (width * 2) / 3,
        Math.random() * height,
        width,
        Math.random() * height
      );
      ctx.stroke();
    }

    // Draw characters with random rotation, scale, and colors
    const charSpacing = width / (code.length + 1);
    const fonts = ['bold 22px monospace', 'bold 24px sans-serif', 'bold 23px Courier'];
    const colors = ['#047857', '#065f46', '#0f766e', '#0369a1', '#1e293b'];

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      ctx.save();

      const x = charSpacing * (i + 0.8) + (Math.random() * 4 - 2);
      const y = height / 2 + Math.random() * 6 - 3;
      const angle = (Math.random() * 30 - 15) * (Math.PI / 180);

      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.font = fonts[Math.floor(Math.random() * fonts.length)];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(char, 0, 0);

      ctx.restore();
    }
  };

  const refreshCaptcha = (showNotification = true) => {
    const newCode = generateRandomCode();
    setCaptchaCode(newCode);
    if (onCaptchaChange) {
      onCaptchaChange(newCode);
    }
    // Draw
    setTimeout(() => {
      drawCaptcha(newCode);
    }, 10);

    if (showNotification) {
      toast.info('New security challenge generated', { duration: 2500 });
    }
  };

  useEffect(() => {
    refreshCaptcha(false);
  }, []);

  const handleAudioSpeak = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Speak characters slowly
      const charsSpaced = captchaCode.split('').join('. ');
      const utterance = new SpeechSynthesisUtterance(`Security code is: ${charsSpaced}`);
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
      toast.info('Reading security code aloud…', { duration: 3000 });
    } else {
      toast.info('Audio synthesis is not supported on this browser.');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="captcha-input"
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
        >
          Security Verification (Anti-Bot)
        </label>
        <span className="text-[11px] text-emerald-700 font-medium">Case-sensitive</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Visual Canvas */}
        <div className="relative border border-emerald-200/80 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center shadow-xs">
          <canvas
            ref={canvasRef}
            width={140}
            height={42}
            className="block select-none cursor-pointer"
            onClick={() => refreshCaptcha(true)}
            title="Click to reload captcha"
          />
        </div>

        {/* Action buttons */}
        <button
          type="button"
          onClick={() => refreshCaptcha(true)}
          title="Refresh captcha"
          className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleAudioSpeak}
          title="Listen to captcha code"
          className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <Volume2 className="w-4 h-4" />
        </button>

        {/* Input box */}
        <div className="flex-1">
          <input
            id="captcha-input"
            type="text"
            required
            autoComplete="off"
            placeholder="Enter code"
            maxLength={6}
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.trim())}
            className={`w-full px-3 py-2 text-sm font-mono tracking-widest uppercase bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
              error
                ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500'
                : 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500'
            }`}
          />
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
