export type Secao = 'TRF4' | 'RS' | 'SC' | 'PR'

/** Registro como vem no dataset (public/nomeacoes.json). */
export interface NomeacaoJson {
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
  /** Data de publicação do ato (AAAA-MM-DD). */
  dataPublicacao: string
}

/** Envelope do arquivo public/nomeacoes.json. */
export interface DatasetNomeacoes {
  fonte: string
  geradoEm: string
  totalRegistros: number
  nomeacoes: NomeacaoJson[]
}

/** Registro em memória no painel. */
export interface Nomeacao extends NomeacaoJson {
  data: Date
  dataIso: string
}

export const SECAO_LABEL: Record<Secao, string> = {
  TRF4: 'TRF4 (Tribunal)',
  RS: 'Rio Grande do Sul',
  SC: 'Santa Catarina',
  PR: 'Paraná',
}

export function deDataset(r: NomeacaoJson): Nomeacao {
  const [y, m, d] = r.dataPublicacao.split('-').map(Number)
  return { ...r, data: new Date(y!, m! - 1, d!), dataIso: r.dataPublicacao }
}
