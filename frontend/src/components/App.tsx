function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 410 410"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M205 410C318.218 410 410 318.218 410 205C410 91.7816 318.218 0 205 0C91.7816 0 0 91.7816 0 205C0 318.218 91.7816 410 205 410ZM205 360C290.604 360 360 290.604 360 205C360 119.396 290.604 50 205 50C119.396 50 50 119.396 50 205C50 290.604 119.396 360 205 360Z"
        fill="currentColor"
      />
    </svg>
  )
}

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-dominant font-sans text-on-dominant selection:bg-accent selection:text-on-accent">
      {/* HEADER: Blank header with logo + name */}
      <header className="sticky top-0 z-50 border-b border-accent/15 bg-secondary/95 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg border border-accent/20 bg-accent/10 p-1">
              <LogoIcon className="size-7 text-accent" />
            </div>
            <span className="flex items-center gap-1.5 text-xl font-bold tracking-tight text-on-secondary">
              ZeigDenStaat
            </span>
          </div>
        </div>
      </header>

      {/* SIMPLE BODY with welcome message */}
      <main className="flex grow items-center justify-center px-4 py-16">
        <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-accent/20 bg-secondary/50 p-8 text-center shadow-2xl md:p-12">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent" />

          <div className="relative z-10 flex flex-col items-center space-y-6">
            {/* The single <img> tag for the test to query */}
            <LogoIcon className="size-32 animate-pulse drop-shadow-[0_10px_20px_rgba(77,144,255,0.25)]" />

            <h1 className="text-3xl font-extrabold tracking-tight text-on-secondary md:text-4xl">
              Willkommen!
            </h1>

            <p className="text-sm leading-relaxed text-on-secondary/80 md:text-base">
              Wir bringen Licht ins Dunkel der Behörden und Ministerien in
              Deutschland.
            </p>

            <a
              href="#"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 font-bold text-on-accent shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent/90 active:scale-95"
            >
              Zum Canvas
            </a>
          </div>
        </div>
      </main>

      {/* FOOTER: As it is right now */}
      <footer className="border-t border-accent/15 bg-secondary py-12 text-on-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-3">
                <LogoIcon className="size-7 text-accent" />
                <span className="text-lg font-bold tracking-tight">
                  ZeigDenStaat
                </span>
              </div>
              <p className="max-w-sm text-xs leading-relaxed text-on-secondary/70">
                Ein Projekt zur Förderung der Transparenz und Übersicht über die
                föderalen und kommunalen Verwaltungsstrukturen des deutschen
                Staates.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-accent">
                Projekt Links
              </h4>
              <ul className="space-y-2 text-xs text-on-secondary/80">
                <li>
                  <a
                    href="#hero"
                    className="transition-colors duration-200 hover:text-accent"
                  >
                    Übersicht
                  </a>
                </li>
                <li>
                  <a
                    href="#stats"
                    className="transition-colors duration-200 hover:text-accent"
                  >
                    Statistik-Dashboard
                  </a>
                </li>
                <li>
                  <a
                    href="#explorer"
                    className="transition-colors duration-200 hover:text-accent"
                  >
                    Daten-Explorer
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-accent">
                Rechtliches
              </h4>
              <ul className="space-y-2 text-xs text-on-secondary/80">
                <li>
                  <a
                    href="#"
                    className="transition-colors duration-200 hover:text-accent"
                  >
                    Impressum
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="transition-colors duration-200 hover:text-accent"
                  >
                    Datenschutz
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="transition-colors duration-200 hover:text-accent"
                  >
                    Nutzungsbedingungen
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-accent/10 pt-8 sm:flex-row">
            <p className="text-[11px] text-on-secondary/50">
              &copy; {new Date().getFullYear()} ZeigDenStaat. Visualisierung von
              42.233 Institutionen.
            </p>
            <p className="flex items-center gap-1.5 text-[11px] text-on-secondary/50">
              Erstellt mit <span className="text-red-500">❤️</span> für
              Transparenz.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
