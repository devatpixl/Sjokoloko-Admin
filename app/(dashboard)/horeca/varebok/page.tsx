/**
 * K-11 — the HORECA catalogue. Admin owns it; customers can never edit a
 * product or a price.
 *
 * This is the screen that unblocks everything else: an empty varebok means a
 * logged-in customer sees a portal with nothing to order.
 */
import { adminGetHorecaProducts, adminGetHorecaSettings } from '@/lib/api/admin'
import ProductEditor from './_editor'

export type HorecaProduct = {
  id: number; slug: string; name: string; description: string
  wholesale_price: string
  pieces_per_tray_plain: number; pieces_per_tray_logo: number
  lead_time_days: number | null
  allergens: string[]; ingredients_text: string
  is_active: boolean; logo_available: boolean
  sort_order: number
}

export default async function HorecaVarebokPage() {
  const [products, settings] = await Promise.all([
    adminGetHorecaProducts(),
    adminGetHorecaSettings().catch(() => null),
  ])
  const list: HorecaProduct[] = products ?? []
  const active = list.filter((p) => p.is_active).length

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Varebok</div>
          <div className="admin-page-subtitle">
            {list.length} produkt{list.length === 1 ? '' : 'er'} ·{' '}
            {active} aktiv{active === 1 ? 't' : 'e'}
          </div>
        </div>
      </div>

      {list.length === 0 && (
        <div className="admin-card" style={{ marginBottom: 16 }}>
          <div style={{ padding: 16 }}>
            <strong>Vareboken er tom.</strong>
            <div className="admin-muted" style={{ marginTop: 6, fontSize: 13 }}>
              Ingen bedriftskunde kan bestille før det ligger minst ett produkt her.
              Prisen er grossistpris eks. mva. per brett (K-18), og et brett med
              logo har færre biter fordi logofeltet erstatter noen av dem (K-12).
            </div>
          </div>
        </div>
      )}

      <ProductEditor
        products={list}
        defaults={{
          plain: settings?.pieces_per_tray_plain ?? 88,
          logo: settings?.pieces_per_tray_logo ?? 81,
          leadPlain: settings?.lead_time_days_plain ?? 3,
          leadLogo: settings?.lead_time_days_logo ?? 7,
        }}
      />
    </>
  )
}
