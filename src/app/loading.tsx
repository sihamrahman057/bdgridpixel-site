export default function Loading() {
  return (
    <div className="cockpit" aria-busy="true">
      <div className="cockpit-hud">
        <p className="py-24 text-center font-mono text-xs tracking-[0.22em] text-muted-foreground uppercase">
          Launching race HUD…
        </p>
      </div>
    </div>
  );
}
