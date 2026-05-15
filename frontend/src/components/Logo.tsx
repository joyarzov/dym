import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn('h-9 w-9', className)}
      role="img"
      aria-label="DyM Taller"
    >
      <defs>
        <linearGradient id="dym-mark" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFC24B" />
          <stop offset="1" stopColor="#E8830A" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#dym-mark)" />
      <rect x="1.5" y="1.5" width="29" height="29" rx="7.5" fill="none" stroke="#fff" strokeOpacity="0.28" />
      <path
        d="M9 21.5 L9 10.5 A1 1 0 0 1 10 9.5 L14.2 9.5 C18.4 9.5 21 12.1 21 16 C21 19.9 18.4 21.5 14.2 21.5 Z M12.4 18.4 L14 18.4 C16.3 18.4 17.5 17.4 17.5 16 C17.5 13.6 16.3 12.6 14 12.6 L12.4 12.6 Z"
        fill="#1A1206"
      />
      <circle cx="23.4" cy="11.1" r="2.05" fill="#1A1206" />
    </svg>
  );
}

export function Logo({
  className,
  subtitle = true,
}: {
  className?: string;
  subtitle?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <LogoMark />
      <div className="leading-none">
        <div className="font-heading text-lg font-semibold tracking-tight">
          DyM <span className="text-primary">Taller</span>
        </div>
        {subtitle && (
          <div className="mt-1 text-xs text-muted-foreground">
            Gestión de taller
          </div>
        )}
      </div>
    </div>
  );
}
