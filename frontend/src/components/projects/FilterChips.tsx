interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterChipsProps {
  label: string
  allLabel: string
  options: FilterOption[]
  value: string | undefined
  onChange: (value: string | undefined) => void
}

/** Grupo de filtros com botões alternáveis (aria-pressed), operável por teclado. */
export function FilterChips({ label, allLabel, options, value, onChange }: FilterChipsProps) {
  const chip =
    'inline-flex min-h-11 items-center gap-2 rounded-pill border border-ink/15 px-4 text-sm transition-[background-color,border-color,color,transform] duration-fast hover:scale-[1.03] hover:border-ink/50 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-ink-inverse'

  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      <button type="button" aria-pressed={value === undefined} onClick={() => onChange(undefined)} className={chip}>
        {allLabel}
      </button>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={chip}
        >
          {option.label}
          {option.count !== undefined && <span className="font-mono text-[0.7rem] opacity-60">{option.count}</span>}
        </button>
      ))}
    </div>
  )
}
