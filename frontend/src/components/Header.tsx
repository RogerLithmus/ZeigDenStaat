import { LogoIcon } from './LogoIcon'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-accent/15 bg-secondary/95 py-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg border border-accent/20 bg-accent/10 p-1">
            <LogoIcon className="size-7 text-accent" />
          </div>
          <span className="flex items-center gap-1.5 text-xl font-bold tracking-tight text-on-secondary">
            <span className="text-accent">🏛️</span> ZeigDenStaat
          </span>
        </div>
      </div>
    </header>
  )
}
