const EmptyState = ({ icon: Icon, title, description, children }) => (
  <div className="relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl border border-dashed px-6 py-14 text-center">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-primary/5 blur-2xl" />
      <div className="absolute -bottom-12 -right-8 h-40 w-40 rounded-full bg-primary/8 blur-2xl" />
      <svg
        viewBox="0 0 200 120"
        fill="none"
        className="absolute left-1/2 top-6 h-28 w-auto -translate-x-1/2 text-primary/10"
        aria-hidden="true"
      >
        <circle cx="100" cy="60" r="52" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" />
        <circle cx="48" cy="30" r="7" fill="currentColor" opacity="0.55" />
        <circle cx="158" cy="42" r="5" fill="currentColor" opacity="0.4" />
        <rect x="150" y="86" width="16" height="16" rx="4" transform="rotate(18 150 86)" fill="currentColor" opacity="0.35" />
        <rect x="34" y="88" width="11" height="11" rx="3" transform="rotate(-14 34 88)" fill="currentColor" opacity="0.3" />
      </svg>
    </div>

    {Icon ? (
      <span className="relative flex h-20 w-20 items-center justify-center rounded-full border border-border/70 bg-background shadow-soft">
        <Icon className="h-9 w-9 text-primary/50" />
      </span>
    ) : null}
    <h3 className="relative font-display text-lg font-semibold">{title}</h3>
    {description ? (
      <p className="relative max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    ) : null}
    {children ? <div className="relative mt-1">{children}</div> : null}
  </div>
);

export default EmptyState;
