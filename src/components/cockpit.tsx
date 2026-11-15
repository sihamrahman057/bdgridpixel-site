import type { EventSettings } from "@/lib/types";

export function Cockpit({ settings }: { settings: EventSettings }) {
  const open = settings.eventStatus.toLowerCase().includes("open");
  return (
    <section className="cockpit" aria-label="Event">
      <div className="cockpit-stage">
        <CockpitDefs />
        <div className="cockpit-brow">
          <div className="brow-side">
            <span className="stitch" aria-hidden />
            <span>Driver</span>
          </div>
          <div className="brow-center" aria-hidden>
            <span className="lamp" data-on="true" />
            <span>D-section cluster</span>
            <span className="lamp" data-tone="red" data-on={open ? "false" : "true"} />
          </div>
          <div className="brow-side">
            <span>Instrument pack</span>
            <span className="stitch stitch-red" aria-hidden />
          </div>
        </div>

        <div className="cluster">
          <div className="cluster-column">
            <Dial
              label="Date"
              value={settings.eventDate}
              sub="Schedule"
              tone="green"
              needleAngle={-28}
              progress={0.72}
            />
            <div className="mini-row">
              <MiniGauge label="IGN" value="READY" tone="green" level={7} />
              <MiniGauge label="TEMP" value="72°" tone="white" level={4} />
            </div>
          </div>

          <div className="center-readout">
            <p className="center-kicker">Event</p>
            <h1 className="event-name">{settings.eventName}</h1>
            <p className="event-status">
              <span className="lamp" data-on={open ? "true" : "false"} aria-hidden />
              {settings.eventStatus}
            </p>

            <div className="warning-rail" aria-hidden>
              <WarnLight label="ABS" active={false} />
              <WarnLight label="OIL" active={false} tone="red" />
              <WarnLight label="BATT" active />
              <WarnLight label="DOOR" active={false} tone="red" />
              <WarnLight label="ESP" active />
            </div>

            <div className="center-screen" aria-hidden>
              <div className="screen-top">
                <span>Trip computer</span>
                <span>CH 01</span>
              </div>
              <div className="screen-grid">
                <div className="screen-cell">
                  <span className="pill-label">Mode</span>
                  <strong>Event</strong>
                </div>
                <div className="screen-cell">
                  <span className="pill-label">Lane</span>
                  <strong>Public</strong>
                </div>
                <div className="screen-cell">
                  <span className="pill-label">Link</span>
                  <strong>Live</strong>
                </div>
              </div>
              <div className="screen-wave" />
            </div>
          </div>

          <div className="cluster-column">
            <Dial
              label="Place"
              value={settings.eventPlace}
              sub="Venue"
              tone="red"
              needleAngle={34}
              progress={0.64}
            />
            <div className="mini-row">
              <MiniGauge label="FUEL" value="OK" tone="green" level={6} />
              <MiniGauge label="ALERT" value={open ? "OFF" : "ON"} tone="red" level={open ? 1 : 5} />
            </div>
          </div>
        </div>

        <div className="footer-rail" aria-hidden>
          <div className="vent-row">
            <div className="vent" />
            <div className="pill-row">
              <span className="pill">
                <span className="lamp" data-on="true" />
                Systems check
              </span>
              <span className="pill">
                <span className="lamp" data-tone="red" data-on={!open} />
                Hazard {open ? "clear" : "hold"}
              </span>
              <span className="pill">White bezel / green signal</span>
            </div>
            <div className="vent" />
          </div>
          <div className="horizon" />
        </div>
      </div>
    </section>
  );
}

function Dial({
  label,
  value,
  sub,
  tone,
  needleAngle,
  progress,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "green" | "red";
  needleAngle: number;
  progress: number;
}) {
  const ticks = Array.from({ length: 41 }, (_, index) => {
    const angle = (-210 + (index * 240) / 40) * (Math.PI / 180);
    const major = index % 5 === 0;
    const inner = major ? 58 : 68;
    const outer = 84;
    return (
      <line
        key={index}
        className={major ? undefined : "dial-ticks-minor"}
        x1={100 + Math.cos(angle) * outer}
        y1={108 + Math.sin(angle) * outer}
        x2={100 + Math.cos(angle) * inner}
        y2={108 + Math.sin(angle) * inner}
        strokeWidth={major ? 2 : 1}
      />
    );
  });

  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
    const angle = (-210 + (n * 240) / 8) * (Math.PI / 180);
    return (
      <text
        key={n}
        x={100 + Math.cos(angle) * 46}
        y={108 + Math.sin(angle) * 46 + 3}
        textAnchor="middle"
        fill={tone === "green" ? "#9fefb8" : "#ffb4b0"}
        fontSize="8"
        fontFamily="var(--font-geist-mono), monospace"
      >
        {n}
      </text>
    );
  });

  const end = -210 + progress * 240;
  const startRad = (-210 * Math.PI) / 180;
  const endRad = (end * Math.PI) / 180;
  const large = progress > 0.5 ? 1 : 0;
  const arcPath = [
    `M ${100 + Math.cos(startRad) * 78} ${108 + Math.sin(startRad) * 78}`,
    `A 78 78 0 ${large} 1 ${100 + Math.cos(endRad) * 78} ${108 + Math.sin(endRad) * 78}`,
  ].join(" ");

  return (
    <div className="dial" data-tone={tone} style={{ ["--needle-angle" as string]: `${needleAngle}deg` }}>
      <svg viewBox="0 0 200 200" aria-hidden>
        <circle className="dial-bezel" cx="100" cy="108" r="92" />
        <circle className="dial-face" cx="100" cy="108" r="84" />
        <circle className="dial-ring" cx="100" cy="108" r="80" />
        <circle className="dial-ring" cx="100" cy="108" r="70" strokeWidth="1" opacity="0.55" />
        <g className="dial-ticks">{ticks}</g>
        {numbers}
        <path className="dial-arc" d={arcPath} />
        <line className="dial-needle" x1="100" y1="108" x2="100" y2="42" />
        <circle className="dial-hub" cx="100" cy="108" r="5.5" />
      </svg>
      <div className="dial-readout">
        <p className="dial-kicker">{label}</p>
        <p className="dial-value">{value}</p>
        <p className="dial-sub">{sub}</p>
      </div>
    </div>
  );
}

function MiniGauge({
  label,
  value,
  tone,
  level,
}: {
  label: string;
  value: string;
  tone: "green" | "red" | "white";
  level: number;
}) {
  return (
    <div className="mini-gauge" data-tone={tone}>
      <div className="mini-top">
        <span className="rail-label" style={{ color: tone === "red" ? "var(--signal-red)" : tone === "white" ? "#f4f7f5" : "var(--signal-green)" }}>
          {label}
        </span>
        <span className="mini-value">{value}</span>
      </div>
      <div className="mini-bars" aria-hidden>
        {Array.from({ length: 8 }, (_, index) => (
          <span key={index} data-on={index < level ? "true" : "false"} style={{ height: `${30 + index * 8}%` }} />
        ))}
      </div>
    </div>
  );
}

function WarnLight({
  label,
  active = false,
  tone = "green",
}: {
  label: string;
  active?: boolean;
  tone?: "green" | "red";
}) {
  return (
    <span className="warn-light" data-active={active ? "true" : "false"} data-tone={tone}>
      <span className="lamp" data-tone={tone} data-on={active ? "true" : "false"} />
      {label}
    </span>
  );
}

function CockpitDefs() {
  return (
    <svg width="0" height="0" aria-hidden className="absolute">
      <defs>
        <radialGradient id="bezelFill" cx="35%" cy="20%" r="75%">
          <stop offset="0%" stopColor="#3a4641" />
          <stop offset="45%" stopColor="#1a221f" />
          <stop offset="100%" stopColor="#070908" />
        </radialGradient>
        <radialGradient id="faceFill" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#18201d" />
          <stop offset="70%" stopColor="#0c100e" />
          <stop offset="100%" stopColor="#050706" />
        </radialGradient>
      </defs>
    </svg>
  );
}
