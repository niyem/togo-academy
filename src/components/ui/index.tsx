// Lightweight, dependency-free UI primitives for the Togo Academy design system.
// Kept small and server-friendly (no client JS) to stay fast on slow connections.

import Link from "next/link";
import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}

export function Section({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`py-10 sm:py-14 ${className}`}>{children}</section>;
}

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "on-dark";
  className?: string;
  type?: "button" | "submit";
};

const buttonStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-togo-green-600 text-white hover:bg-togo-green-700 shadow-sm",
  secondary:
    "border border-[var(--color-line)] bg-white text-ink hover:border-togo-green-500 hover:text-togo-green-700",
  outline:
    "border border-togo-green-500 text-togo-green-700 hover:bg-togo-green-50",
  ghost: "text-togo-green-700 hover:bg-togo-green-50",
  "on-dark": "border border-white/25 text-white hover:bg-white/10",
};

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  type = "button",
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors min-h-11";
  const cls = `${base} ${buttonStyles[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls}>
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-togo-green-100 bg-togo-green-50 p-5 ${className}`}
    >
      {children}
    </div>
  );
}

type BadgeTone = "green" | "yellow" | "red" | "neutral";

const badgeTones: Record<BadgeTone, string> = {
  green: "border border-togo-green-100 bg-white text-togo-green-700",
  yellow: "bg-togo-yellow-100 text-togo-yellow-600",
  red: "bg-togo-red-100 text-togo-red-700",
  neutral: "bg-[var(--color-line)] text-[var(--color-muted)]",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeTones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Petit libelle editorial en capitales, au-dessus des grands titres. */
export function Eyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`text-xs font-semibold uppercase tracking-[0.15em] text-togo-green-600 ${className}`}
    >
      {children}
    </div>
  );
}

/** Pastille de couleur (niveaux : vert primaire, jaune college, rouge lycee). */
export function LevelDot({
  color,
  className = "",
}: {
  color: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-block h-2.5 w-2.5 rounded-full ${color} ${className}`}
    />
  );
}

/** Logo TogoAcademy : carre + toque, texte en serif editorial.
 *  `onDark` : variante pour fonds sombres (en-tete/pied vert foret). */
export function BrandMark({
  small = false,
  onDark = false,
}: {
  small?: boolean;
  onDark?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-lg ${
          onDark ? "bg-white text-forest" : "bg-togo-green-600 text-white"
        } ${small ? "h-7 w-7" : "h-8 w-8"}`}
      >
        <svg
          width={small ? 16 : 18}
          height={small ? 16 : 18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 8.5 L12 4 L22 8.5 L12 13 Z" />
          <path d="M6 10.6 V15.2 C6 15.2 8.4 17.2 12 17.2 C15.6 17.2 18 15.2 18 15.2 V10.6" />
          <path d="M22 8.5 V13.5" />
        </svg>
      </span>
      <span
        className={`font-display tracking-tight ${small ? "text-lg" : "text-xl"} ${
          onDark ? "text-white" : ""
        }`}
      >
        Togo
        <span className={onDark ? "text-togo-yellow-400" : "text-togo-green-600"}>
          Academy
        </span>
      </span>
    </span>
  );
}

/** Thin tri-colour bar echoing the Togolese flag; a subtle brand motif. */
export function FlagBar({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-1.5 w-full overflow-hidden ${className}`}>
      <div className="flex-1 bg-togo-green-500" />
      <div className="flex-1 bg-togo-yellow-400" />
      <div className="flex-1 bg-togo-red-500" />
    </div>
  );
}
