export function TitleScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-blood">
        A political personality exercise
      </p>

      <h1 className="font-display text-4xl leading-[0.95] tracking-tight text-bone text-glow sm:text-6xl md:text-7xl">
        The Dark Triad
        <br />
        of MAGA
      </h1>

      <p className="mt-6 max-w-xl text-sm leading-relaxed text-ash sm:text-base">
        You will be shown Trump-administration officials and Republican
        politicians one at a time. Drop each of them onto the triangle where you
        think they belong between{' '}
        <span className="text-narc">Narcissism</span>,{' '}
        <span className="text-mach">Machiavellianism</span>, and{' '}
        <span className="text-psych">Psychopathy</span>.
      </p>

      <button
        type="button"
        onClick={onEnter}
        className="group mt-10 rounded-md border border-blood/60 bg-blood/10 px-8 py-3 font-display text-sm uppercase tracking-[0.2em] text-bone transition hover:bg-blood/20 hover:ring-glow focus:outline-none focus-visible:ring-glow"
      >
        Enter
      </button>

      <p className="mt-6 text-xs text-faint">
        Your progress is saved in this browser only.
      </p>
    </div>
  );
}
