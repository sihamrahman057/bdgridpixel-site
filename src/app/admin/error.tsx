"use client";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col justify-center gap-4 px-6">
      <h1 className="font-display text-4xl">The panel hit a problem</h1>
      <p className="text-muted-foreground">The last action could not finish. Your guest list is unchanged unless a success message already appeared.</p>
      <button type="button" onClick={reset} className="h-10 w-fit rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
        Try again
      </button>
    </main>
  );
}
