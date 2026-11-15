export default function Loading() {
  return (
    <div className="cockpit" aria-busy="true">
      <div className="cockpit-stage">
        <p className="py-24 text-center font-mono text-xs tracking-[0.22em] text-muted-foreground uppercase">
          Bringing the cluster online…
        </p>
      </div>
    </div>
  );
}
