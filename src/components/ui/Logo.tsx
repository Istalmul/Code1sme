type Props = { size?: number; withWordmark?: boolean; className?: string };

/**
 * Piasowo mark: a solid square with a stepped path through it — the mission
 * moving from signal to action. Flat, single colour, legible at 20px.
 */
export function Logo({ size = 28, withWordmark = true, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        role="img"
        aria-label="Piasowo"
        className="shrink-0"
      >
        <rect width="32" height="32" rx="8" className="fill-brand-600" />
        <path
          d="M9 22.5V15a2.5 2.5 0 0 1 2.5-2.5h3A2.5 2.5 0 0 0 17 10V9.5"
          fill="none"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="22.5" cy="21" r="2.6" fill="white" />
      </svg>
      {withWordmark && (
        <span className="text-[17px] font-semibold tracking-tight text-body">Piasowo</span>
      )}
    </span>
  );
}
