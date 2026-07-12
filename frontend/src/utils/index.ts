export function classNames(...classes: unknown[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getAbbrev(name: string, abbrev?: string): string {
  if (abbrev) return abbrev

  const match = name.match(/\(([^)]+)\)/)
  if (match) return match[1]
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}
