import React from 'react'

import ministeryBaseSvg from '../assets/icons/ministery-base.svg?raw'

function extractPathD(svgContent: string): string {
  const match = svgContent.match(/\bd="([^"]+)"/)
  return match ? match[1] : ''
}

const baseD = extractPathD(ministeryBaseSvg)

// Dynamically read all files in the ressorts directory as raw strings using Vite's glob import
const ressortFiles = import.meta.glob('../assets/icons/ressorts/*', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>

// Map lowercase abbreviation -> extracted path
const detailPaths: Record<string, string> = {}

for (const [filePath, fileContent] of Object.entries(ressortFiles)) {
  const fileName = filePath.split('/').pop() || ''
  // Handle both "name.svg" and "namesvg" naming styles
  const abbrevKey = fileName
    .replace(/\.svg$/, '')
    .replace(/svg$/, '')
    .toLowerCase()
  detailPaths[abbrevKey] = extractPathD(fileContent)
}

interface MinistryIconProps extends React.SVGProps<SVGSVGElement> {
  abbrev: string
  className?: string
}

export const MinistryIcon = ({
  abbrev,
  className,
  ...props
}: MinistryIconProps) => {
  const normalized = abbrev.toLowerCase()
  const key = normalized
  const detailPath = detailPaths[key]
  if (!detailPath) return null

  return (
    <svg viewBox="0 -960 960 960" className={className} fill="none" {...props}>
      {/* Base House: filled with accent color */}
      <path d={baseD} className="fill-accent text-accent" />
      {/* Detail Path: filled with on-accent color inside the circle */}
      <path
        d={detailPath}
        className="fill-on-accent text-on-accent"
        transform="translate(590, -190) scale(0.270833)"
      />
    </svg>
  )
}

export function hasMinistryIcon(abbrev: string): boolean {
  const normalized = abbrev.toLowerCase()
  return normalized in detailPaths
}
