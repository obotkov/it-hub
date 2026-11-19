export default function Logo({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="on-accent relative grid h-8 w-8 place-items-center rounded-lg bg-violet-500">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 19 12 5l6 14M8.4 14h7.2" />
        </svg>
      </div>
      {!small && (
        <span className="text-[17px] font-semibold tracking-tight text-white">
          AI&nbsp;Studio<span className="text-violet-400">.</span>
        </span>
      )}
    </div>
  )
}
