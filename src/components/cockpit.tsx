"use client";

import { useEffect, useState } from "react";
import type { EventSettings } from "@/lib/types";
import { isRegistrationOpen } from "@/lib/time-bd";

const TARGET_SPEED = 248;
const BOOT_MS = 1800;

export function Cockpit({ settings }: { settings: EventSettings }) {
  const [open, setOpen] = useState(() =>
    isRegistrationOpen(settings.registrationClosesAt, settings.eventStatus),
  );
  const [speed, setSpeed] = useState(0);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const tick = () =>
      setOpen(isRegistrationOpen(settings.registrationClosesAt, settings.eventStatus));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [settings.registrationClosesAt, settings.eventStatus]);

  useEffect(() => {
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / BOOT_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      setSpeed(Math.round(TARGET_SPEED * eased));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setBooting(false);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const rpmProgress = Math.min(1, speed / TARGET_SPEED);
  const needleAngle = -120 + rpmProgress * 240;

  return (
    <section className="cockpit" aria-label="Race dashboard" data-booting={booting ? "true" : "false"}>
      <div className="cockpit-hud">
        <div className="race-top" aria-hidden>
          <span className="race-tag">Race HUD</span>
          <div className="shift-lights">
            {Array.from({ length: 10 }, (_, index) => {
              const on = rpmProgress > (index + 1) / 11;
              const tone = index < 6 ? "green" : index < 8 ? "white" : "red";
              return <span key={index} className="shift-light" data-on={on ? "true" : "false"} data-tone={tone} />;
            })}
          </div>
          <span className="race-tag race-tag-right">{open ? "Green flag" : "Hold"}</span>
        </div>

        <div className="race-grid">
          <aside className="race-column">
            <RaceDial
              label="RPM"
              value={`${Math.round(rpmProgress * 8)}.${Math.round((rpmProgress * 80) % 10)}`}
              unit="x1000"
              tone="green"
              needleAngle={needleAngle}
              progress={rpmProgress}
              redlineFrom={0.78}
            />
            <div className="telemetry-stack">
              <Telemetry label="GEAR" value={speed < 40 ? "N" : speed < 90 ? "2" : speed < 150 ? "4" : "6"} tone="white" />
              <Telemetry label="LAP" value="01" tone="green" />
              <Telemetry label="DELTA" value="-0.42" tone="green" />
            </div>
          </aside>

          <div className="race-center">
            <p className="center-kicker">Event</p>
            <h1 className="event-name">{settings.eventName}</h1>
            <p className="event-status">
              <span className="lamp" data-on={open ? "true" : "false"} aria-hidden />
              {open ? settings.eventStatus : "Registration closed"}
            </p>

            <div className="speed-block" aria-live="polite">
              <p className="speed-label">Speed</p>
              <p className="speed-digits">
                <span>{String(speed).padStart(3, "0")}</span>
                <span className="speed-unit">km/h</span>
              </p>
              <div className="speed-bar" aria-hidden>
                <span style={{ width: `${Math.min(100, (speed / TARGET_SPEED) * 100)}%` }} />
              </div>
              <p className="speed-note">{booting ? "Launch sequence" : "Race pace locked"}</p>
            </div>

            <dl className="race-meta">
              <div>
                <dt>Date</dt>
                <dd>{settings.eventDate}</dd>
              </div>
              <div>
                <dt>Place</dt>
                <dd>{settings.eventPlace}</dd>
              </div>
            </dl>
          </div>

          <aside className="race-column">
            <RaceDial
              label="THR"
              value={`${Math.round(rpmProgress * 100)}`}
              unit="%"
              tone="red"
              needleAngle={-120 + rpmProgress * 210}
              progress={rpmProgress * 0.88}
              redlineFrom={0.82}
            />
            <div className="telemetry-stack">
              <Telemetry label="TEMP" value="92°" tone="white" />
              <Telemetry label="FUEL" value="OK" tone="green" />
              <Telemetry label="ALERT" value={open ? "OFF" : "ON"} tone="red" />
            </div>
          </aside>
        </div>

        <div className="race-footer" aria-hidden>
          <div className="race-stripe" />
          <div className="pill-row">
            <span className="pill">
              <span className="lamp" data-on="true" />
              Systems ready
            </span>
            <span className="pill">
              <span className="lamp" data-tone="red" data-on={!open} />
              Pit {open ? "clear" : "hold"}
            </span>
            <span className="pill">Borderless race pack</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Frozen tick geometry so server and browser emit the same SVG attributes. */
const DIAL_TICKS: ReadonlyArray<readonly [string, string, string, string, boolean]> = [
  ["57.00", "25.52", "65.00", "39.38", true],
  ["63.65", "22.06", "67.04", "29.31", false],
  ["70.59", "19.19", "73.32", "26.70", false],
  ["77.74", "16.93", "79.81", "24.66", false],
  ["85.07", "15.31", "87.84", "31.06", true],
  ["92.50", "14.33", "93.20", "22.30", false],
  ["100.00", "14.00", "100.00", "22.00", false],
  ["107.50", "14.33", "106.80", "22.30", false],
  ["114.93", "15.31", "112.16", "31.06", true],
  ["122.26", "16.93", "120.19", "24.66", false],
  ["129.41", "19.19", "126.68", "26.70", false],
  ["136.35", "22.06", "132.96", "29.31", false],
  ["143.00", "25.52", "135.00", "39.38", true],
  ["149.33", "29.55", "144.74", "36.11", false],
  ["155.28", "34.12", "150.14", "40.25", false],
  ["160.81", "39.19", "155.15", "44.85", false],
  ["165.88", "44.72", "153.62", "55.00", true],
  ["170.45", "50.67", "163.89", "55.26", false],
  ["174.48", "57.00", "167.55", "61.00", false],
  ["177.94", "63.65", "170.69", "67.04", false],
  ["180.81", "70.59", "165.78", "76.06", true],
  ["183.07", "77.74", "175.34", "79.81", false],
  ["184.69", "85.07", "176.82", "86.46", false],
  ["185.67", "92.50", "177.70", "93.20", false],
  ["186.00", "100.00", "170.00", "100.00", true],
  ["185.67", "107.50", "177.70", "106.80", false],
  ["184.69", "114.93", "176.82", "113.54", false],
  ["183.07", "122.26", "175.34", "120.19", false],
  ["180.81", "129.41", "165.78", "123.94", true],
  ["177.94", "136.35", "170.69", "132.96", false],
  ["174.48", "143.00", "167.55", "139.00", false],
  ["170.45", "149.33", "163.89", "144.74", false],
  ["165.88", "155.28", "153.62", "145.00", true],
  ["160.81", "160.81", "155.15", "155.15", false],
  ["155.28", "165.88", "150.14", "159.75", false],
  ["149.33", "170.45", "144.74", "163.89", false],
  ["143.00", "174.48", "135.00", "160.62", true],
  ["136.35", "177.94", "132.96", "170.69", false],
  ["129.41", "180.81", "126.68", "173.30", false],
  ["122.26", "183.07", "120.19", "175.34", false],
  ["114.93", "184.69", "112.16", "168.94", true],
  ["107.50", "185.67", "106.80", "177.70", false],
  ["100.00", "186.00", "100.00", "178.00", false],
  ["92.50", "185.67", "93.20", "177.70", false],
  ["85.07", "184.69", "87.84", "168.94", true],
  ["77.74", "183.07", "79.81", "175.34", false],
  ["70.59", "180.81", "73.32", "173.30", false],
  ["63.65", "177.94", "67.04", "170.69", false],
  ["57.00", "174.48", "65.00", "160.62", true],
];

function RaceDial({
  label,
  value,
  unit,
  tone,
  needleAngle,
  progress,
  redlineFrom,
}: {
  label: string;
  value: string;
  unit: string;
  tone: "green" | "red";
  needleAngle: number;
  progress: number;
  redlineFrom: number;
}) {
  const ticks = DIAL_TICKS.map(([x1, y1, x2, y2, major], index) => {
    const inRed = index / 48 >= redlineFrom;
    return (
      <line
        key={index}
        className={major ? undefined : "dial-ticks-minor"}
        stroke={inRed ? "#e53935" : undefined}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        strokeWidth={major ? "2.2" : "1"}
      />
    );
  });

  const sweep = Math.min(1, Math.max(0, progress));
  const end = -120 + sweep * 240;
  const startRad = (-120 * Math.PI) / 180;
  const endRad = (end * Math.PI) / 180;
  const large = sweep > 0.5 ? 1 : 0;
  const arcPath =
    sweep < 0.004
      ? ""
      : [
          `M ${100 + Math.cos(startRad) * 80} ${100 + Math.sin(startRad) * 80}`,
          `A 80 80 0 ${large} 1 ${100 + Math.cos(endRad) * 80} ${100 + Math.sin(endRad) * 80}`,
        ].join(" ");

  const fillId = `faceFill-${label}`;

  return (
    <div className="dial race-dial" data-tone={tone} style={{ ["--needle-angle" as string]: `${needleAngle}deg` }}>
      <svg viewBox="0 0 200 200" aria-hidden>
        <defs>
          <radialGradient id={fillId} cx="50%" cy="42%" r="68%">
            <stop offset="0%" stopColor="#1a2420" />
            <stop offset="70%" stopColor="#0c1210" />
            <stop offset="100%" stopColor="#050807" />
          </radialGradient>
        </defs>
        <circle className="dial-face" cx="100" cy="100" r="90" fill={`url(#${fillId})`} />
        <circle className="dial-ring" cx="100" cy="100" r="88" />
        <g className="dial-ticks">{ticks}</g>
        {arcPath ? <path className="dial-arc" d={arcPath} /> : null}
        <line className="dial-needle race-needle" x1="100" y1="100" x2="100" y2="28" />
        <circle className="dial-hub" cx="100" cy="100" r="6" />
      </svg>
      <div className="dial-readout race-dial-readout">
        <p className="dial-kicker">{label}</p>
        <p className="dial-value">{value}</p>
        <p className="dial-sub">{unit}</p>
      </div>
    </div>
  );
}

function Telemetry({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "red" | "white";
}) {
  return (
    <div className="telemetry" data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

