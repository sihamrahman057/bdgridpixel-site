import type { EventSettings } from "@/lib/types";

export function Cockpit({ settings }: { settings: EventSettings }) {
  const open = settings.eventStatus.toLowerCase().includes("open");
  return (
    <section className="cockpit" aria-label="Event">
      <div className="cockpit-stage">
        <div className="cockpit-brow">
          <span className="stitch" aria-hidden />
          <span>Driver</span>
          <span>D-section</span>
        </div>
        <div className="cluster">
          <Dial label="Date" value={settings.eventDate} />
          <div className="center-readout">
            <p className="center-kicker">Event</p>
            <h1 className="event-name">{settings.eventName}</h1>
            <p className="event-status">
              <span className="lamp" data-on={open ? "true" : "false"} aria-hidden />
              {settings.eventStatus}
            </p>
          </div>
          <Dial label="Place" value={settings.eventPlace} />
        </div>
        <div className="horizon" aria-hidden />
      </div>
    </section>
  );
}

function Dial({ label, value }: { label: string; value: string }) {
  const ticks = Array.from({ length: 28 }, (_, index) => {
    const angle = (-210 + (index * 240) / 27) * (Math.PI / 180);
    const inner = index % 4 === 0 ? 62 : 70;
    return (
      <line
        key={index}
        x1={100 + Math.cos(angle) * 82}
        y1={108 + Math.sin(angle) * 82}
        x2={100 + Math.cos(angle) * inner}
        y2={108 + Math.sin(angle) * inner}
      />
    );
  });

  return (
    <div className="dial">
      <svg viewBox="0 0 200 200" aria-hidden>
        <circle className="dial-ring" cx="100" cy="108" r="86" />
        <g className="dial-ticks">{ticks}</g>
        <path className="dial-arc" d="M34 132 A78 78 0 1 1 166 132" />
      </svg>
      <div className="dial-readout">
        <p className="dial-kicker">{label}</p>
        <p className="dial-value">{value}</p>
      </div>
    </div>
  );
}
