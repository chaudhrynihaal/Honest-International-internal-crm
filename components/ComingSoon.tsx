export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="card flex min-h-[60vh] flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="max-w-sm text-sm text-foreground/60">
        This section is coming soon. For now, head back to Home to log entries and review
        your ledger.
      </p>
    </div>
  );
}
