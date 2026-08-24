'use client';
import React from 'react';

export default function Logo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 group ${className}`}>
      {/* Resplandor de fondo estilo Neón */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-pink-500 rounded-full blur-md opacity-60 group-hover:opacity-100 transition duration-300 animate-pulse pointer-events-none" />

      <svg
        viewBox="0 0 200 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-300 select-none"
      >
        <defs>
          {/* Gradientes */}
          <linearGradient id="shieldBorder" x1="0" y1="0" x2="200" y2="220" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F43F5E" />
            <stop offset="0.5" stopColor="#38BDF8" />
            <stop offset="1" stopColor="#FACC15" />
          </linearGradient>
          <linearGradient id="shieldBg" x1="100" y1="10" x2="100" y2="200" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0F172A" />
            <stop offset="1" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="shellBody" x1="60" y1="40" x2="140" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" />
            <stop offset="0.6" stopColor="#0284C7" />
            <stop offset="1" stopColor="#0369A1" />
          </linearGradient>
          <linearGradient id="textGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>
        </defs>

        {/* 1. ESCUDO TRASERO CON RELÁMPAGOS */}
        {/* Borde exterior grueso */}
        <path
          d="M100 8 L165 32 L165 65 L182 65 L160 115 L175 115 L100 205 L25 115 L40 115 L18 65 L35 65 L35 32 Z"
          fill="#0B0F19"
          stroke="url(#shieldBorder)"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Fondo del Escudo */}
        <path
          d="M100 16 L155 38 L155 70 L170 70 L150 110 L162 110 L100 190 L38 110 L50 110 L30 70 L45 70 L45 38 Z"
          fill="url(#shieldBg)"
        />

        {/* Rayas / Aros Neón Interiores */}
        <path
          d="M100 24 L145 44 L145 105 L100 170 L55 105 L55 44 Z"
          stroke="#FACC15"
          strokeWidth="3"
          strokeLinejoin="round"
          opacity="0.8"
        />

        {/* 2. ALITAS DE LA BLUE SHELL */}
        <path d="M48 68 C35 60 25 72 32 82 C38 90 52 86 56 80 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
        <path d="M152 68 C165 60 175 72 168 82 C162 90 148 86 144 80 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />

        {/* 3. CAPARAZÓN AZUL (BLUE SHELL) */}
        {/* Cuerpo Principal */}
        <path
          d="M100 32 C68 32 50 56 50 82 C50 102 70 118 100 118 C130 118 150 102 150 82 C150 56 132 32 100 32 Z"
          fill="url(#shellBody)"
          stroke="#0F172A"
          strokeWidth="4"
        />

        {/* Borde Inferior del Caparazón */}
        <path
          d="M54 94 C65 108 82 116 100 116 C118 116 135 108 146 94 C138 102 120 108 100 108 C80 108 62 102 54 94 Z"
          fill="#F8FAFC"
        />

        {/* Pinchos / Púas Blancas */}
        <polygon points="100,22 93,34 107,34" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points="72,30 70,42 82,38" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points="128,30 118,38 130,42" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" strokeLinejoin="round" />

        {/* 4. CARA TIERNA KAWAII */}
        {/* Ojos brillantes grandes */}
        <ellipse cx="85" cy="72" rx="6.5" ry="9" fill="#0F172A" />
        <ellipse cx="115" cy="72" rx="6.5" ry="9" fill="#0F172A" />
        {/* Brillos blancos en los ojos */}
        <circle cx="83" cy="69" r="3" fill="#FFFFFF" />
        <circle cx="87" cy="76" r="1.5" fill="#FFFFFF" />
        <circle cx="113" cy="69" r="3" fill="#FFFFFF" />
        <circle cx="117" cy="76" r="1.5" fill="#FFFFFF" />

        {/* Sonrojo tierno rosado */}
        <ellipse cx="76" cy="82" rx="4.5" ry="2.5" fill="#FB7185" opacity="0.8" />
        <ellipse cx="124" cy="82" rx="4.5" ry="2.5" fill="#FB7185" opacity="0.8" />

        {/* Boca feliz sonriente */}
        <path d="M94 79 Q100 87 106 79" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="#E11D48" />

        {/* 5. BANNER / CARTEL TIPOGRÁFICO ESPORTS */}
        {/* Caja del Cartel Principal */}
        <g transform="translate(0, 10)">
          {/* Sombra / Borde exterior del cartel */}
          <path
            d="M20 120 L180 120 L170 158 L100 168 L30 158 Z"
            fill="#090D16"
            stroke="#F43F5E"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* Texto SOLOQ 3D */}
          <text
            x="100"
            y="148"
            textAnchor="middle"
            fill="url(#textGrad)"
            stroke="#090D16"
            strokeWidth="5"
            paintOrder="stroke fill"
            fontSize="32"
            fontWeight="900"
            letterSpacing="1.5"
            fontFamily="Impact, Arial Black, sans-serif"
          >
            SOLOQ
          </text>
          {/* Letra 'Q' dorada como en el original */}
          <text
            x="148"
            y="148"
            textAnchor="middle"
            fill="url(#goldGrad)"
            stroke="#090D16"
            strokeWidth="5"
            paintOrder="stroke fill"
            fontSize="32"
            fontWeight="900"
            fontFamily="Impact, Arial Black, sans-serif"
          >
            Q
          </text>

          {/* Cinta inferior: CHALLENGE */}
          <path
            d="M45 158 L155 158 L148 180 L100 188 L52 180 Z"
            fill="#0F172A"
            stroke="#38BDF8"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <text
            x="100"
            y="176"
            textAnchor="middle"
            fill="#F8FAFC"
            fontSize="12"
            fontWeight="900"
            letterSpacing="2.5"
            fontFamily="sans-serif"
          >
            CHALLENGE
          </text>
        </g>
      </svg>
    </div>
  );
}