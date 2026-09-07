'use client'

import { useEffect, useMemo, useState } from 'react'

/**
 * Picks which variant row a product belongs to.
 *
 * This used to be a free-text box, which meant joining a row required typing
 * the exact string already on the other products. A typo silently created a
 * new group of one and the product dropped out of the row in the shop without
 * any error. Choosing from the groups that actually exist removes that whole
 * class of mistake, and makes "stands alone" a deliberate choice rather than
 * an empty field.
 */
export default function VariantGroupPicker({
  name = 'variant_group',
  initial = '',
  onChange,
}: {
  name?: string
  initial?: string
  onChange?: (group: string) => void
}) {
  const [groups, setGroups] = useState<{ group: string; count: number }[] | null>(null)
  const [value, setValue] = useState(initial)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/admin-proxy/products', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : []))
      .then(all => {
        if (!alive) return
        const list = Array.isArray(all) ? all : (all?.results ?? [])
        const counts = new Map<string, number>()
        for (const p of list) {
          const g = (p.variant_group ?? '').trim()
          if (g) counts.set(g, (counts.get(g) ?? 0) + 1)
        }
        setGroups(
          [...counts.entries()]
            .map(([group, count]) => ({ group, count }))
            .sort((a, b) => a.group.localeCompare(b.group, 'nb')),
        )
      })
      .catch(() => alive && setGroups([]))
    return () => { alive = false }
  }, [])

  // A group saved on this product but not seen elsewhere must still be offered,
  // otherwise opening the page would silently drop it.
  const options = useMemo(() => {
    const list = groups ?? []
    if (value && !list.some(g => g.group === value)) {
      return [{ group: value, count: 1 }, ...list]
    }
    return list
  }, [groups, value])

  const set = (v: string) => {
    setValue(v)
    onChange?.(v)
  }

  return (
    <div>
      {/* what the form actually submits */}
      <input type="hidden" name={name} value={value} />

      {creating ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="admin-form-input"
            autoFocus
            value={value}
            onChange={e => set(e.target.value)}
            placeholder="f.eks. vanlig-16"
            aria-label="Navn på ny variant-gruppe"
          />
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => { set(initial); setCreating(false) }}
          >
            Avbryt
          </button>
        </div>
      ) : (
        <select
          className="admin-form-select"
          value={value}
          onChange={e => {
            if (e.target.value === '__new__') { set(''); setCreating(true); return }
            set(e.target.value)
          }}
        >
          <option value="">Ingen — produktet står alene</option>
          {options.map(g => (
            <option key={g.group} value={g.group}>
              {g.group} ({g.count} {g.count === 1 ? 'produkt' : 'produkter'})
            </option>
          ))}
          <option value="__new__">+ Ny gruppe…</option>
        </select>
      )}

      <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', marginTop: 4 }}>
        {groups === null
          ? 'Henter grupper…'
          : value
            ? 'Produkter i samme gruppe vises som varianter av hverandre i butikken.'
            : 'Uten gruppe står produktet alene — ingen «Velg variant»-rad vises i butikken.'}
      </div>
    </div>
  )
}
