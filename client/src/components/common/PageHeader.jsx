const PageHeader = ({ kicker, title, subtitle, actions }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {kicker && (
        <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
          <span className="h-px w-6 bg-primary/50" />
          {kicker}
        </p>
      )}
      <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
