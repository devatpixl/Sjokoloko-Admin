'use client'

/**
 * Zebra-etiketter — self-service print layout for the physical product label.
 *
 * The client's printer takes 94 × 32 mm labels. The browser prints the
 * .label-print area at exactly that size via @page; everything else is
 * hidden in print. Text, font size and line spacing are editable and the
 * last-used values are remembered in this browser.
 */

import { useEffect, useMemo, useRef, useState } from 'react'

const STORAGE_KEY = 'sjokoloko-label-editor-v1'

const DEFAULTS = {
  title: 'Signature 16 biter',
  subtitle: 'Hasselnøtt, Pistasj, Vanilje og Pasjonsfrukt ca 240 gram Netto',
  body: [
    'Rød : sukker, kakaosmør, helMELKpulver, kakaomasse, HASSELNØTT, solsikkeolje.',
    'Grønn : sukker, kakaosmør, helMELKpulver, kakaomasse, PISTASJ, solsikkeolje, havsalt.',
    'Hvit : sukker, kakaosmør, helMELKpulver, kakaomasse, solsikkeolje, vaniljefrø.',
    'Gul : sukker, kakaosmør, pasjonsfrukt, glykose, pektin (E440), havsalt.',
  ].join('\n'),
  footer: 'Optimal lagringstemperatur er 12-18 grader.',
  // Sizes are set to the legal floor, not to taste. EU 1169/2011 requires an
  // x-height of at least 1.2 mm for mandatory particulars (ingredients,
  // allergens, nutrition), which is ~6.5 pt in Arial. 0.9 mm (~5 pt) is
  // allowed only when the pack's largest surface is under 80 cm², which a
  // 16-piece box is not. So 6.5 pt is the floor for the small print, and the
  // editor warns if anyone lowers it.
  fontPt: 6.5,
  titlePt: 9,
  bodyPt: 6.5,
  lineHeight: 1.05,
  bodyLineHeight: 1.02,
  shelfDays: 60,
  showNutrition: true,
  nutritionTitle: 'Næringsinnhold per 100 g',
  // One "label: value" pair per line, so ops can edit freely per product.
  nutrition: [
    'Energi|1565 kJ / 379 kcal',
    'Fett|36 g',
    '  hvorav mettede fettsyrer|14 g',
    'Karbohydrat|0,3 g',
    '  hvorav sukkerarter|0,2 g',
    'Protein|13 g',
    'Salt|1,5 g',
  ].join('\n'),
}

// EU 1169/2011 art. 13: mandatory particulars need an x-height of at least
// 1.2 mm, or 0.9 mm when the pack's largest surface is under 80 cm².
// Arial's x-height is ~0.52 em and 1 pt = 0.3528 mm.
const ARIAL_X_HEIGHT_RATIO = 0.52
const PT_TO_MM = 0.3528
function xHeightMm(pt: number): number {
  return pt * PT_TO_MM * ARIAL_X_HEIGHT_RATIO
}

function plusDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function LabelsPage() {
  const [state, setState] = useState(DEFAULTS)
  const [loaded, setLoaded] = useState(false)
  const [overflow, setOverflow] = useState(0)
  const measureRef = useRef<HTMLDivElement>(null)
  const [saved, setSaved] = useState<any[]>([])
  const [saveName, setSaveName] = useState('')
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedMsg, setSavedMsg] = useState('')

  async function loadSaved() {
    try {
      const res = await fetch('/api/admin-proxy/labels')
      if (res.ok) setSaved(await res.json())
    } catch { /* list simply stays as it was */ }
  }
  useEffect(() => { loadSaved() }, [])

  async function saveCurrent() {
    const name = saveName.trim()
    if (!name) { setSaveError('Skriv inn et navn først.'); return }
    setBusy(true); setSaveError(''); setSavedMsg('')
    try {
      const res = await fetch('/api/admin-proxy/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, data: state }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setSaveError(d?.detail || 'Kunne ikke lagre.')
      } else {
        setSaveName('')
        setSavedMsg(`«${name}» er lagret.`)
        await loadSaved()
      }
    } catch {
      setSaveError('Kunne ikke kontakte serveren.')
    } finally {
      // finally, so the button never stays stuck on "Lagrer…"
      setBusy(false)
    }
  }

  async function removeSaved(id: number, name: string) {
    if (!window.confirm(`Slette «${name}»? Dette kan ikke angres.`)) return
    setBusy(true); setSavedMsg('')
    try {
      await fetch(`/api/admin-proxy/labels/${id}`, { method: 'DELETE' })
      await loadSaved()
    } catch { /* ignore */ } finally { setBusy(false) }
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setState({ ...DEFAULTS, ...JSON.parse(raw) })
    } catch {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
  }, [state, loaded])

  // Measure the rendered label against the 32 mm it has to fit inside, so the
  // overflow the client was warned about is visible instead of theoretical.
  useEffect(() => {
    const el = measureRef.current
    if (!el) return
    setOverflow(Math.max(0, el.scrollHeight - el.clientHeight))
  }, [state])

  const set = (k: keyof typeof DEFAULTS, v: string | number | boolean) =>
    setState(s => ({ ...s, [k]: v }))
  const bestBefore = useMemo(() => plusDays(Number(state.shelfDays) || 60), [state.shelfDays])

  const labelStyle: React.CSSProperties = {
    width: '94mm',
    height: '32mm',
    background: '#fff',
    color: '#000',
    padding: '1.5mm 2mm',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: `${state.fontPt}pt`,
    lineHeight: state.lineHeight,
  }

  return (
    <>
      <div className="admin-page-header no-print">
        <div>
          <div className="admin-page-title">Etiketter</div>
          <div className="admin-page-subtitle">Zebra-utskrift · 94 × 32 mm</div>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => window.print()}>
          Skriv ut →
        </button>
      </div>

      <div className="no-print admin-split admin-split-labels">
        {/* Editor */}
        <div className="admin-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="admin-form-group">
            <label className="admin-label">Tittel</label>
            <input className="admin-form-input" value={state.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Undertittel</label>
            <input className="admin-form-input" value={state.subtitle} onChange={e => set('subtitle', e.target.value)} />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Ingredienser (én linje per farge)</label>
            <textarea className="admin-form-input" rows={6} value={state.body} onChange={e => set('body', e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Bunnlinje</label>
            <input className="admin-form-input" value={state.footer} onChange={e => set('footer', e.target.value)} />
          </div>
          <div className="admin-field-row">
            <div className="admin-form-group">
              <label className="admin-label">Skriftstørrelse (pt)</label>
              <input className="admin-form-input" type="number" min={5} max={16} step={0.5} value={state.fontPt} onChange={e => set('fontPt', parseFloat(e.target.value) || 6.5)} />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Tittel (pt)</label>
              <input className="admin-form-input" type="number" min={6} max={20} step={0.5} value={state.titlePt} onChange={e => set('titlePt', parseFloat(e.target.value) || 10)} />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Ingredienser (pt)</label>
              <input className="admin-form-input" type="number" min={5} max={12} step={0.5} value={state.bodyPt} onChange={e => set('bodyPt', parseFloat(e.target.value) || 6.5)} />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Linjeavstand</label>
              <input className="admin-form-input" type="number" min={0.8} max={1.8} step={0.02} value={state.lineHeight} onChange={e => set('lineHeight', parseFloat(e.target.value) || 1.12)} />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Linjeavstand ingredienser</label>
              <input className="admin-form-input" type="number" min={0.8} max={1.8} step={0.02} value={state.bodyLineHeight} onChange={e => set('bodyLineHeight', parseFloat(e.target.value) || 1.05)} />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Holdbarhet (dager)</label>
              <input className="admin-form-input" type="number" min={1} max={365} value={state.shelfDays} onChange={e => set('shelfDays', parseInt(e.target.value) || 60)} />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Best før (beregnet)</label>
              <input className="admin-form-input" value={bestBefore} readOnly style={{ opacity: 0.7 }} />
            </div>
          </div>
          <div className="admin-checkbox-row">
            <input type="checkbox" id="show_nutrition" className="admin-checkbox"
                   checked={state.showNutrition} onChange={e => set('showNutrition', e.target.checked)} />
            <label htmlFor="show_nutrition" className="admin-label" style={{ marginBottom: 0 }}>
              Vis næringsinnhold
            </label>
          </div>
          {state.showNutrition && (
            <>
              <div className="admin-form-group">
                <label className="admin-label">Næringstabell — overskrift</label>
                <input className="admin-form-input" value={state.nutritionTitle}
                       onChange={e => set('nutritionTitle', e.target.value)} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Næringstabell (én linje per rad: navn|verdi)</label>
                <textarea className="admin-form-input" rows={7} value={state.nutrition}
                          onChange={e => set('nutrition', e.target.value)}
                          style={{ resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
            </>
          )}

          {/* Legality + fit, measured rather than guessed */}
          {xHeightMm(state.bodyPt) < 0.9 && (
            <div className="admin-alert admin-alert-error">
              <strong>Under lovlig minstestørrelse.</strong> {state.bodyPt} pt Arial gir
              x-høyde {xHeightMm(state.bodyPt).toFixed(2)} mm. EU 1169/2011 krever minst
              0,9 mm (pakning under 80 cm²) og 1,2 mm ellers, altså ca. 5 pt / 6,5 pt.
            </div>
          )}
          {xHeightMm(state.bodyPt) >= 0.9 && xHeightMm(state.bodyPt) < 1.2 && (
            <div className="admin-alert">
              {state.bodyPt} pt gir x-høyde {xHeightMm(state.bodyPt).toFixed(2)} mm. Lovlig
              bare hvis pakningens største flate er under 80 cm². Over det kreves 1,2 mm (ca. 6,5 pt).
            </div>
          )}
          {overflow > 0 && (
            <div className="admin-alert admin-alert-error">
              <strong>Teksten får ikke plass.</strong> Innholdet er ca. {Math.round(overflow)} px
              høyere enn etiketten. Kort ned teksten, slå av næringsinnhold, eller bruk en større etikett.
            </div>
          )}
          {overflow === 0 && (
            <div className="admin-page-subtitle">Innholdet får plass på etiketten.</div>
          )}

          <button className="admin-btn admin-btn-secondary" onClick={() => setState(DEFAULTS)}>
            Tilbakestill til standard
          </button>
        </div>

        {/* True-size preview */}
        <div>
          <div className="admin-label" style={{ marginBottom: 10 }}>Forhåndsvisning (faktisk størrelse)</div>
          <div className="label-preview-scroll">
            <div style={{ border: '1px dashed var(--admin-border)', display: 'inline-block', padding: 6, background: 'repeating-conic-gradient(#8882 0% 25%, transparent 0% 50%) 0 0 / 12px 12px' }}>
              <LabelArea state={state} bestBefore={bestBefore} style={labelStyle} innerRef={measureRef} />
            </div>
          </div>
          <p className="admin-page-subtitle" style={{ marginTop: 12, maxWidth: 420 }}>
            Skriv ut: velg Zebra-skriveren, papirstørrelse 94 × 32 mm (eller «faktisk størrelse» / 100 %),
            marger 0.
          </p>

          {/* Saved labels. Each product's ingredient text is written once and
              pulled back when that chocolate is made again. Stored on the
              server so everyone sees the same list. */}
          <div className="admin-card" style={{ marginTop: 24, maxWidth: 480 }}>
            <div className="admin-card-header">
              <div className="admin-card-title">Lagrede etiketter</div>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 14 }}>
              <div className="admin-page-subtitle" style={{ marginBottom: 2 }}>
                Har du én etikett per produkt, slipper du å skrive teksten på nytt.
                Skriv teksten til venstre, gi den et navn og trykk <strong>Lagre</strong>.
                Neste gang henter du den fram igjen med <strong>Bruk</strong>.
              </div>

              <div>
                <label className="admin-label">Navn på etiketten</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    className="admin-form-input"
                    placeholder="F.eks. «Signature 16 biter»"
                    value={saveName}
                    onChange={e => { setSaveName(e.target.value); setSaveError(''); setSavedMsg('') }}
                    onKeyDown={e => { if (e.key === 'Enter') saveCurrent() }}
                    style={{ flex: 1, minWidth: 200 }}
                  />
                  <button className="admin-btn admin-btn-primary" onClick={saveCurrent} disabled={busy}>
                    {busy ? 'Lagrer…' : 'Lagre'}
                  </button>
                </div>
              </div>

              {saveError && <div className="admin-alert admin-alert-error">{saveError}</div>}
              {savedMsg && <div className="admin-alert">{savedMsg}</div>}

              {saved.length === 0 ? (
                <div className="admin-page-subtitle">
                  Ingen lagrede etiketter ennå.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div className="admin-label" style={{ marginBottom: 0 }}>
                    Dine etiketter ({saved.length})
                  </div>
                  {saved.map(t => (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 10, padding: '10px 12px', border: '1px solid var(--admin-border)',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.name}
                        </div>
                        <div className="admin-page-subtitle" style={{ fontSize: 12 }}>
                          Sist endret {new Date(t.updated_at).toLocaleDateString('nb-NO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          className="admin-btn admin-btn-secondary"
                          style={{ fontSize: 12, height: 30, padding: '0 12px' }}
                          title="Hent denne teksten inn i editoren til venstre"
                          onClick={() => {
                            setState({ ...DEFAULTS, ...t.data })
                            setSaveName(t.name)
                            setSavedMsg(`«${t.name}» er hentet fram. Endre teksten til venstre og trykk Lagre for å oppdatere den.`)
                          }}
                        >
                          Bruk
                        </button>
                        <button
                          className="admin-btn admin-btn-secondary"
                          style={{ fontSize: 12, height: 30, padding: '0 12px' }}
                          onClick={() => removeSaved(t.id, t.name)}
                          disabled={busy}
                        >
                          Slett
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print-only copy */}
      <div className="label-print-wrap">
        <LabelArea state={state} bestBefore={bestBefore} style={labelStyle} />
      </div>

      <style jsx global>{`
        @media print {
          @page { size: 94mm 32mm; margin: 0; }
          body * { visibility: hidden !important; }
          .label-print-wrap, .label-print-wrap * { visibility: visible !important; }
          .label-print-wrap { position: fixed; inset: 0; }
          .label-print-wrap > div { box-shadow: none !important; }
        }
        @media screen {
          .label-print-wrap { display: none; }
        }
      `}</style>
    </>
  )
}

function LabelArea({ state, bestBefore, style, innerRef }: {
  state: typeof DEFAULTS
  bestBefore: string
  style: React.CSSProperties
  innerRef?: React.Ref<HTMLDivElement>
}) {
  return (
    <div ref={innerRef} style={style}>
      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: `${state.titlePt}pt`, lineHeight: 1.05 }}>
        {state.title}
      </div>
      <div style={{ textAlign: 'center', fontSize: `${Math.max(5, state.fontPt - 1)}pt`, lineHeight: 1.05, marginBottom: '0.6mm' }}>
        {state.subtitle}
      </div>
      <div style={{ lineHeight: state.bodyLineHeight, fontSize: `${state.bodyPt}pt`, flex: 1 }}>
        {state.body.split('\n').filter(l => l.trim()).map((line, i) => (
          <div key={i}>{line}</div>
        ))}
        {state.showNutrition && (
          <div style={{ marginTop: '0.6mm', borderTop: '0.2mm solid #000', paddingTop: '0.4mm' }}>
            <div style={{ fontWeight: 700 }}>{state.nutritionTitle}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', columnGap: '2mm' }}>
              {state.nutrition.split('\n').filter(l => l.trim()).map((row, i) => {
                const [name, value] = row.split('|')
                return (
                  <div key={i} style={{ display: 'contents' }}>
                    <span style={{ whiteSpace: 'pre' }}>{name}</span>
                    <span style={{ textAlign: 'right', fontWeight: 600 }}>{(value ?? '').trim()}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2mm', lineHeight: 1.05 }}>
        <span>{state.footer}</span>
        <span style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>Best før: {bestBefore}</span>
      </div>
    </div>
  )
}
