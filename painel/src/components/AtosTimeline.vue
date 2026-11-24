<script setup lang="ts">
import { computed } from 'vue'
import { fmtData, fmtDataCurta, useNomeacoes } from '@/composables/useNomeacoes'

const { porAto, filtros } = useNomeacoes()

const max = computed(() => Math.max(1, ...porAto.value.map((a) => a.total)))
const acumulado = computed(() => {
  let s = 0
  return porAto.value.map((a) => (s += a.total))
})

function alterna(ato: number) {
  filtros.ato = filtros.ato === ato ? null : ato
}
</script>

<template>
  <section class="card bloco">
    <header>
      <h2>Nomeações por ato</h2>
      <p class="muted">Clique em uma barra para filtrar pelo ato.</p>
    </header>
    <div class="chart" role="list">
      <button
        v-for="(a, i) in porAto"
        :key="a.ato"
        type="button"
        role="listitem"
        class="col"
        :class="{ ativo: filtros.ato === a.ato, apagado: filtros.ato && filtros.ato !== a.ato }"
        :aria-pressed="filtros.ato === a.ato"
        :aria-label="`Ato ${a.ato}, ${fmtData.format(a.data)}: ${a.total} nomeações`"
        @click="alterna(a.ato)"
      >
        <span class="tip" role="tooltip">
          <strong>Ato {{ a.ato }}</strong>
          <span>{{ fmtData.format(a.data) }}</span>
          <span>{{ a.total }} nomeações · {{ acumulado[i] }} acumuladas</span>
        </span>
        <span class="track">
          <span class="valor">{{ a.total }}</span>
          <span class="bar" :style="{ height: `${(a.total / max) * 100}%` }" />
        </span>
        <span class="x">
          <strong>{{ fmtDataCurta.format(a.data) }}</strong>
          <small>ato {{ a.ato }}</small>
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.bloco {
  padding: 16px;
}
header h2 {
  margin: 0;
  font-size: 16px;
}
header p {
  margin: 2px 0 0;
  font-size: 13px;
}
.chart {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 8px;
  margin-top: 12px;
  border-bottom: 1px solid var(--border);
}
.col {
  position: relative;
  display: flex;
  flex-direction: column;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  border-radius: 8px;
}
.col:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.track {
  height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding: 0 14%;
}
.valor {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-2);
  margin-bottom: 4px;
}
.bar {
  display: block;
  width: 100%;
  max-width: 56px;
  min-height: 2px;
  background: var(--bar);
  border-radius: 4px 4px 0 0;
  transition:
    height 0.25s ease,
    background 0.15s;
}
.col:hover .bar {
  filter: brightness(1.1);
}
.apagado .bar {
  background: var(--bar-muted);
}
.ativo .valor {
  color: var(--text);
}
.x {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 0 8px;
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.3;
}
.x strong {
  color: var(--text);
  font-weight: 600;
}
.tip {
  position: absolute;
  bottom: calc(100% - 40px);
  left: 50%;
  transform: translateX(-50%);
  display: none;
  flex-direction: column;
  gap: 1px;
  min-width: 170px;
  padding: 8px 10px;
  background: var(--text);
  color: var(--surface);
  border-radius: 8px;
  font-size: 12px;
  text-align: left;
  pointer-events: none;
  z-index: 2;
}
.col:hover .tip,
.col:focus-visible .tip {
  display: flex;
}
@media (max-width: 520px) {
  .track {
    height: 120px;
    padding: 0 6%;
  }
  .x small {
    display: none;
  }
}
</style>
