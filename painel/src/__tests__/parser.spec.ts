import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { cargoCurto, normalizaCargo, parseData } from '@/lib/parser'

const text = readFileSync(fileURLToPath(new URL('../../public/data.txt', import.meta.url)), 'utf-8')
const rows = parseData(text)

describe('parseData', () => {
  it('lê todas as nomeações', () => {
    expect(rows).toHaveLength(174)
  })

  it('conta nomeações por ato', () => {
    const porAto: Record<number, number> = {}
    for (const r of rows) porAto[r.ato] = (porAto[r.ato] ?? 0) + 1
    expect(porAto).toEqual({ 4592: 75, 4740: 28, 4849: 33, 4930: 26, 4994: 12 })
  })

  it('aceita linhas sem classificação', () => {
    expect(rows.filter((r) => r.classificacao === null)).toHaveLength(13)
  })

  it('detecta PcD e remove o marcador do nome', () => {
    const pcd = rows.filter((r) => r.pcd)
    expect(pcd).toHaveLength(7)
    expect(pcd.every((r) => !r.nome.includes('('))).toBe(true)
  })

  it('TRF4 não tem cidade', () => {
    const r = rows.find((x) => x.nome === 'GABRIELA LEITE KOCHENBORGER')!
    expect(r.secao).toBe('TRF4')
    expect(r.cidade).toBeNull()
  })

  it('Lista Geral usa a coluna Cidade', () => {
    const r = rows.find((x) => x.nome === 'RENAN GOMES OLAZ')!
    expect(r).toMatchObject({ secao: 'RS', listaGeral: true, cidade: 'Rio Grande', classificacao: 4 })
    expect(r.localidade).toBe('Lista Geral – RS')
  })

  it('associa cidade e microrregião', () => {
    const r = rows.find((x) => x.cidade === 'Curitiba')!
    expect(r.secao).toBe('PR')
    expect(r.microrregiao).toMatch(/^PS/)
  })
})

describe('cargo', () => {
  it('normaliza e resume', () => {
    const c = normalizaCargo('Técnico Judiciário/Área Administrativa/Especialidade Agente da Polícia Judicial')
    expect(c).toBe('Técnico Judiciário / Área Administrativa / Especialidade Agente da Polícia Judicial')
    expect(cargoCurto(c)).toBe('Técnico · Agente da Polícia Judicial')
    expect(cargoCurto(normalizaCargo('Analista Judiciário/ Área Judiciária'))).toBe('Analista · Judiciária')
  })
})
