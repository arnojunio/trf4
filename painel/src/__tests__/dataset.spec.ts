import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { deDataset, type DatasetNomeacoes } from '@/lib/tipos'

const ds: DatasetNomeacoes = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../public/nomeacoes.json', import.meta.url)), 'utf-8'),
)

describe('public/nomeacoes.json', () => {
  it('tem o envelope e o total coerente', () => {
    expect(ds.fonte).toBeTypeOf('string')
    expect(ds.nomeacoes).toHaveLength(ds.totalRegistros)
    expect(ds.totalRegistros).toBe(174)
  })

  it('conta nomeações por ato', () => {
    const porAto: Record<number, number> = {}
    for (const r of ds.nomeacoes) porAto[r.ato] = (porAto[r.ato] ?? 0) + 1
    expect(porAto).toEqual({ 4592: 75, 4740: 28, 4849: 33, 4930: 26, 4994: 12 })
  })

  it('respeita o contrato de cada registro', () => {
    const ids = new Set<number>()
    for (const r of ds.nomeacoes) {
      ids.add(r.id)
      expect(['TRF4', 'RS', 'SC', 'PR']).toContain(r.secao)
      expect(['Analista', 'Técnico']).toContain(r.carreira)
      expect(r.nome).toMatch(/^[^()]+$/)
      expect(r.cargo).toBeTypeOf('string')
      expect(r.cargoCurto).toBeTypeOf('string')
      expect(r.localidade).toBeTypeOf('string')
      expect(r.classificacao === null || Number.isInteger(r.classificacao)).toBe(true)
      expect(r.cidade === null || typeof r.cidade === 'string').toBe(true)
      expect(r.microrregiao === null || typeof r.microrregiao === 'string').toBe(true)
      expect(typeof r.pcd).toBe('boolean')
      expect(typeof r.listaGeral).toBe('boolean')
      expect(Number.isInteger(r.ato)).toBe(true)
      expect(r.dataPublicacao).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
    expect(ids.size).toBe(ds.nomeacoes.length)
  })

  it('converte a data sem deslocar fuso', () => {
    const r = deDataset(ds.nomeacoes[0]!)
    expect([r.data.getFullYear(), r.data.getMonth() + 1, r.data.getDate()]).toEqual([2026, 4, 29])
    expect(r.dataIso).toBe('2026-04-29')
  })
})
