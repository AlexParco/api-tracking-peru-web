/**
 * Datos de EJEMPLO para el buscador de agencias.
 *
 * Esto NO es el catálogo. Es un stand-in mientras el API no está desplegado:
 * misma forma que devuelve `GET /v1/agencies` (ver `ENDPOINTS.agencies` en
 * `api.ts`, que sí sale de `docs/API.md`), datos ficticios.
 *
 * Tres reglas que los mantienen honestos, porque esto se sirve en una página
 * pública y un registro de agencia falso es una dirección falsa de un negocio
 * real:
 *
 * 1. **Los nombres dicen EJEMPLO.** Ninguno puede confundirse con una sucursal
 *    de verdad, ni siquiera fuera de contexto en un screenshot.
 * 2. **Los ubigeos son reales o son `null`.** Solo se usan los dos atestiguados
 *    en el repo —150101 Lima y 150122 Miraflores—; para el resto el campo va
 *    nulo con `ubigeo_level: 'none'`. Un ubigeo inventado es un código que
 *    alguien puede verificar y que estaría mal.
 * 3. **La mezcla es la real.** Hay agencias resueltas a distrito y agencias sin
 *    resolver, porque `ubigeo_source` —qué tan auditable es el cruce— es
 *    justamente lo que este endpoint publica y esconderlo dejaría el buscador
 *    mostrando un mundo más prolijo del que hay.
 *
 * Al llegar el catálogo real: se borra este archivo y se apunta
 * `PUBLIC_API_URL` al API. El componente no cambia.
 */

export interface Agency {
  carrier: string
  id: string
  name: string
  location: {
    address: string
    district: string
    province: string
    department: string
    ubigeo: string | null
    structured: boolean
  }
  ubigeo_level: 'district' | 'province' | 'department' | 'none'
  ubigeo_source: 'carrier' | 'matched' | 'none'
  kind: string
  services: { dropoff: boolean; pickup: boolean }
}

export const MOCK_AGENCIES: Agency[] = [
  {
    carrier: 'olva',
    id: 'ej-001',
    name: 'AGENCIA DE EJEMPLO 01',
    location: {
      address: 'AV ALFREDO BENAVIDES NRO 1851',
      district: 'MIRAFLORES',
      province: 'LIMA',
      department: 'LIMA',
      ubigeo: '150122',
      structured: true,
    },
    ubigeo_level: 'district',
    ubigeo_source: 'carrier',
    kind: 'agent',
    services: { dropoff: true, pickup: true },
  },
  {
    carrier: 'olva',
    id: 'ej-002',
    name: 'AGENCIA DE EJEMPLO 02',
    location: {
      address: 'JR DE LA UNION NRO 300',
      district: 'LIMA',
      province: 'LIMA',
      department: 'LIMA',
      ubigeo: '150101',
      structured: true,
    },
    ubigeo_level: 'district',
    ubigeo_source: 'carrier',
    kind: 'agent',
    services: { dropoff: true, pickup: false },
  },
  {
    carrier: 'marvisur',
    id: 'ej-003',
    name: 'AGENCIA DE EJEMPLO 03',
    location: {
      address: 'AV LARCO NRO 745',
      district: 'MIRAFLORES',
      province: 'LIMA',
      department: 'LIMA',
      ubigeo: '150122',
      structured: true,
    },
    ubigeo_level: 'district',
    ubigeo_source: 'matched',
    kind: 'branch',
    services: { dropoff: true, pickup: true },
  },
  {
    // El caso que importa: el courier da la ubicación como texto libre y el
    // cruce no resuelve. Se emite igual, diciendo que no sabemos.
    carrier: 'marvisur',
    id: 'ej-004',
    name: 'AGENCIA DE EJEMPLO 04',
    location: {
      address: 'FRENTE AL MERCADO CENTRAL, GARCI CARBAJAL',
      district: '',
      province: '',
      department: 'AREQUIPA',
      ubigeo: null,
      structured: false,
    },
    ubigeo_level: 'none',
    ubigeo_source: 'none',
    kind: 'branch',
    services: { dropoff: true, pickup: true },
  },
  {
    carrier: 'urbano',
    id: 'ej-005',
    name: 'AGENCIA DE EJEMPLO 05',
    location: {
      address: 'AV JAVIER PRADO ESTE NRO 4200',
      district: 'LIMA',
      province: 'LIMA',
      department: 'LIMA',
      ubigeo: '150101',
      structured: true,
    },
    ubigeo_level: 'district',
    ubigeo_source: 'carrier',
    kind: 'agent',
    services: { dropoff: true, pickup: true },
  },
  {
    carrier: 'urbano',
    id: 'ej-006',
    name: 'AGENCIA DE EJEMPLO 06',
    location: {
      address: 'CALLE COMERCIO NRO 128',
      district: '',
      province: 'TRUJILLO',
      department: 'LA LIBERTAD',
      ubigeo: null,
      structured: false,
    },
    ubigeo_level: 'none',
    ubigeo_source: 'none',
    kind: 'agent',
    services: { dropoff: true, pickup: false },
  },
  {
    carrier: 'shalom',
    id: 'ej-007',
    name: 'AGENCIA DE EJEMPLO 07',
    location: {
      address: 'AV NICOLAS AYLLON NRO 2900',
      district: '',
      province: 'LIMA',
      department: 'LIMA',
      ubigeo: null,
      structured: false,
    },
    ubigeo_level: 'none',
    ubigeo_source: 'none',
    kind: 'branch',
    services: { dropoff: true, pickup: true },
  },
  {
    carrier: 'shalom',
    id: 'ej-008',
    name: 'AGENCIA DE EJEMPLO 08',
    location: {
      address: 'AV EJERCITO NRO 510',
      district: '',
      province: 'AREQUIPA',
      department: 'AREQUIPA',
      ubigeo: null,
      structured: false,
    },
    ubigeo_level: 'none',
    ubigeo_source: 'none',
    kind: 'branch',
    services: { dropoff: true, pickup: true },
  },
  {
    carrier: 'cruzdelsur',
    id: 'ej-009',
    name: 'AGENCIA DE EJEMPLO 09',
    location: {
      address: 'AV PASEO DE LA REPUBLICA NRO 5824',
      district: 'MIRAFLORES',
      province: 'LIMA',
      department: 'LIMA',
      ubigeo: '150122',
      structured: true,
    },
    ubigeo_level: 'district',
    ubigeo_source: 'matched',
    kind: 'branch',
    services: { dropoff: true, pickup: true },
  },
  {
    carrier: 'cruzdelsur',
    id: 'ej-010',
    name: 'AGENCIA DE EJEMPLO 10',
    location: {
      address: 'AV LOS INCAS NRO 1140',
      district: '',
      province: 'CUSCO',
      department: 'CUSCO',
      ubigeo: null,
      structured: false,
    },
    ubigeo_level: 'none',
    ubigeo_source: 'none',
    kind: 'branch',
    services: { dropoff: false, pickup: true },
  },
]
