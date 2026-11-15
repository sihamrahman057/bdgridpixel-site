import { Suspense } from "react";
import Link from "next/link";
import { Cockpit } from "@/components/cockpit";
import { EventBanner } from "@/components/event-banner";
import { RegisterForm } from "@/components/register-form";
import { getSettings, listFields } from "@/lib/event-store";

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const [settings, fields] = await Promise.all([getSettings(), listFields()]);
  return (
    <>
      <Cockpit settings={settings} />
      <EventBanner settings={settings} />
      <RegisterForm
        fields={fields}
        closesAt={settings.registrationClosesAt}
        statusText={settings.eventStatus}
      />
      <footer className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>One list for this event. The host clears it when the night is over.</p>
        <Link href="/admin" className="text-foreground underline-offset-4 hover:underline">
          Staff
        </Link>
      </footer>
    </>
  );
}

function HomeFallback() {
  return (
    <div className="cockpit" aria-busy="true" aria-live="polite">
      <div className="cockpit-hud">
        <p className="py-24 text-center font-mono text-xs tracking-[0.22em] text-muted-foreground uppercase">
          Launching race HUD…
        </p>
      </div>
    </div>
  );
}
