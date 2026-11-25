import { computed, reactive, ref, watch } from 'vue'
import { deDataset, type DatasetNomeacoes, type Nomeacao, type Secao } from '@/lib/tipos'

export interface Filtros {
  q: string
  secao: Secao | ''
  localidade: string
  cargo: string
  ato: number | null
  pcd: boolean
  listaGeral: boolean
}

export interface Ato {
  ato: number
  data: Date
  total: number
}

export interface GrupoVaga {
  key: string
  secao: Secao
  localidade: string
  cargoCurto: string
  cargo: string
  total: number
  maiorClass: number | null
  classificacoes: Array<{ n: number | null; pcd: boolean; novo: boolean; nome: string }>
  ultimoAto: Ato
  novos: number
}

const VAZIO: Filtros = {
  q: '',
  secao: '',
  localidade: '',
  cargo: '',
  ato: null,
  pcd: false,
  listaGeral: false,
}

const todos = ref<Nomeacao[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const filtros = reactive<Filtros>({ ...VAZIO, ...lerUrl() })
let carregado = false

function lerUrl(): Partial<Filtros> {
  if (typeof window === 'undefined') return {}
  const p = new URLSearchParams(window.location.search)
  const f: Partial<Filtros> = {}
  if (p.get('q')) f.q = p.get('q')!
  if (p.get('secao')) f.secao = p.get('secao') as Secao
  if (p.get('local')) f.localidade = p.get('local')!
  if (p.get('cargo')) f.cargo = p.get('cargo')!
  if (p.get('ato')) f.ato = Number(p.get('ato'))
  if (p.get('pcd') === '1') f.pcd = true
  if (p.get('lg') === '1') f.listaGeral = true
  return f
}

watch(
  filtros,
  (f) => {
    const p = new URLSearchParams()
    if (f.q) p.set('q', f.q)
    if (f.secao) p.set('secao', f.secao)
    if (f.localidade) p.set('local', f.localidade)
    if (f.cargo) p.set('cargo', f.cargo)
    if (f.ato) p.set('ato', String(f.ato))
    if (f.pcd) p.set('pcd', '1')
    if (f.listaGeral) p.set('lg', '1')
    const qs = p.toString()
    history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  },
  { deep: true },
)

const normaliza = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

async function carregar() {
  if (carregado) return
  carregado = true
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}nomeacoes.json`, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const ds = (await res.json()) as DatasetNomeacoes
    todos.value = ds.nomeacoes.map(deDataset)
  } catch (e) {
    error.value = `Não foi possível carregar nomeacoes.json (${(e as Error).message})`
    carregado = false
  } finally {
    loading.value = false
  }
}

export function useNomeacoes() {
  void carregar()

  const atos = computed<Ato[]>(() => {
    const m = new Map<number, Ato>()
    for (const r of todos.value) {
      const a = m.get(r.ato) ?? { ato: r.ato, data: r.data, total: 0 }
      a.total++
      m.set(r.ato, a)
    }
    return [...m.values()].sort((a, b) => a.data.getTime() - b.data.getTime())
  })

  const ultimoAto = computed(() => atos.value[atos.value.length - 1] ?? null)

  /** Opções dependentes: localidades filtradas pela seção escolhida. */
  const opcoes = computed(() => {
    const base = filtros.secao ? todos.value.filter((r) => r.secao === filtros.secao) : todos.value
    const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, 'pt-BR'))
    return {
      localidades: uniq(base.map((r) => r.localidade)),
      cargos: uniq(base.map((r) => r.cargoCurto)),
    }
  })

  function passa(r: Nomeacao, q: string, ignoraAto: boolean) {
    return (
      (!filtros.secao || r.secao === filtros.secao) &&
      (!filtros.localidade || r.localidade === filtros.localidade) &&
      (!filtros.cargo || r.cargoCurto === filtros.cargo) &&
      (ignoraAto || !filtros.ato || r.ato === filtros.ato) &&
      (!filtros.pcd || r.pcd) &&
      (!filtros.listaGeral || r.listaGeral) &&
      (!q ||
        normaliza(r.nome).includes(q) ||
        normaliza(r.cidade ?? '').includes(q) ||
        normaliza(r.localidade).includes(q) ||
        normaliza(r.cargo).includes(q))
    )
  }

  const filtrados = computed(() => {
    const q = normaliza(filtros.q.trim())
    return todos.value.filter((r) => passa(r, q, false))
  })

  /** Contagem por ato respeitando os demais filtros (para o gráfico). */
  const porAto = computed(() => {
    const q = normaliza(filtros.q.trim())
    const m = new Map<number, number>()
    for (const r of todos.value) if (passa(r, q, true)) m.set(r.ato, (m.get(r.ato) ?? 0) + 1)
    return atos.value.map((a) => ({ ...a, total: m.get(a.ato) ?? 0 }))
  })

  const grupos = computed<GrupoVaga[]>(() => {
    const ult = ultimoAto.value?.ato
    const atoPorNum = new Map(atos.value.map((a) => [a.ato, a]))
    const m = new Map<string, GrupoVaga>()
    for (const r of filtrados.value) {
      const key = `${r.secao}|${r.localidade}|${r.cargo}`
      let g = m.get(key)
      if (!g) {
        g = {
          key,
          secao: r.secao,
          localidade: r.localidade,
          cargo: r.cargo,
          cargoCurto: r.cargoCurto,
          total: 0,
          maiorClass: null,
          classificacoes: [],
          ultimoAto: atoPorNum.get(r.ato)!,
          novos: 0,
        }
        m.set(key, g)
      }
      g.total++
      if (r.classificacao !== null) g.maiorClass = Math.max(g.maiorClass ?? 0, r.classificacao)
      const novo = r.ato === ult
      if (novo) g.novos++
      g.classificacoes.push({ n: r.classificacao, pcd: r.pcd, novo, nome: r.nome })
      if (r.data > g.ultimoAto.data) g.ultimoAto = atoPorNum.get(r.ato)!
    }
    const ordemSecao: Secao[] = ['TRF4', 'RS', 'SC', 'PR']
    for (const g of m.values())
      g.classificacoes.sort((a, b) => (a.n ?? -1) - (b.n ?? -1))
    return [...m.values()].sort(
      (a, b) =>
        ordemSecao.indexOf(a.secao) - ordemSecao.indexOf(b.secao) ||
        a.localidade.localeCompare(b.localidade, 'pt-BR') ||
        a.cargoCurto.localeCompare(b.cargoCurto, 'pt-BR'),
    )
  })

  const filtrosAtivos = computed(
    () => (Object.keys(VAZIO) as Array<keyof Filtros>).filter((k) => filtros[k] !== VAZIO[k]).length,
  )

  function limpar() {
    Object.assign(filtros, VAZIO)
  }

  return { todos, loading, error, filtros, atos, porAto, ultimoAto, opcoes, filtrados, grupos, filtrosAtivos, limpar }
}

export const fmtData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
export const fmtDataCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
