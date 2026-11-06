/** Curvas, durações e intensidades partilhadas — evita valores soltos nas secções. */
export const motionEase = [0.16, 1, 0.3, 1] as const

export const motionDuration = {
  fast: 0.28,
  base: 0.6,
  slow: 0.9,
  hero: 1.05,
} as const

export const motionDistance = {
  sm: 22,
  md: 40,
  lg: 56,
} as const

export const typewriterTiming = {
  typeMs: 46,
  deleteMs: 26,
  holdMs: 1700,
  gapMs: 320,
} as const
