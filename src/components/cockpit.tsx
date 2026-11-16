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
  const ticks = Array.from({ length: 49 }, (_, index) => {
    const angle = (-120 + (index * 240) / 48) * (Math.PI / 180);
    const major = index % 4 === 0;
    const inRed = index / 48 >= redlineFrom;
    return (
      <line
        key={index}
        className={major ? undefined : "dial-ticks-minor"}
        stroke={inRed ? "#e53935" : undefined}
        x1={100 + Math.cos(angle) * 86}
        y1={100 + Math.sin(angle) * 86}
        x2={100 + Math.cos(angle) * (major ? 70 : 78)}
        y2={100 + Math.sin(angle) * (major ? 70 : 78)}
        strokeWidth={major ? 2.2 : 1}
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

