"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-start justify-center gap-4 px-6">
      <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">Interrupted</p>
      <h1 className="font-display text-4xl">The page could not load</h1>
      <p className="text-muted-foreground">Something failed while reading the event. Try again in a moment.</p>
      <button
        type="button"
        onClick={reset}
        className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        Try again
      </button>
    </main>
  );
}
