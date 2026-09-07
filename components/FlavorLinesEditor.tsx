'use client'

import { useState } from 'react'
import { getFlavorMeta, FALLBACK_COLOR, KNOWN_FLAVORS } from '@/lib/flavor-palette'

/**
 * Editor for the SMAKSNOTER lines on a product page (Product.flavors).
 *
 * The lines are free text and their order is the order the customer sees, so
 * this offers add / edit / remove / move. The value posts as one hidden JSON
 * field because the surrounding product form is multipart (it carries the
 * image); the API decodes it back into a list.
 */
export default function FlavorLinesEditor({
  name = 'flavors',
  initial = [],
}: {
  name?: string
  initial?: string[]
}) {
  const [lines, setLines] = useState<string[]>(initial.length ? initial : [])

  const update = (i: number, value: string) =>
    setLines(prev => prev.map((l, j) => (j === i ? value : l)))

  const remove = (i: number) => setLines(prev => prev.filter((_, j) => j !== i))

  const move = (i: number, delta: number) =>
    setLines(prev => {
      const next = [...prev]
      const to = i + delta
      if (to < 0 || to >= next.length) return prev
      ;[next[i], next[to]] = [next[to], next[i]]
      return next
    })

  const add = () => setLines(prev => [...prev, ''])

  const filled = lines.filter(l => l.trim())
  const greyCount = filled.filter(l => getFlavorMeta(l).matched === null).length

  return (
    <div>
      {/* What actually gets submitted. Blank lines are dropped by the API too. */}
      <input type="hidden" name={name} value={JSON.stringify(filled)} />

      <div style={{ display: 'grid', gap: 8 }}>
        {lines.map((line, i) => {
          const meta = getFlavorMeta(line)
          const isGrey = meta.matched === null && line.trim() !== ''
          return (
            <div key={i} className="flavor-line">
              <span
                className="flavor-line-dot"
                style={{ background: line.trim() ? meta.color : 'transparent', borderColor: line.trim() ? 'transparent' : 'var(--admin-border)' }}
                title={meta.matched ? `Farge fra «${meta.matched}»` : 'Ingen fargetreff — vises grå'}
              />
              <input
                className="admin-form-input"
                value={line}
                onChange={e => update(i, e.target.value)}
                placeholder="f.eks. Gul — Pasjonsfrukt (melk, soya)"
                aria-label={`Smaksnote ${i + 1}`}
              />
              <div className="flavor-line-actions">
                <button
                  type="button"
                  className="flavor-line-btn"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Flytt opp"
                  title="Flytt opp"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                </button>
                <button
                  type="button"
                  className="flavor-line-btn"
                  onClick={() => move(i, 1)}
                  disabled={i === lines.length - 1}
                  aria-label="Flytt ned"
                  title="Flytt ned"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
                </button>
                <button
                  type="button"
                  className="flavor-line-btn flavor-line-btn-danger"
                  onClick={() => remove(i)}
                  aria-label="Fjern linjen"
                  title="Fjern linjen"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
              {isGrey && <div className="flavor-line-warn">Ingen kjent smak i teksten — prikken blir grå</div>}
            </div>
          )
        })}
      </div>

      <button type="button" className="admin-btn admin-btn-secondary" onClick={add} style={{ marginTop: 10 }}>
        + Legg til smaksnote
      </button>

      {filled.length > 0 && (
        <div className="flavor-preview">
          <div className="admin-label" style={{ marginBottom: 10 }}>Slik ser det ut i nettbutikken</div>
          <div className="flavor-preview-stage">
            <div className="flavor-preview-heading">Smaksnoter</div>
            <div className="flavor-preview-chips">
              {filled.map((l, i) => (
                <span key={i} className="flavor-preview-chip">
                  <span className="flavor-preview-chip-dot" style={{ background: getFlavorMeta(l).color }} />
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flavor-hint">
        Prikkens farge kommer av ordene i linjen. Disse gir farge:{' '}
        <span style={{ color: 'var(--admin-text)' }}>{KNOWN_FLAVORS.join(', ')}</span>.
        {greyCount > 0 && (
          <> <strong style={{ color: '#B45309' }}>{greyCount} {greyCount === 1 ? 'linje' : 'linjer'}</strong> uten treff får grå prikk ({FALLBACK_COLOR}).</>
        )}
      </div>
    </div>
  )
}
