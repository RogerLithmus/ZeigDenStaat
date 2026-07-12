import logoUrl from '../assets/logo.svg'

interface LogoIconProps {
  className?: string
}

export function LogoIcon({ className }: LogoIconProps) {
  return <img src={logoUrl} className={className} alt="ZeigDenStaat Logo" />
}
