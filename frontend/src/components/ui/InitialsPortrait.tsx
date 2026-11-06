/**
 * Composição gráfica usada enquanto não existe fotografia real carregada no backoffice.
 * Não representa nenhuma pessoa: apenas as iniciais sobre um diagrama de sistema.
 */
export function InitialsPortrait({
  initials,
  label,
  fill = false,
}: {
  initials: string
  label: string
  fill?: boolean
}) {
  return (
    <svg
      viewBox="0 0 480 600"
      role="img"
      aria-label={`${label} ${initials}`}
      // fill: cobre toda a área (como object-fit: cover), usado como fundo do hero.
      preserveAspectRatio={fill ? 'xMidYMid slice' : undefined}
      className="h-full w-full"
    >
      <defs>
        <pattern id="portrait-dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="#B7A0D9" fillOpacity="0.35" />
        </pattern>
      </defs>
      <rect width="480" height="600" fill="#241521" />
      <rect width="480" height="600" fill="url(#portrait-dots)" />
      <circle cx="350" cy="150" r="110" fill="#FF5A36" />
      <rect x="40" y="420" width="150" height="150" fill="#F4D96B" />
      <g stroke="#B7A0D9" strokeWidth="2" fill="none">
        <path d="M115 420 V330 H350 V260" />
        <path d="M190 495 H300 V560" />
      </g>
      <g fill="#241521" stroke="#F7F1E8" strokeWidth="3">
        <circle cx="115" cy="330" r="9" />
        <circle cx="350" cy="260" r="9" />
        <circle cx="300" cy="560" r="9" />
      </g>
      <text
        x="40"
        y="300"
        fill="#F7F1E8"
        fontFamily="Bricolage Grotesque Variable, sans-serif"
        fontWeight="800"
        fontSize="200"
        letterSpacing="-10"
      >
        {initials}
      </text>
    </svg>
  )
}
