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
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  type?: "button" | "submit";
};

const buttonStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-togo-green-500 text-white hover:bg-togo-green-600 shadow-sm",
  outline:
    "border border-togo-green-500 text-togo-green-700 hover:bg-togo-green-50",
  ghost: "text-togo-green-700 hover:bg-togo-green-50",
};

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  type = "button",
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors min-h-11";
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
      className={`rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5 ${className}`}
    >
      {children}
    </div>
  );
}

type BadgeTone = "green" | "yellow" | "red" | "neutral";

const badgeTones: Record<BadgeTone, string> = {
  green: "bg-togo-green-50 text-togo-green-700",
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
