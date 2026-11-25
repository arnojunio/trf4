<script setup lang="ts">
import { ref } from 'vue'
import AtosTimeline from '@/components/AtosTimeline.vue'
import FiltersBar from '@/components/FiltersBar.vue'
import KpiCards from '@/components/KpiCards.vue'
import NomeacoesTable from '@/components/NomeacoesTable.vue'
import ProgressoPorVaga from '@/components/ProgressoPorVaga.vue'
import { fmtData, useNomeacoes } from '@/composables/useNomeacoes'

const { loading, error, ultimoAto, filtrados } = useNomeacoes()

type Aba = 'geral' | 'candidatos'
const aba = ref<Aba>(new URLSearchParams(location.search).has('q') ? 'candidatos' : 'geral')

function irParaCandidatos() {
  aba.value = 'candidatos'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="app">
    <header class="hero">
      <div>
        <p class="eyebrow">Concurso Público · Edital nº 01/2025</p>
        <h1>Nomeações TRF4</h1>
        <p class="muted">
          Tribunal Regional Federal da 4ª Região e Seções Judiciárias do RS, SC e PR
        </p>
      </div>
      <p v-if="ultimoAto" class="atualizado">
        Atualizado até o ato <strong>{{ ultimoAto.ato }}</strong><br />
        <span class="muted">{{ fmtData.format(ultimoAto.data) }}</span>
      </p>
    </header>

    <p v-if="loading" class="card estado">Carregando nomeações…</p>
    <p v-else-if="error" class="card estado erro">{{ error }}</p>

    <template v-else>
      <KpiCards />
      <FiltersBar />

      <nav class="abas" role="tablist">
        <button
          role="tab"
          :aria-selected="aba === 'geral'"
          :class="{ on: aba === 'geral' }"
          @click="aba = 'geral'"
        >
          Visão geral
        </button>
        <button
          role="tab"
          :aria-selected="aba === 'candidatos'"
          :class="{ on: aba === 'candidatos' }"
          @click="aba = 'candidatos'"
        >
          Candidatos <span class="count">{{ filtrados.length }}</span>
        </button>
      </nav>

      <main v-if="aba === 'geral'" class="geral" role="tabpanel">
        <AtosTimeline />
        <ProgressoPorVaga @ver="irParaCandidatos" />
      </main>
      <main v-else role="tabpanel">
        <NomeacoesTable />
      </main>
    </template>

    <footer class="rodape muted">
      Fonte: lista de candidatos nomeados publicada pelo TRF4 (dataset <code>nomeacoes.json</code>).
      Para atualizar, gere o arquivo com <code>python3 scripts/gerar_dataset.py</code>.
    </footer>
  </div>
</template>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}
.eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent-text);
}
h1 {
  margin: 2px 0;
  font-size: 28px;
  letter-spacing: -0.02em;
}
.hero p.muted {
  margin: 0;
  font-size: 14px;
}
.atualizado {
  margin: 0;
  text-align: right;
  font-size: 13px;
}
.estado {
  padding: 24px;
  text-align: center;
}
.erro {
  color: #c0392b;
}
.abas {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border);
}
.abas button {
  border: 0;
  background: none;
  padding: 10px 14px;
  font-weight: 600;
  color: var(--text-2);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.abas button.on {
  color: var(--text);
  border-bottom-color: var(--accent);
}
.count {
  font-size: 12px;
  background: var(--surface-2);
  border-radius: 999px;
  padding: 0 8px;
}
.geral {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.rodape {
  font-size: 12px;
  text-align: center;
  margin-top: 16px;
}
@media (max-width: 520px) {
  .atualizado {
    text-align: left;
  }
  h1 {
    font-size: 24px;
  }
}
</style>
