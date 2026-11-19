// Flat mark: a violet square with the letter H, the wordmark in the interface face.
export default function Logo({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="on-accent grid h-7 w-7 place-items-center rounded-lg bg-violet-600">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M7 5v14M17 5v14M7 12h10" />
        </svg>
      </div>
      {!small && <span className="text-[17px] font-medium text-white">IT Hub</span>}
    </div>
  )
}
