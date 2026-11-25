<script setup lang="ts">
import { computed, ref } from 'vue'
import { fmtData, useNomeacoes } from '@/composables/useNomeacoes'
import type { Nomeacao } from '@/lib/tipos'

type Coluna = 'classificacao' | 'nome' | 'cargoCurto' | 'localidade' | 'data'

const { filtrados, ultimoAto } = useNomeacoes()
const ordem = ref<{ col: Coluna; dir: 1 | -1 }>({ col: 'data', dir: -1 })

const colunas: Array<{ key: Coluna; label: string }> = [
  { key: 'classificacao', label: 'Class.' },
  { key: 'nome', label: 'Candidato' },
  { key: 'cargoCurto', label: 'Cargo' },
  { key: 'localidade', label: 'Localidade' },
  { key: 'data', label: 'Ato / Publicação' },
]

function valor(r: Nomeacao, c: Coluna): string | number {
  if (c === 'data') return r.data.getTime()
  if (c === 'classificacao') return r.classificacao ?? Number.MAX_SAFE_INTEGER
  return r[c]
}

const linhas = computed(() => {
  const { col, dir } = ordem.value
  return [...filtrados.value].sort((a, b) => {
    const va = valor(a, col)
    const vb = valor(b, col)
    const cmp =
      typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), 'pt-BR')
    return cmp * dir || a.nome.localeCompare(b.nome, 'pt-BR')
  })
})

function ordenar(c: Coluna) {
  ordem.value =
    ordem.value.col === c
      ? { col: c, dir: ordem.value.dir === 1 ? -1 : 1 }
      : { col: c, dir: c === 'data' ? -1 : 1 }
}

function ariaSort(c: Coluna) {
  if (ordem.value.col !== c) return 'none'
  return ordem.value.dir === 1 ? 'ascending' : 'descending'
}
</script>

<template>
  <section class="card tabela-wrap">
    <p v-if="!linhas.length" class="vazio">Nenhuma nomeação com os filtros atuais.</p>
    <table v-else>
      <thead>
        <tr>
          <th v-for="c in colunas" :key="c.key" :aria-sort="ariaSort(c.key)">
            <button type="button" @click="ordenar(c.key)">
              {{ c.label }}
              <span class="seta" aria-hidden="true">{{
                ordem.col === c.key ? (ordem.dir === 1 ? '▲' : '▼') : '↕'
              }}</span>
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in linhas" :key="r.id">
          <td class="class" data-label="Class.">
            <span v-if="r.classificacao !== null">{{ r.classificacao }}º</span>
            <span v-else class="muted" title="Sem classificação na lista geral">—</span>
          </td>
          <td class="nome" data-label="Candidato">
            <span>{{ r.nome }}</span>
            <span class="badges">
              <span v-if="r.ato === ultimoAto?.ato" class="badge novo">Novo</span>
              <span v-if="r.pcd" class="badge pcd">PcD</span>
              <span v-if="r.listaGeral" class="badge lg">Lista Geral</span>
            </span>
          </td>
          <td data-label="Cargo" :title="r.cargo">{{ r.cargoCurto }}</td>
          <td data-label="Localidade">
            {{ r.localidade }}
            <small v-if="r.listaGeral && r.cidade" class="muted"> → {{ r.cidade }}</small>
          </td>
          <td data-label="Ato">
            <span class="ato">{{ r.ato }}</span>
            <span class="muted"> · {{ fmtData.format(r.data) }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.tabela-wrap {
  overflow: hidden;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
th {
  position: sticky;
  top: 0;
  background: var(--surface-2);
  text-align: left;
  border-bottom: 1px solid var(--border);
  padding: 0;
  z-index: 1;
}
th button {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  background: none;
  font-weight: 600;
  font-size: 13px;
  color: var(--text-2);
  cursor: pointer;
  text-align: left;
}
th[aria-sort='ascending'] button,
th[aria-sort='descending'] button {
  color: var(--text);
}
.seta {
  font-size: 10px;
  opacity: 0.7;
}
td {
  padding: 9px 12px;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}
tbody tr:hover {
  background: var(--surface-2);
}
tbody tr:last-child td {
  border-bottom: 0;
}
.class {
  font-weight: 700;
  width: 70px;
}
.nome {
  font-weight: 600;
}
.badges {
  display: inline-flex;
  gap: 4px;
  margin-left: 6px;
  flex-wrap: wrap;
  vertical-align: middle;
}
.ato {
  font-weight: 600;
}
.vazio {
  padding: 24px;
  text-align: center;
  color: var(--text-2);
  margin: 0;
}

@media (max-width: 760px) {
  thead {
    display: none;
  }
  table,
  tbody,
  tr,
  td {
    display: block;
    width: 100%;
  }
  tr {
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 10px;
  }
  td {
    border: 0;
    padding: 1px 0;
  }
  td.class {
    grid-row: span 4;
    width: auto;
    font-size: 18px;
    min-width: 40px;
  }
  td:not(.class):not(.nome) {
    font-size: 13px;
    color: var(--text-2);
  }
  .badges {
    display: flex;
    margin: 4px 0 0;
  }
}
</style>
