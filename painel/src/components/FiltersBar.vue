<script setup lang="ts">
import { watch } from 'vue'
import { fmtDataCurta, useNomeacoes } from '@/composables/useNomeacoes'
import { SECAO_LABEL, type Secao } from '@/lib/parser'

const { filtros, opcoes, atos, filtrosAtivos, limpar, filtrados } = useNomeacoes()

const secoes = Object.entries(SECAO_LABEL) as Array<[Secao, string]>

// Ao trocar a seção, descarta localidade/cargo que não existem mais nela.
watch(
  () => filtros.secao,
  () => {
    if (filtros.localidade && !opcoes.value.localidades.includes(filtros.localidade))
      filtros.localidade = ''
    if (filtros.cargo && !opcoes.value.cargos.includes(filtros.cargo)) filtros.cargo = ''
  },
)
</script>

<template>
  <section class="card filtros" aria-label="Filtros">
    <label class="busca">
      <span class="sr-only">Buscar</span>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 2-4.3-4.3"
        />
      </svg>
      <input v-model="filtros.q" type="search" placeholder="Buscar por nome, cidade ou cargo…" />
    </label>

    <select v-model="filtros.secao" aria-label="Seção">
      <option value="">Todas as seções</option>
      <option v-for="[k, v] in secoes" :key="k" :value="k">{{ v }}</option>
    </select>

    <select v-model="filtros.localidade" aria-label="Localidade">
      <option value="">Todas as localidades</option>
      <option v-for="l in opcoes.localidades" :key="l" :value="l">{{ l }}</option>
    </select>

    <select v-model="filtros.cargo" aria-label="Cargo">
      <option value="">Todos os cargos</option>
      <option v-for="c in opcoes.cargos" :key="c" :value="c">{{ c }}</option>
    </select>

    <select v-model="filtros.ato" aria-label="Ato">
      <option :value="null">Todos os atos</option>
      <option v-for="a in atos" :key="a.ato" :value="a.ato">
        Ato {{ a.ato }} · {{ fmtDataCurta.format(a.data) }}
      </option>
    </select>

    <div class="toggles">
      <label class="chip" :class="{ on: filtros.pcd }">
        <input v-model="filtros.pcd" type="checkbox" /> PcD
      </label>
      <label class="chip" :class="{ on: filtros.listaGeral }">
        <input v-model="filtros.listaGeral" type="checkbox" /> Lista Geral
      </label>
      <button v-if="filtrosAtivos" class="limpar" type="button" @click="limpar">
        Limpar ({{ filtrosAtivos }})
      </button>
    </div>
    <p v-if="filtrosAtivos" class="resultado" aria-live="polite">
      {{ filtrados.length }} nomeação(ões) encontradas
    </p>
  </section>
</template>

<style scoped>
.filtros {
  display: grid;
  grid-template-columns: minmax(220px, 2fr) repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 12px;
  align-items: center;
}
.busca {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text-3);
  height: 40px;
}
.busca:focus-within {
  border-color: var(--accent);
  outline: 2px solid var(--accent-soft);
}
.busca input {
  border: 0;
  background: transparent;
  outline: none;
  width: 100%;
  min-width: 0;
  color: var(--text);
}
select {
  height: 40px;
  min-width: 0;
  width: 100%;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  cursor: pointer;
}
select:focus-visible {
  outline: 2px solid var(--accent);
}
.toggles {
  grid-column: 1 / -1;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}
.chip input {
  accent-color: var(--accent);
  margin: 0;
}
.chip.on {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent-text);
  font-weight: 600;
}
.limpar {
  margin-left: auto;
  border: 0;
  background: none;
  color: var(--accent-text);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
}
.limpar:hover {
  text-decoration: underline;
}
.resultado {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 13px;
  color: var(--text-2);
}
@media (max-width: 980px) {
  .filtros {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .busca {
    grid-column: 1 / -1;
  }
}
</style>
