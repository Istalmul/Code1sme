export function Divider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-4">
      <span className="h-px flex-1 bg-line" />
      <span className="text-[12px] uppercase tracking-wider text-subtle">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
