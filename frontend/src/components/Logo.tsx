export function Logo({ size = 22 }: { size?: number }) {
  // The mark: a document node linked to three source nodes - the same
  // "claim traces to source" idea that runs through chat citations and
  // the knowledge graph. It's the one signature visual used throughout.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="8" height="10" rx="1.5" className="fill-primary-700" />
      <circle cx="18" cy="5" r="2.6" className="fill-accent-500" />
      <circle cx="19.5" cy="12" r="2.2" className="fill-accent-500" opacity="0.75" />
      <circle cx="17" cy="18.5" r="1.9" className="fill-accent-500" opacity="0.55" />
      <path
        d="M11 6L15.6 5.3M11 9.5L16.8 11.6M9.5 13L14.9 17.6"
        stroke="#D1D1D6"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
