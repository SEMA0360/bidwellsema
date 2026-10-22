import { Crown, Lock, Download, Check } from 'lucide-react';

interface PaywallOverlayProps {
  title: string;
  message: string;
  onUpgrade: () => void;
  variant?: 'full' | 'preview';
  previewCount?: number;
  totalCount?: number;
  lockedLabel?: string;
}

export default function PaywallOverlay({
  title,
  message,
  onUpgrade,
  variant = 'full',
  previewCount,
  totalCount,
  lockedLabel,
}: PaywallOverlayProps) {
  if (variant === 'preview' && previewCount !== undefined && totalCount !== undefined) {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none blur-sm opacity-40 max-h-[300px] overflow-hidden">
          {/* Children render here blurred */}
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="glass rounded-2xl p-6 max-w-sm text-center shadow-card border border-accent/20">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold text-sm mb-1">{title}</h3>
            <p className="text-xs text-ink-400 mb-3 leading-relaxed">{message}</p>
            <div className="flex items-center justify-center gap-2 mb-3 text-xs text-ink-300">
              <span className="px-2 py-0.5 rounded-full bg-ok/10 text-ok border border-ok/30">{previewCount} free</span>
              <span className="text-ink-500">→</span>
              <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/30">{totalCount} total</span>
            </div>
            <button
              onClick={onUpgrade}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-ink-950 font-semibold text-sm hover:bg-accent/90 transition-colors"
            >
              <Crown className="w-4 h-4" />
              Unlock Full Access
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-7 h-7 text-accent" />
      </div>
      <h3 className="font-semibold text-base mb-1.5">{title}</h3>
      <p className="text-sm text-ink-400 mb-4 max-w-sm mx-auto leading-relaxed">{message}</p>
      {lockedLabel && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-ink-800 text-ink-300 border border-ink-700 mb-4">
          <Lock className="w-3 h-3" />
          {lockedLabel}
        </div>
      )}
      <div>
        <button
          onClick={onUpgrade}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-ink-950 font-semibold text-sm hover:bg-accent/90 transition-colors"
        >
          <Crown className="w-4 h-4" />
          Upgrade to Unlock
        </button>
      </div>
    </div>
  );
}

interface ExportButtonProps {
  onExport: () => void;
  onUpgrade: () => void;
  isPro: boolean;
  label: string;
  format: string;
}

export function GatedExportButton({ onExport, onUpgrade, isPro, label, format }: ExportButtonProps) {
  if (isPro) {
    return (
      <button
        onClick={onExport}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-ok/15 text-ok border border-ok/30 hover:bg-ok/25 transition-colors"
      >
        <Download className="w-4 h-4" />
        {label}
        <span className="text-xs text-ok/60 font-normal hidden sm:inline">({format})</span>
      </button>
    );
  }
  return (
    <button
      onClick={onUpgrade}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors animate-pulse-slow"
    >
      <Crown className="w-4 h-4" />
      {label}
      <span className="text-xs text-accent/60 font-normal hidden sm:inline">({format})</span>
    </button>
  );
}
