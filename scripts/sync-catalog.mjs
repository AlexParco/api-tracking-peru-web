/*
 * Regenera el bloque CATALOG_FALLBACK de `src/data/api.ts`.
 *
 * ── Por qué existe ──
 *
 * Las páginas por courier describen lo que el catálogo de cada uno publica de
 * verdad —cuántos departamentos nombra, si trae ubigeo INEI, si el horario viene
 * parseado o en texto—. Eso se mide contra `/v1/agencies` en cada build, así que
 * en producción siempre está fresco.
 *
 * Pero si el API no responde durante un build, `catalogStats` cae al fallback. Sin
 * él, las cinco páginas perderían su sección más diferenciadora y volverían a ser
 * casi la misma página, en silencio y sin que el build se ponga rojo. El fallback
 * es la última foto conocida; este script la saca.
 *
 * ── Cuándo correrlo ──
 *
 * Cuando el catálogo cambie de forma (un carrier empieza a publicar ubigeo, o se
 * suma uno nuevo). El total de puntos NO hace falta: ese ya se refresca solo.
 *
 *   node scripts/sync-catalog.mjs          imprime el bloque para pegar
 *   node scripts/sync-catalog.mjs --check  sale 1 si difiere del comiteado
 *
 * No escribe el archivo a propósito: el bloque se revisa antes de entrar, como
 * cualquier otro dato que la página afirma.
 */

const BASE = process.env.PUBLIC_API_URL ?? 'https://api.tracking-peru.com'
const CARRIERS = ['marvisur', 'olva', 'urbano', 'cruzdelsur', 'shalom']

const cuenta = (xs) =>
  [...xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map())]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

async function stats(id) {
  const puntos = []
  let page = 1
  let syncedAt = null
  let ubigeoRate = null
  for (;;) {
    const res = await fetch(`${BASE}/v1/agencies?carrier=${id}&per_page=500&page=${page}`)
    if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`)
    const data = await res.json()
    const lote = data?.agencies
    if (!Array.isArray(lote) || !lote.length) break
    puntos.push(...lote)
    if (page === 1) {
      const src = data?.meta?.sources?.[0]
      syncedAt = typeof src?.synced_at === 'string' ? src.synced_at.slice(0, 10) : null
      ubigeoRate = typeof src?.ubigeo_district_rate === 'number' ? src.ubigeo_district_rate : null
    }
    if (page >= (data?.pagination?.total_pages ?? 1)) break
    page++
  }
  const deps = cuenta(puntos.map((p) => p?.location?.department).filter(Boolean))
  const provs = new Set(puntos.map((p) => p?.location?.province).filter(Boolean))
  const prop = (n) => Math.round((n / puntos.length) * 1000) / 1000
  const muestra = puntos.find((p) => !p?.hours?.structured && p?.hours?.text?.[0])?.hours.text[0]
  return {
    total: puntos.length,
    departments: deps.length,
    provinces: provs.size,
    top: deps.slice(0, 5),
    hoursSample: typeof muestra === 'string' ? muestra : null,
    ubigeoRate: ubigeoRate ?? prop(puntos.filter((p) => p?.ubigeo_level === 'district').length),
    geoRate: prop(puntos.filter((p) => p?.geo).length),
    hoursRate: prop(puntos.filter((p) => p?.hours?.structured).length),
    services: cuenta(puntos.flatMap((p) => Object.keys(p?.services ?? {}))).map((s) => s.name),
    kinds: cuenta(puntos.map((p) => p?.kind ?? 'unknown')),
    syncedAt,
  }
}

const lista = (xs) => `[${xs.map((x) => `{ name: '${x.name}', count: ${x.count} }`).join(', ')}]`

const todos = Object.fromEntries(await Promise.all(CARRIERS.map(async (c) => [c, await stats(c)])))

const bloque = `const CATALOG_FALLBACK: Record<string, CatalogStats> = {
${CARRIERS.map((c) => {
  const s = todos[c]
  return `  ${c}: {
    total: ${s.total}, departments: ${s.departments}, provinces: ${s.provinces}, ubigeoRate: ${s.ubigeoRate}, geoRate: ${s.geoRate}, hoursRate: ${s.hoursRate},
    hoursSample: ${s.hoursSample ? JSON.stringify(s.hoursSample) : 'null'},
    services: [${s.services.map((x) => `'${x}'`).join(', ')}],
    kinds: ${lista(s.kinds)},
    top: ${lista(s.top)},
    syncedAt: ${s.syncedAt ? `'${s.syncedAt}'` : 'null'},
  },`
}).join('\n')}
}`

if (process.argv.includes('--check')) {
  const { readFileSync } = await import('node:fs')
  const actual = readFileSync(new URL('../src/data/api.ts', import.meta.url), 'utf8')
  const inicio = actual.indexOf('const CATALOG_FALLBACK')
  const comiteado = actual.slice(inicio, actual.indexOf('\n}', inicio) + 2)
  if (comiteado.trim() === bloque.trim()) {
    console.log('✓ CATALOG_FALLBACK al día contra el API.')
  } else {
    console.error('✗ CATALOG_FALLBACK difiere del API. Corre el script sin --check y revisa el diff.')
    process.exit(1)
  }
} else {
  console.log(bloque)
}
