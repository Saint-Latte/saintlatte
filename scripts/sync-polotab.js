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
  //    Intentamos expand=modifierItems,menus para obtener a qué menús aplica cada grupo
  const [channels, allModGroups] = await Promise.all([
    fetch(`${BASE}/menus/v1/channels`, { headers }).then(r => r.json()),
    fetch(`${BASE}/menus/v1/modifier_groups?expand=modifierItems,menus`, { headers })
      .then(r => r.json())
      .catch(() => {
        // Si no soporta expand=menus, intentamos sin esa expansión
        console.log('  ⚠ expand=menus no soportado — reintentando sin él')
        return fetch(`${BASE}/menus/v1/modifier_groups?expand=modifierItems`, { headers }).then(r => r.json())
      }),
  ])
  console.log(`✓ ${(channels ?? []).length} canales, ${(allModGroups ?? []).length} grupos de modificadores`)

  // 3. Canal POS
  const posChannel = (channels ?? []).find(c => c.type === 'pos') ?? channels?.[0]
  console.log(`✓ Canal: ${posChannel?.name ?? 'default'} (${posChannel?.id})`)

  // 4. Menús con items expandidos
  //    Intentamos expand=items,modifierGroups para obtener modifiers a nivel de menú
  let menusData
  const menuUrl = posChannel?.id
    ? `${BASE}/menus/v1/channels/${posChannel.id}/menus`
    : `${BASE}/menus/v1/menus`

  try {
    const r = await fetch(`${menuUrl}?expand=items,modifierGroups`, { headers })
    menusData = await r.json()
    if (!Array.isArray(menusData)) throw new Error('Respuesta inesperada')
  } catch {
    console.log('  ⚠ expand=modifierGroups no soportado — usando solo expand=items')
    const r = await fetch(`${menuUrl}?expand=items`, { headers })
    menusData = await r.json()
  }
  console.log(`✓ ${(menusData ?? []).length} categorías de menú`)

  // 5. Mapa de modifier groups (id → grupo completo con modifierItems)
  const mgMap = {}
  for (const mg of (allModGroups ?? [])) {
    if (mg.id) mgMap[mg.id] = mg
  }

  // 6. Construir mapa inverso: menuId → [modifierGroups]
  //    Fuente A: menu.modifierGroups (si el API los devolvió con expand=modifierGroups)
  //    Fuente B: mg.menus (si el API los devolvió con expand=menus en modifier_groups)
  const menuIdToMGs = {}

  // Fuente A: desde los menús
  for (const menu of (menusData ?? [])) {
    if (menu.modifierGroups?.length) {
      menuIdToMGs[menu.id] = (menu.modifierGroups ?? [])
        .map(mg => mgMap[mg.id] ?? mg)
        .filter(mg => (mg.modifierItems?.length ?? 0) > 0)
    }
  }

  // Fuente B: desde los modifier groups (mg.menus)
  for (const mg of (allModGroups ?? [])) {
    if (!mg.menus?.length) continue
    const fullMG = mgMap[mg.id] ?? mg
    if ((fullMG.modifierItems?.length ?? 0) === 0) continue
    for (const menuRef of mg.menus) {
      const menuId = menuRef.id ?? menuRef
      if (!menuIdToMGs[menuId]) menuIdToMGs[menuId] = []
      if (!menuIdToMGs[menuId].some(m => m.id === fullMG.id)) {
        menuIdToMGs[menuId].push(fullMG)
      }
    }
  }

  const menusWithMenuLevelMGs = Object.keys(menuIdToMGs).length
  console.log(`✓ ${menusWithMenuLevelMGs} menús con modifier groups a nivel de menú detectados`)

  // 7. Normalizar menús
  const menus = (menusData ?? []).map(menu => {
    // Modifier groups asignados al menú completo
    const menuLevelMGs = menuIdToMGs[menu.id] ?? []

    return {
      id: menu.id,
      name: menu.name,
      sortOrder: menu.sortOrder ?? 0,
      items: (menu.items ?? []).map(item => {
        // Modifier groups propios del item
        const itemMGs = (item.modifierGroups ?? [])
          .map(mg => mgMap[mg.id] ?? mg)
          .filter(mg => (mg.modifierItems?.length ?? 0) > 0)

        // Mergear: primero los del item, luego los del menú (sin duplicar por id)
        const seen = new Set(itemMGs.map(mg => mg.id))
        const merged = [...itemMGs]
        for (const mg of menuLevelMGs) {
          if (!seen.has(mg.id)) {
            merged.push(mg)
            seen.add(mg.id)
          }
        }

        return {
          id: item.id,
          name: item.name,
          description: item.description ?? null,
          menuName: menu.name,
          basePrice: item.prices?.[0]?.amount ?? null,
          imageUrl: item.imageUrl ?? null,
          modifierGroups: merged,
        }
      }),
    }
  })

  const totalItems = menus.reduce((s, m) => s + m.items.length, 0)
  const totalMods  = Object.keys(mgMap).length
  const itemsWithMods = menus.flatMap(m => m.items).filter(i => i.modifierGroups.length > 0).length
  console.log(`✓ ${totalItems} productos, ${totalMods} mod groups, ${itemsWithMods}/${totalItems} productos con modificadores`)

  // 8. Escribir lv-menu.json
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
