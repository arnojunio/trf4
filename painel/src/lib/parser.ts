export type Secao = 'TRF4' | 'RS' | 'SC' | 'PR'

export interface Nomeacao {
  id: number
  secao: Secao
  microrregiao: string | null
  /** Cidade de lotação (para Lista Geral vem da coluna "Cidade"). */
  cidade: string | null
  /** Rótulo da lista/localidade em que o candidato concorreu. */
  localidade: string
  /** Cargo completo, normalizado. */
  cargo: string
  /** Cargo resumido, ex.: "Técnico · Administrativa". */
  cargoCurto: string
  carreira: 'Analista' | 'Técnico'
  classificacao: number | null
  nome: string
  pcd: boolean
  listaGeral: boolean
  ato: number
  data: Date
  dataIso: string
}

export const SECAO_LABEL: Record<Secao, string> = {
  TRF4: 'TRF4 (Tribunal)',
  RS: 'Rio Grande do Sul',
  SC: 'Santa Catarina',
  PR: 'Paraná',
}

const ESTADOS: Array<[string, Secao]> = [
  ['RIO GRANDE DO SUL', 'RS'],
  ['SANTA CATARINA', 'SC'],
  ['PARANÁ', 'PR'],
]

function secaoDe(line: string): Secao {
  const up = line.toUpperCase()
  const found = ESTADOS.find(([nome]) => up.includes(nome))
  if (!found) throw new Error(`Seção desconhecida: ${line}`)
  return found[1]
}

export function normalizaCargo(raw: string): string {
  return raw.replace(/\s*\/\s*/g, ' / ').replace(/\s+/g, ' ').trim()
}

export function cargoCurto(cargo: string): string {
  const partes = cargo.split(' / ')
  const carreira = partes[0]!.split(' ')[0]!
  const ultimo = partes[partes.length - 1]!.replace(/^(Área|Especialidade)\s+/, '')
  return `${carreira} · ${ultimo}`
}

function tituloCidade(s: string): string {
  const minusculas = new Set(['da', 'das', 'de', 'do', 'dos', 'e'])
  return s
    .toLowerCase()
    .split(' ')
    .map((w, i) => (i > 0 && minusculas.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

function parseDataBr(s: string): Date {
  const [d, m, y] = s.split('/').map(Number)
  return new Date(y!, m! - 1, d!)
}

const RE_PCD = /\s*\(Cand\. Port\. Def\.\)/i
const RE_LISTA_GERAL = /\s*\(Nomeado pela Lista Geral[^)]*\)/i

export function parseData(text: string): Nomeacao[] {
  const out: Nomeacao[] = []
  let secao: Secao | null = null
  let micro: string | null = null
  let cidade: string | null = null
  let cargo: string | null = null
  let emListaGeral = false
  let temColunaCidade = false

  const lines = text.split(/\r?\n/)
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    if (rawLine.includes('\t')) {
      const cols = rawLine.split('\t').map((c) => c.trim())
      if (cols[0] === 'Class.') {
        temColunaCidade = cols.includes('Cidade')
        continue
      }
      if (!secao || !cargo) throw new Error(`Candidato fora de contexto: ${line}`)

      const dataStr = cols.pop()!
      const atoStr = cols.pop()!
      let classificacao: number | null = null
      if (/^\d+$/.test(cols[0] ?? '')) classificacao = Number(cols.shift())
      let nome = cols.shift() ?? ''
      const cidadeCol = temColunaCidade ? (cols.shift() ?? null) : null

      const pcd = RE_PCD.test(nome)
      const marcadorLG = RE_LISTA_GERAL.test(nome)
      nome = nome.replace(RE_PCD, '').replace(RE_LISTA_GERAL, '').trim()

      const cidadeFinal = cidadeCol ? tituloCidade(cidadeCol) : cidade
      const localidade =
        secao === 'TRF4'
          ? 'TRF4 – Sede (Porto Alegre)'
          : emListaGeral
            ? `Lista Geral – ${secao}`
            : (cidade ?? '—')
      const data = parseDataBr(dataStr)

      out.push({
        id: out.length + 1,
        secao,
        microrregiao: micro,
        cidade: cidadeFinal,
        localidade,
        cargo,
        cargoCurto: cargoCurto(cargo),
        carreira: cargo.startsWith('Analista') ? 'Analista' : 'Técnico',
        classificacao,
        nome,
        pcd,
        listaGeral: emListaGeral || marcadorLG,
        ato: Number(atoStr),
        data,
        dataIso: data.toISOString().slice(0, 10),
      })
      continue
    }

    // Linhas de estrutura (sem TAB)
    const up = line.toUpperCase()
    if (up.startsWith('CONCURSO PÚBLICO') || up === 'CANDIDATOS NOMEADOS') continue
    if (up.startsWith('TRIBUNAL REGIONAL FEDERAL')) {
      secao = 'TRF4'
      micro = null
      cidade = null
      cargo = null
      emListaGeral = false
    } else if (up.startsWith('LISTA GERAL')) {
      secao = secaoDe(line)
      micro = null
      cidade = null
      cargo = null
      emListaGeral = true
    } else if (up.startsWith('SEÇÃO JUDICIÁRIA')) {
      secao = secaoDe(line)
      micro = null
      cidade = null
      cargo = null
      emListaGeral = false
    } else if (up.startsWith('MICRORREGIÃO')) {
      micro = line
        .replace(/^MICRORREGIÃO\s+/i, '')
        .split(' - ')
        .map((p, i) => (i === 0 ? p : tituloCidade(p)))
        .join(' – ')
      cidade = null
      cargo = null
    } else if (/judici[aá]rio/i.test(line)) {
      cargo = normalizaCargo(line)
    } else {
      cidade = tituloCidade(line)
      cargo = null
    }
  }
  return out
}
