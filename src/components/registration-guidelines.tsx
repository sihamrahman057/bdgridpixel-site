const STEPS = [
  {
    title: "Fill every required field",
    body: "Use your real name, a reachable phone number, and a Gmail you check.",
  },
  {
    title: "Double-check before you submit",
    body: "Wrong digits or email mean the host cannot reach you about the event.",
  },
  {
    title: "Submit once",
    body: "You should see a confirmation. Only register again if you need a second guest.",
  },
  {
    title: "Watch the top-bar bell",
    body: "The host may post timing or gate updates there after you register.",
  },
] as const;

export function RegistrationGuidelines() {
  return (
    <section className="register-guide" aria-labelledby="register-guide-title">
      <div className="register-guide-inner">
        <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">Register guide</p>
        <h2 id="register-guide-title" className="mt-2 font-display text-3xl leading-none">
          How to register
        </h2>
        <ol className="register-guide-list">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="register-guide-num" aria-hidden="true">
                {index + 1}
              </span>
              <div className="register-guide-copy">
                <strong>{step.title}</strong>
                <span>{step.body}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
