'use client';

import React from 'react';
import { ProductForm } from '@/lib/ecommerce/types';

interface AyurvedicFormIllustrationProps {
  form: ProductForm;
  title: string;
  unit?: string;
  className?: string;
}

/**
 * Consistent, authentic vector packshot illustrations for classical Ayurvedic forms.
 * All illustrations share:
 * - 4:3 aspect ratio (viewBox="0 0 240 180")
 * - Identical calm neutral background (#F5F3ED light / #1E2522 dark)
 * - Identical perspective, elevation, and subtle soft contact shadow
 * - Authentic Ayurvedic packaging design (pouch, tablet bottle, tonic bottle, oil bottle, avaleha jar)
 */
export const AyurvedicFormIllustration: React.FC<AyurvedicFormIllustrationProps> = ({
  form,
  title,
  unit,
  className = '',
}) => {
  return (
    <div
      className={`relative w-full aspect-[4/3] rounded-md overflow-hidden flex items-center justify-center bg-[#F5F3ED] dark:bg-[#1E2522] border border-[#DDD8CB] dark:border-[#2B3530] select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 240 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain p-2"
      >
        <defs>
          {/* Subtle contact shadow */}
          <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.14" />
            <stop offset="70%" stopColor="#000000" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Amber glass gradient for bottles */}
          <linearGradient id="amberGlass" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#78350F" />
            <stop offset="25%" stopColor="#B45309" />
            <stop offset="70%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          {/* Herbal pouch craft gradient */}
          <linearGradient id="craftPouch" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E2D9CC" />
            <stop offset="35%" stopColor="#EFE8DD" />
            <stop offset="75%" stopColor="#E5DCcf" />
            <stop offset="100%" stopColor="#D4C9BC" />
          </linearGradient>

          {/* Dark bottle gradient */}
          <linearGradient id="darkBottle" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E3A2F" />
            <stop offset="40%" stopColor="#2D5A47" />
            <stop offset="85%" stopColor="#1E3A2F" />
            <stop offset="100%" stopColor="#132720" />
          </linearGradient>

          {/* Oil bottle glass */}
          <linearGradient id="oilGlass" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#854D0E" />
            <stop offset="30%" stopColor="#CA8A04" />
            <stop offset="75%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#A16207" />
          </linearGradient>

          {/* Label gradient */}
          <linearGradient id="creamLabel" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FCFBF7" />
            <stop offset="100%" stopColor="#F4EFE6" />
          </linearGradient>
        </defs>

        {/* Base Contact Shadow */}
        <ellipse cx="120" cy="155" rx="56" ry="9" fill="url(#shadowGrad)" />

        {/* ── Form: CHURNA (Craft Stand-up Herbal Pouch) ───────────────── */}
        {form === 'churna' && (
          <g transform="translate(0, 0)">
            {/* Pouch body */}
            <path
              d="M75 42 L165 42 L158 144 C158 147 155 150 150 150 L90 150 C85 150 82 147 82 144 Z"
              fill="url(#craftPouch)"
              stroke="#B3A594"
              strokeWidth="1.5"
            />
            {/* Heat seal top & tear notches */}
            <rect x="75" y="32" width="90" height="12" rx="2" fill="#D3C7B5" stroke="#B3A594" strokeWidth="1.2" />
            {/* Seal grip ridges */}
            <line x1="80" y1="36" x2="160" y2="36" stroke="#BAAE9D" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="80" y1="40" x2="160" y2="40" stroke="#BAAE9D" strokeWidth="1" strokeDasharray="3 2" />
            {/* Tear notches */}
            <path d="M75 40 L78 41 L75 42 Z" fill="#9C8F7E" />
            <path d="M165 40 L162 41 L165 42 Z" fill="#9C8F7E" />

            {/* Pouch Label */}
            <rect x="88" y="58" width="64" height="74" rx="3" fill="url(#creamLabel)" stroke="#D4CBBD" strokeWidth="1" />
            {/* Brand / Form mark */}
            <rect x="94" y="66" width="52" height="14" rx="2" fill="#0E6B52" opacity="0.9" />
            <text x="120" y="76" fill="#FFFFFF" fontSize="7.5" fontWeight="700" textAnchor="middle" letterSpacing="1">
              CHURNA
            </text>
            {/* Botanical sprig emblem */}
            <path
              d="M120 90 C120 86 116 83 113 83 C113 87 117 89 120 90 Z M120 90 C120 86 124 83 127 83 C127 87 123 89 120 90 Z M120 90 L120 102"
              stroke="#0E6B52"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="#0E6B52"
              fillOpacity="0.2"
            />
            {/* Label text lines */}
            <line x1="96" y1="108" x2="144" y2="108" stroke="#9C8F7E" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="102" y1="114" x2="138" y2="114" stroke="#C4B8A6" strokeWidth="1" strokeLinecap="round" />
            <line x1="106" y1="120" x2="134" y2="120" stroke="#C4B8A6" strokeWidth="1" strokeLinecap="round" />
            {/* Unit / Weight Pill */}
            <rect x="104" y="123" width="32" height="6" rx="2" fill="#E8F2ED" />
            <text x="120" y="127.5" fill="#0E6B52" fontSize="5" fontWeight="600" textAnchor="middle">
              {unit || '100 g'}
            </text>
          </g>
        )}

        {/* ── Form: VATI (Apothecary Tablet / Pill Bottle) ─────────────── */}
        {form === 'vati' && (
          <g transform="translate(0, 0)">
            {/* Bottle Body */}
            <rect x="85" y="58" width="70" height="88" rx="6" fill="url(#amberGlass)" stroke="#78350F" strokeWidth="1.2" />
            {/* Bottle Neck */}
            <rect x="98" y="44" width="44" height="15" rx="1" fill="#92400E" stroke="#78350F" strokeWidth="1" />
            {/* Ribbed Screw Cap */}
            <rect x="94" y="28" width="52" height="17" rx="3" fill="#F4EFE6" stroke="#D3C7B5" strokeWidth="1.2" />
            {/* Cap vertical ribbing */}
            <line x1="102" y1="30" x2="102" y2="43" stroke="#C4B8A6" strokeWidth="1" />
            <line x1="110" y1="30" x2="110" y2="43" stroke="#C4B8A6" strokeWidth="1" />
            <line x1="120" y1="30" x2="120" y2="43" stroke="#C4B8A6" strokeWidth="1" />
            <line x1="130" y1="30" x2="130" y2="43" stroke="#C4B8A6" strokeWidth="1" />
            <line x1="138" y1="30" x2="138" y2="43" stroke="#C4B8A6" strokeWidth="1" />

            {/* Front Label */}
            <rect x="92" y="70" width="56" height="66" rx="3" fill="url(#creamLabel)" stroke="#D4CBBD" strokeWidth="1" />
            {/* Header pill */}
            <rect x="98" y="76" width="44" height="12" rx="2" fill="#0E6B52" />
            <text x="120" y="85" fill="#FFFFFF" fontSize="7" fontWeight="700" textAnchor="middle" letterSpacing="0.8">
              VATI
            </text>
            {/* Stylized pills/tablets icon */}
            <circle cx="114" cy="98" r="4.5" fill="#E8F2ED" stroke="#0E6B52" strokeWidth="1" />
            <circle cx="126" cy="98" r="4.5" fill="#E8F2ED" stroke="#0E6B52" strokeWidth="1" />
            <line x1="111" y1="98" x2="117" y2="98" stroke="#0E6B52" strokeWidth="0.8" />
            <line x1="123" y1="98" x2="129" y2="98" stroke="#0E6B52" strokeWidth="0.8" />
            {/* Label details */}
            <line x1="98" y1="109" x2="142" y2="109" stroke="#9C8F7E" strokeWidth="1" strokeLinecap="round" />
            <line x1="104" y1="115" x2="136" y2="115" stroke="#C4B8A6" strokeWidth="0.8" strokeLinecap="round" />
            <text x="120" y="126" fill="#0E6B52" fontSize="5.5" fontWeight="600" textAnchor="middle">
              {unit || '80 Tablets'}
            </text>
          </g>
        )}

        {/* ── Form: ASAVA & ARISHTA (Amber Glass Fermented Tonic Bottle) ── */}
        {form === 'asava_arishta' && (
          <g transform="translate(0, 0)">
            {/* Slender Bottle Body */}
            <path
              d="M92 78 L92 144 C92 147 95 150 99 150 L141 150 C145 150 148 147 148 144 L148 78 C148 68 136 58 132 46 L132 36 L108 36 L108 46 C104 58 92 68 92 78 Z"
              fill="url(#amberGlass)"
              stroke="#78350F"
              strokeWidth="1.2"
            />
            {/* Cap & neck seal */}
            <rect x="105" y="24" width="30" height="13" rx="2" fill="#D97706" stroke="#92400E" strokeWidth="1" />
            <line x1="108" y1="31" x2="132" y2="31" stroke="#78350F" strokeWidth="1" />

            {/* Vertical Samhita Tonic Label */}
            <rect x="100" y="78" width="40" height="64" rx="2" fill="url(#creamLabel)" stroke="#D4CBBD" strokeWidth="1" />
            <rect x="104" y="84" width="32" height="12" rx="1.5" fill="#0E6B52" />
            <text x="120" y="93" fill="#FFFFFF" fontSize="6" fontWeight="700" textAnchor="middle" letterSpacing="0.5">
              ARISHTA
            </text>
            {/* Classical emblem */}
            <circle cx="120" cy="106" r="6" fill="#F4EFE6" stroke="#B45309" strokeWidth="1" />
            <path d="M120 102 L120 110 M116 106 L124 106" stroke="#B45309" strokeWidth="1" />
            <line x1="106" y1="120" x2="134" y2="120" stroke="#9C8F7E" strokeWidth="1" strokeLinecap="round" />
            <line x1="110" y1="126" x2="130" y2="126" stroke="#C4B8A6" strokeWidth="0.8" strokeLinecap="round" />
            <text x="120" y="136" fill="#0E6B52" fontSize="5.5" fontWeight="600" textAnchor="middle">
              {unit || '450 ml'}
            </text>
          </g>
        )}

        {/* ── Form: TAILA (Medicated Herbal Oil Bottle) ─────────────────── */}
        {form === 'taila' && (
          <g transform="translate(0, 0)">
            {/* Body */}
            <rect x="88" y="60" width="64" height="86" rx="5" fill="url(#oilGlass)" stroke="#854D0E" strokeWidth="1.2" />
            {/* Dropper / cap */}
            <rect x="102" y="44" width="36" height="17" rx="1" fill="#CA8A04" stroke="#854D0E" strokeWidth="1" />
            <path d="M106 44 L114 26 C116 23 124 23 126 26 L134 44 Z" fill="#1E2522" stroke="#000000" strokeWidth="1" />

            {/* Front Label with Oil Droplet Motif */}
            <rect x="95" y="74" width="50" height="64" rx="2.5" fill="url(#creamLabel)" stroke="#D4CBBD" strokeWidth="1" />
            <rect x="100" y="80" width="40" height="11" rx="1.5" fill="#0E6B52" />
            <text x="120" y="88.5" fill="#FFFFFF" fontSize="6.5" fontWeight="700" textAnchor="middle" letterSpacing="0.8">
              TAILA
            </text>
            {/* Droplet vector */}
            <path
              d="M120 97 C116 102 114 105 114 108 C114 112 116.5 114 120 114 C123.5 114 126 112 126 108 C126 105 124 102 120 97 Z"
              fill="#CA8A04"
              stroke="#A16207"
              strokeWidth="0.8"
            />
            <line x1="102" y1="121" x2="138" y2="121" stroke="#9C8F7E" strokeWidth="1" strokeLinecap="round" />
            <text x="120" y="131" fill="#0E6B52" fontSize="5.5" fontWeight="600" textAnchor="middle">
              {unit || '100 ml'}
            </text>
          </g>
        )}

        {/* ── Form: AVALEHA (Wide-Mouth Herbal Jam / Chyawanprash Jar) ──── */}
        {(form === 'avaleha' || form === 'ghrita') && (
          <g transform="translate(0, 0)">
            {/* Broad Jar Body */}
            <path
              d="M74 62 L166 62 L164 142 C164 146 160 150 155 150 L85 150 C80 150 76 146 76 142 Z"
              fill="url(#darkBottle)"
              stroke="#132720"
              strokeWidth="1.2"
            />
            {/* Jar Neck */}
            <rect x="80" y="52" width="80" height="11" fill="#1E3A2F" stroke="#132720" strokeWidth="1" />
            {/* Gold / Metallic Screw Lid */}
            <rect x="72" y="36" width="96" height="17" rx="3" fill="#D4AF37" stroke="#A88B2A" strokeWidth="1.2" />
            <line x1="76" y1="44" x2="164" y2="44" stroke="#F1E49C" strokeWidth="1" />

            {/* Broad Front Label */}
            <rect x="86" y="74" width="68" height="66" rx="3" fill="url(#creamLabel)" stroke="#D4CBBD" strokeWidth="1" />
            <rect x="92" y="82" width="56" height="13" rx="2" fill="#0E6B52" />
            <text x="120" y="91.5" fill="#FFFFFF" fontSize="7" fontWeight="700" textAnchor="middle" letterSpacing="0.8">
              {form === 'ghrita' ? 'GHRITA' : 'AVALEHA'}
            </text>
            {/* Traditional Sun/Herb Mandala */}
            <circle cx="120" cy="107" r="7" fill="#F4EFE6" stroke="#0E6B52" strokeWidth="1" />
            <circle cx="120" cy="107" r="3" fill="#0E6B52" />
            <line x1="94" y1="121" x2="146" y2="121" stroke="#9C8F7E" strokeWidth="1" strokeLinecap="round" />
            <text x="120" y="132" fill="#0E6B52" fontSize="5.5" fontWeight="600" textAnchor="middle">
              {unit || '1 kg'}
            </text>
          </g>
        )}

        {/* ── Fallback (Capsule / Decoction / General) ─────────────────── */}
        {form !== 'churna' && form !== 'vati' && form !== 'asava_arishta' && form !== 'taila' && form !== 'avaleha' && form !== 'ghrita' && (
          <g transform="translate(0, 0)">
            <rect x="86" y="52" width="68" height="94" rx="6" fill="url(#darkBottle)" stroke="#132720" strokeWidth="1.2" />
            <rect x="92" y="34" width="56" height="19" rx="2" fill="#E8F2ED" stroke="#0E6B52" strokeWidth="1.2" />
            <rect x="92" y="68" width="56" height="68" rx="2" fill="url(#creamLabel)" stroke="#D4CBBD" strokeWidth="1" />
            <rect x="98" y="76" width="44" height="12" rx="1.5" fill="#0E6B52" />
            <text x="120" y="85" fill="#FFFFFF" fontSize="6.5" fontWeight="700" textAnchor="middle" letterSpacing="0.8">
              AYURVEDA
            </text>
            <circle cx="120" cy="102" r="6" fill="#E8F2ED" stroke="#0E6B52" strokeWidth="1" />
            <line x1="98" y1="116" x2="142" y2="116" stroke="#9C8F7E" strokeWidth="1" strokeLinecap="round" />
            <text x="120" y="127" fill="#0E6B52" fontSize="5.5" fontWeight="600" textAnchor="middle">
              {unit || 'Standard'}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
