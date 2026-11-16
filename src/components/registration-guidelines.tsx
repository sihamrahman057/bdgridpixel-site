export function RegistrationGuidelines() {
  return (
    <section className="register-guide" aria-labelledby="register-guide-title">
      <div className="register-guide-inner">
        <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">Register guide</p>
        <h2 id="register-guide-title" className="mt-2 font-display text-3xl leading-none">
          How to register
        </h2>
        <ol className="register-guide-list">
          <li>
            <strong>Fill every required field</strong>
            <span>Use your real name, a reachable phone number, and a Gmail you check.</span>
          </li>
          <li>
            <strong>Double-check before you submit</strong>
            <span>Wrong digits or email mean the host cannot reach you about the event.</span>
          </li>
          <li>
            <strong>Submit once</strong>
            <span>You should see a confirmation. Only register again if you need a second guest.</span>
          </li>
          <li>
            <strong>Watch the top-bar bell</strong>
            <span>The host may post timing or gate updates there after you register.</span>
          </li>
        </ol>
      </div>
    </section>
  );
}
