# FlowForge AI Design System

A mobile-first, premium dark UI design system tailored for AI-driven SaaS applications.

## 1. Design Tokens

### Colors
- **Background**: `#0a0a0a` (Deep Black) - Primary background for the entire application.
- **Surface**: `#141414` (Soft Black) - Background for cards, panels, and modals.
- **Surface Hover**: `#1a1a1a` - Interactive surface state.
- **Border**: `rgba(255, 255, 255, 0.08)` - Subtle separation for cards and inputs.
- **Primary**: `#6366f1` (Indigo 500) - Main brand color for actions and highlights.
- **Secondary**: `#f59e0b` (Amber 500) - Accent color for AI-related features.

### Typography
- **Sans-serif**: `Inter` - Used for all UI text, headings, and body.
- **Monospace**: `JetBrains Mono` - Used for code snippets, IDs, and technical data.

### Spacing & Radius
- **Base Unit**: `4px`
- **Card Radius**: `24px` (3xl) - Large, friendly corners for a modern feel.
- **Button Radius**: `12px` (xl) - Balanced radius for touch-friendly buttons.
- **Chip Radius**: `9999px` (Full) - Pill-shaped status indicators.

---

## 2. Component List

### Cards
- **Standard Card**: `bg-surface border border-border rounded-card p-6 shadow-premium`.
- **Interactive Card**: Same as above with `hover:border-primary/30 transition-all active:scale-[0.98]`.

### Status Chips
- **Draft**: `bg-white/5 text-gray-400 border border-white/10`
- **Active**: `bg-indigo-500/10 text-indigo-400 border border-indigo-500/20`
- **Error**: `bg-red-500/10 text-red-400 border border-red-500/20`
- **Success**: `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`

### AI State Indicators
- **Idle**: Pulsing indigo dot or `Sparkles` icon in low opacity.
- **Generating**: `Loader2` rotating with a `shadow-glow` effect.
- **Success**: Quick green flash or `Check` icon with a subtle bounce.
- **Failed**: Red `X` icon with a shake animation.

### Navigation
- **Sticky Top Bar**: `sticky top-0 z-50 glass h-16 flex items-center px-4`.
- **Bottom Nav**: `fixed bottom-0 left-0 right-0 h-16 glass border-t border-white/5 flex justify-around items-center pb-safe`.
- **Segmented Control**: `flex p-1 bg-white/5 rounded-xl` with `flex-1 py-2 text-xs font-bold uppercase tracking-widest`.

---

## 3. Reusable UI Patterns

### Mobile-First Layout
- Use `h-[100dvh]` for full-screen containers to handle mobile browser chrome.
- Implement `overscroll-none` on the main wrapper to prevent pull-to-refresh interference.
- Use `pb-safe` and `pt-safe` utilities to respect device notches and home indicators.

### AI Interaction Pattern
1. **Input**: User types in a `glass` styled input field.
2. **Processing**: Show a "Generating" state in the specific UI area (e.g., suggestions panel) with a skeleton loader or pulsing animation.
3. **Delivery**: Animate new content in using `framer-motion` (e.g., `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`).
4. **Feedback**: Show a success toast or a temporary "Forged" badge.

### Destructive Actions
- Never use native `confirm()`.
- Always use a `ConfirmModal` with a `danger` type (red buttons) and a clear explanation of consequences.
