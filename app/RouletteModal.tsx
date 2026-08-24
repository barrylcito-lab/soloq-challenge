"use client";

import React, { useState, useEffect, useRef } from "react";
import { PENALTIES } from "@/lib/penalties";

interface RouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  victim: any;
  attacker?: any;
  onFinish?: (penalty: any, extraConfig?: string) => void;
}

const CARD_WIDTH = 200;
const CARD_GAP = 16;
const STEP = CARD_WIDTH + CARD_GAP;
const REEL_SIZE = 45;
const WIN_INDEX = 30;

export default function RouletteModal({
  isOpen,
  onClose,
  victim,
  attacker,
  onFinish,
}: RouletteModalProps) {
  const [spinning, setSpinning] = useState(false);
  const [selectedPenalty, setSelectedPenalty] = useState<any>(null);
  const [reelItems, setReelItems] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [customValue, setCustomValue] = useState("");

  const reelContainerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const victimName =
    typeof victim === "string"
      ? victim
      : victim?.riotId || victim?.gameName || victim?.name || "Jugador";

  const attackerName =
    typeof attacker === "string"
      ? attacker
      : attacker?.riotId || attacker?.gameName || attacker?.name || "Rival";

  const initAudio = () => {
    if (!audioCtxRef.current && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
  };

  const playTickSound = () => {
    if (!audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(700 + Math.random() * 150, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {}
  };

  const playVictorySound = () => {
    if (!audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
      });
    } catch {}
  };

  useEffect(() => {
    if (isOpen && PENALTIES.length > 0) {
      const randomReel: any[] = [];
      for (let i = 0; i < REEL_SIZE; i++) {
        const item = PENALTIES[Math.floor(Math.random() * PENALTIES.length)];
        randomReel.push(item);
      }
      setReelItems(randomReel);
      setSelectedPenalty(null);
      setCustomValue("");
      setOffset(0);
      setSpinning(false);
    }
  }, [isOpen, victim]);

  if (!isOpen || !victim) return null;

  const handleSpin = async () => {
    if (spinning || selectedPenalty !== null || reelItems.length === 0) return;
    initAudio();
    setSpinning(true);

    const winningPenalty = PENALTIES[Math.floor(Math.random() * PENALTIES.length)];
    const updatedReel = [...reelItems];
    updatedReel[WIN_INDEX] = winningPenalty;
    setReelItems(updatedReel);

    const containerWidth = reelContainerRef.current?.clientWidth || 700;
    const cardCenter = WIN_INDEX * STEP + CARD_WIDTH / 2;
    const targetOffset = cardCenter - containerWidth / 2;

    setOffset(targetOffset);

    let currentDelay = 50;
    const startTime = Date.now();
    const duration = 5000;

    const playSoundLoop = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        playTickSound();
        const progress = elapsed / duration;
        currentDelay = 45 + Math.pow(progress, 3.2) * 520;
        setTimeout(playSoundLoop, currentDelay);
      }
    };
    setTimeout(playSoundLoop, currentDelay);

    setTimeout(async () => {
      setSpinning(false);
      setSelectedPenalty(winningPenalty);
      playVictorySound();
    }, duration + 300);
  };

  const handleConfirmPenalty = async () => {
    if (!selectedPenalty) return;

    try {
      await fetch("/api/blueshell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attacker: typeof attacker === "object" ? attacker : { riotId: attackerName },
          victim: typeof victim === "object" ? victim : { riotId: victimName },
          penalty: selectedPenalty,
          extraConfig: customValue || null,
        }),
      });
    } catch (err) {
      console.error("Error al enviar a Discord:", err);
    }

    if (onFinish) {
      onFinish(selectedPenalty, customValue);
    }
    onClose();
  };

  // Declaramos penaltyId aquí para que no falle nunca
  const penaltyId = selectedPenalty ? Number(selectedPenalty.id) : null;
  const needsInput = penaltyId !== null && [1, 2, 3, 15].includes(penaltyId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl border-2 border-blue-500/30 bg-slate-900/95 p-6 sm:p-8 text-center shadow-2xl shadow-blue-500/20 overflow-hidden">
        
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-pulse">🐚💥</span>
            <div className="text-left">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                RULETA BLUE SHELL
              </h2>
              <p className="text-xs text-slate-400">
                Objetivo: <span className="text-rose-400 font-bold">{victimName}</span> | Atacante: <span className="text-blue-400 font-bold">{attackerName}</span>
              </p>
            </div>
          </div>
          {!spinning && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white text-2xl font-bold transition px-2"
            >
              ✕
            </button>
          )}
        </div>

        <div className="relative z-10 my-6">
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 z-30 pointer-events-none">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
            <div className="h-full w-full bg-amber-400 shadow-[0_0_12px_#fbbf24]" />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
          </div>

          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent z-20 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-900 via-slate-900/80 to-transparent z-20 pointer-events-none" />

          <div
            ref={reelContainerRef}
            className="w-full h-44 bg-slate-950/90 rounded-2xl border border-slate-800 flex items-center overflow-hidden relative shadow-inner"
          >
            <div
              className="flex items-center gap-4"
              style={{
                transform: `translateX(-${offset}px)`,
                transition: spinning ? "transform 5s cubic-bezier(0.12, 0.82, 0.18, 1.0)" : "none",
              }}
            >
              {reelItems.map((item, idx) => {
                const isWinner = selectedPenalty && idx === WIN_INDEX && !spinning;
                return (
                  <div
                    key={idx}
                    style={{ width: `${CARD_WIDTH}px`, minWidth: `${CARD_WIDTH}px` }}
                    className={`h-32 shrink-0 rounded-xl border-2 flex flex-col justify-between p-3.5 text-center transition-all select-none bg-slate-900/90 border-slate-700/70 ${
                      isWinner
                        ? "border-amber-400 ring-4 ring-amber-400/50 scale-105 bg-amber-950/40 shadow-2xl shadow-amber-400/40"
                        : "opacity-80"
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 self-center px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30">
                      Penitencia #{item.id}
                    </span>
                    <p className="text-xs font-bold text-slate-100 line-clamp-3 my-auto leading-snug">
                      {item.text}
                    </p>
                    <div className="w-6 h-0.5 bg-slate-700/50 self-center rounded-full" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-2">
          {selectedPenalty ? (
            <div className="animate-in zoom-in-95 duration-200 space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl shadow-lg shadow-amber-500/5">
                <span className="text-xs font-black tracking-widest text-amber-400 uppercase">
                  🎯 PENITENCIA ASIGNADA 🎯
                </span>
                <p className="text-base sm:text-lg font-black text-white mt-1">
                  "{selectedPenalty.text}"
                </p>
              </div>

              {needsInput && (
                <div className="flex flex-col gap-1 text-left bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <label className="text-xs font-bold text-amber-300">
                    {penaltyId === 1 && "Escribe el campeón que le vas a imponer:"}
                    {penaltyId === 2 && "Selecciona los hechizos obligatorios:"}
                    {penaltyId === 3 && "Escribe cuál será el 2do ítem T R O L L:"}
                    {penaltyId === 15 && "Escribe la serie de skins / campeones a escoger:"}
                  </label>

                  {penaltyId === 2 ? (
                    <select
                      className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                      onChange={(e) => setCustomValue(e.target.value)}
                      defaultValue="ghost_heal"
                    >
                      <option value="ghost_heal">Fantasma + Curar</option>
                      <option value="exhaust_ignite">Extenuación + Prender</option>
                      <option value="cleanse_tp">Limpiar + Teleport</option>
                      <option value="smite_flash">Smite + Flash</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder={
                        penaltyId === 1 ? "Ej: Yuumi, Singed..." :
                        penaltyId === 3 ? "Ej: Sombrero de Rabadon de 2do item..." :
                        "Escribe las opciones aquí..."
                      }
                      className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                    />
                  )}
                </div>
              )}

              <button
                onClick={handleConfirmPenalty}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition"
              >
                Cerrar y Enviar Castigo 🚀
              </button>
            </div>
          ) : (
            <div className="flex justify-center gap-3">
              <button
                onClick={onClose}
                disabled={spinning}
                className="rounded-xl px-5 py-3 text-xs font-bold text-slate-400 hover:bg-slate-800 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSpin}
                disabled={spinning}
                className="group px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-blue-600/30 active:scale-95 transition flex items-center gap-2 disabled:opacity-50"
              >
                <span>{spinning ? "Girando el Destino..." : "🎰 Girar Ruleta"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}