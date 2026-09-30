import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative flex items-center justify-center">
        {/* Glowing pulse rings */}
        <div className="absolute h-24 w-24 rounded-full bg-[#FFCC00]/15 animate-ping duration-1000" />
        <div className="absolute h-20 w-20 rounded-full bg-[#FFCC00]/25 animate-pulse" />

        {/* Central Logo Container */}
        <div className="relative h-16 w-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-xl">
          <img
            src="/logo.png"
            alt="VisitExpo"
            className="h-9 w-9 object-contain animate-pulse"
          />
        </div>
      </div>

      {/* Loading copy and progress dots */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#FFCC00] animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-[#FFCC00] animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-[#FFCC00] animate-bounce" />
        </div>
        <p className="text-xs font-bold text-zinc-500 tracking-wider uppercase">
          Loading VisitExpo...
        </p>
      </div>
    </div>
  );
}
