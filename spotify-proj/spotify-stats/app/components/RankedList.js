'use client'

export default function RankedList({ items, nameKey, subKey, countKey, countLabel }) {
  if (!items?.length) return <p style={{ color: 'var(--color-text-secondary, #666)', fontSize: '14px' }}>No data yet.</p>

  const max = items[0][countKey]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.slice(0, 10).map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary, #999)', minWidth: '20px', textAlign: 'right' }}>
            {i + 1}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{item[nameKey]}</span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary, #666)' }}>
                {item[countKey]} {countLabel}
              </span>
            </div>
            {subKey && (
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary, #666)', margin: '0 0 4px' }}>
                {item[subKey]}
              </p>
            )}
            <div style={{ height: '3px', borderRadius: '2px', background: 'var(--color-border-tertiary, #eee)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.round((item[countKey] / max) * 100)}%`,
                background: 'var(--color-text-info, #378ADD)',
                borderRadius: '2px',
              }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}