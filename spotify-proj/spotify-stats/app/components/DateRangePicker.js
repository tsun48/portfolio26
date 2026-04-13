'use client'

export default function DateRangePicker({ from, to, onChange }) {
  const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last month', days: 30 },
    { label: 'Last 3 months', days: 90 },
    { label: 'Last year', days: 365 },
    { label: 'All time', days: null },
  ]

  function applyPreset(days) {
    if (!days) {
      onChange({ from: null, to: null })
      return
    }
    const toDate = new Date()
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)
    onChange({
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    })
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '2rem' }}>
      {presets.map(preset => {
        const isActive = preset.days === null
          ? !from && !to
          : from && Math.round((new Date(to) - new Date(from)) / 86400000) === preset.days

        return (
          <button
            key={preset.label}
            onClick={() => applyPreset(preset.days)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '0.5px solid',
              borderColor: isActive ? 'var(--color-border-info, #378ADD)' : 'var(--color-border-secondary, #ccc)',
              background: isActive ? 'var(--color-background-info, #E6F1FB)' : 'transparent',
              color: isActive ? 'var(--color-text-info, #0C447C)' : 'var(--color-text-secondary, #666)',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {preset.label}
          </button>
        )
      })}
      <input
        type="date"
        value={from ? from.slice(0, 10) : ''}
        onChange={e => onChange({ from: new Date(e.target.value).toISOString(), to })}
        style={{ fontSize: '13px', padding: '4px 8px', borderRadius: '8px', border: '0.5px solid #ccc' }}
      />
      <input
        type="date"
        value={to ? to.slice(0, 10) : ''}
        onChange={e => onChange({ from, to: new Date(e.target.value).toISOString() })}
        style={{ fontSize: '13px', padding: '4px 8px', borderRadius: '8px', border: '0.5px solid #ccc' }}
      />
    </div>
  )
}