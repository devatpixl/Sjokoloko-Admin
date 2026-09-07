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

  // Until the product is saved into the group it is not in the fetched list, so
  // its chip is added here. Otherwise picking a group showed the other products'
  // chips with none highlighted, while the text claimed one of them was this
  // product — which is exactly the moment you want to see where yours lands.
  const alreadyInGroup = siblings.some(s => String(s.id) === String(currentId))
  const memberCount = alreadyInGroup ? siblings.length : siblings.length + 1

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
          {!alreadyInGroup && (
            <span className="variant-chip variant-chip-active variant-chip-pending">
              {currentLabel || '(uten navn)'}
            </span>
          )}
        </div>
      </div>
      <div className="flavor-hint">
        {memberCount < 2 ? (
          <>
            Bare dette produktet har gruppen «{group}». Butikken viser ingen «Velg variant»-rad
            før minst to produkter deler gruppen — sett samme gruppe på et annet produkt.
          </>
        ) : (
          <>
            {memberCount} varianter deler gruppen «{group}». Den uthevede er dette produktet — endre
            navnet i feltet over, og klikk en av de andre for å redigere den.
            {!alreadyInGroup && ' Ditt produkt legges til i raden når du lagrer.'}
          </>
        )}
      </div>
    </div>
  )
}
