import type { ButtonHTMLAttributes, InputHTMLAttributes, PropsWithChildren, TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';

/**
 * Mobile app shell with centered viewport and soft background.
 */
export function MobileShell({ children }: PropsWithChildren) {
  return <div className="mx-auto min-h-dvh w-full max-w-md bg-slate-50 text-slate-900">{children}</div>;
}

/**
 * Sticky header with title and optional subtitle.
 */
export function Header({ title, subtitle, backTo }: { title: string; subtitle?: string; backTo?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        {backTo ? <Link to={backTo} className="text-xs font-medium text-slate-500">Back</Link> : null}
        <div>
          <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
    </header>
  );
}

/**
 * Reusable card container used for all section blocks.
 */
export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</section>;
}

/**
 * Shared button component with variant options.
 */
export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }>) {
  const classes = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800',
    secondary: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100',
  }[variant];

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition ${classes} ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * Styled single-line input.
 */
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-200 focus:ring ${props.className ?? ''}`}
    />
  );
}

/**
 * Styled multiline input.
 */
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-200 focus:ring ${props.className ?? ''}`}
    />
  );
}

/**
 * Compact label chip used for statuses and mode badges.
 */
export function Pill({ text }: { text: string }) {
  return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{text}</span>;
}

/**
 * Consistent section heading for document-style pages.
 */
export function SectionTitle({ label }: { label: string }) {
  return <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</h2>;
}
