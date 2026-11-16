import { Suspense } from "react";
import { Cockpit } from "@/components/cockpit";
import { EventBanner } from "@/components/event-banner";
import { RegisterForm } from "@/components/register-form";
import { RegistrationGuidelines } from "@/components/registration-guidelines";
import { SiteFooter } from "@/components/site-footer";
import { SiteTopBar } from "@/components/site-top-bar";
import { getSettings, listFields, listNotifications } from "@/lib/event-store";

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const [settings, fields, notifications] = await Promise.all([
    getSettings(),
    listFields(),
    listNotifications(),
  ]);
  return (
    <div className="site-shell">
      <SiteTopBar settings={settings} notifications={notifications} />
      <main className="site-main">
        <Cockpit settings={settings} />
        <EventBanner settings={settings} />
        <RegisterForm
          fields={fields}
          closesAt={settings.registrationClosesAt}
          statusText={settings.eventStatus}
        />
        <RegistrationGuidelines />
      </main>
      <SiteFooter settings={settings} />
    </div>
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
