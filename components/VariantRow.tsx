'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * Shows the VELG VARIANT row exactly as the shop renders it.
 *
 * Those chips are not fields on this product: each one is a separate product
 * that shares this product's variant_group, showing its own variant_label.
 * Editing the label here renames one chip. The row is displayed so it is
 * obvious which chips exist and which one is being edited, with links to the
 * others rather than letting this page rename products it isn't editing.
 */
export default function VariantRow({
  group,
  currentId,
  currentLabel,
}: {
  group: string
  currentId: number | string
  currentLabel: string
}) {
  const [siblings, setSiblings] = useState<any[] | null>(null)

  useEffect(() => {
    if (!group) { setSiblings([]); return }
    let alive = true
    fetch('/api/admin-proxy/products', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : []))
      .then(all => {
        if (!alive) return
        const list = Array.isArray(all) ? all : (all?.results ?? [])
        setSiblings(list.filter((p: any) => p.variant_group && p.variant_group === group))
      })
      .catch(() => alive && setSiblings([]))
    return () => { alive = false }
  }, [group])

  // The picker above already says what "no group" means, so saying it twice
  // two lines apart just reads as clutter.
  if (!group) return null

  if (siblings === null) return <div className="variant-row-empty">Henter varianter…</div>

  if (siblings.length < 2) {
    return (
      <div className="variant-row-empty">
        Bare dette produktet har gruppen «{group}». Butikken skjuler raden til minst to produkter deler den.
      </div>
    )
  }

  return (
    <div>
      <div className="flavor-preview-stage">
        <div className="flavor-preview-heading">Velg variant</div>
        <div className="variant-row-chips">
          {siblings.map(s => {
            const isCurrent = String(s.id) === String(currentId)
            const label = isCurrent ? (currentLabel || s.variant_label) : s.variant_label
            return isCurrent ? (
              <span key={s.id} className="variant-chip variant-chip-active">{label || '(uten navn)'}</span>
            ) : (
              <Link key={s.id} href={`/products/${s.id}`} className="variant-chip">
                {label || '(uten navn)'}
              </Link>
            )
          })}
        </div>
      </div>
      <div className="flavor-hint">
        {siblings.length} varianter deler gruppen «{group}». Den uthevede er dette produktet — endre navnet i feltet over.
        Klikk en av de andre for å redigere den.
      </div>
    </div>
  )
}
