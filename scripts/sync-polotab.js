// Corre en GitHub Actions (servidor) — sin restricciones CORS
// Descarga menú + modificadores de Polotab y guarda lv-menu.json

const BASE = 'https://api.polotab.com'
const API_KEY      = process.env.POLOTAB_API_KEY
const RESTAURANT_ID = process.env.POLOTAB_RESTAURANT_ID

if (!API_KEY || !RESTAURANT_ID) {
  console.error('ERROR: Faltan POLOTAB_API_KEY o POLOTAB_RESTAURANT_ID en las variables de entorno')
  process.exit(1)
}

async function main() {
  console.log(`Sincronizando menú para restaurante ${RESTAURANT_ID}…`)

  // 1. Token de restaurante
  const tokenRes = await fetch(`${BASE}/auth/v1/restaurants/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ restaurantId: RESTAURANT_ID }),
  })
  if (!tokenRes.ok) {
    const txt = await tokenRes.text()
    throw new Error(`Auth failed (${tokenRes.status}): ${txt}`)
  }
  const tokenData = await tokenRes.json()
  const token = tokenData.token ?? tokenData.restaurantToken ?? tokenData
  console.log('✓ Token obtenido')

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  // 2. Channels + modifier groups en paralelo
  const [channels, allModGroups] = await Promise.all([
    fetch(`${BASE}/menus/v1/channels`, { headers }).then(r => r.json()),
    fetch(`${BASE}/menus/v1/modifier_groups?expand=modifierItems`, { headers }).then(r => r.json()),
  ])
  console.log(`✓ ${(channels ?? []).length} canales, ${(allModGroups ?? []).length} grupos de modificadores`)

  // 3. Canal POS
  const posChannel = (channels ?? []).find(c => c.type === 'pos') ?? channels?.[0]
  console.log(`✓ Canal: ${posChannel?.name ?? 'default'} (${posChannel?.id})`)

  // 4. Menús con items expandidos
  let menusData
  if (posChannel?.id) {
    const r = await fetch(`${BASE}/menus/v1/channels/${posChannel.id}/menus?expand=items`, { headers })
    menusData = await r.json()
  } else {
    const r = await fetch(`${BASE}/menus/v1/menus?expand=items`, { headers })
    menusData = await r.json()
  }
  console.log(`✓ ${(menusData ?? []).length} categorías de menú`)

  // 5. Mapa de modifier groups (id → grupo completo con modifierItems)
  const mgMap = {}
  for (const mg of (allModGroups ?? [])) {
    if (mg.id) mgMap[mg.id] = mg
  }

  // 6. Normalizar menús — resolver references de modifier groups
  const menus = (menusData ?? []).map(menu => ({
    id: menu.id,
    name: menu.name,
    sortOrder: menu.sortOrder ?? 0,
    items: (menu.items ?? []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description ?? null,
      menuName: menu.name,
      basePrice: item.prices?.[0]?.amount ?? null,
      imageUrl: item.imageUrl ?? null,
      modifierGroups: (item.modifierGroups ?? [])
        .map(mg => mgMap[mg.id] ?? mg)
        .filter(mg => (mg.modifierItems?.length ?? 0) > 0),
    })),
  }))

  const totalItems = menus.reduce((s, m) => s + m.items.length, 0)
  const totalMods  = Object.keys(mgMap).length
  console.log(`✓ ${totalItems} productos, ${totalMods} grupos de modificadores normalizados`)

  // 7. Escribir lv-menu.json
  const output = {
    menus,
    mgMap,
    syncedAt: new Date().toISOString(),
    restaurantId: RESTAURANT_ID,
  }

  const fs = require('fs')
  fs.writeFileSync('lv-menu.json', JSON.stringify(output, null, 2), 'utf8')
  console.log('✓ lv-menu.json escrito correctamente')
  console.log(`\n🎉 Sync completado: ${menus.length} categorías · ${totalItems} productos · ${totalMods} mod groups`)
}

main().catch(e => {
  console.error('ERROR:', e.message)
  process.exit(1)
})
