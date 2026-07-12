import { LogoIcon } from './LogoIcon'

export function Footer() {
  return (
    <footer className="border-t border-accent/15 bg-secondary py-12 text-on-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <LogoIcon className="size-14 text-accent" />
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
  )
}
