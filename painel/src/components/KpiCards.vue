<script setup lang="ts">
import { computed } from 'vue'
import { fmtData, useNomeacoes } from '@/composables/useNomeacoes'

const { filtrados, ultimoAto, filtrosAtivos } = useNomeacoes()

const kpis = computed(() => {
  const rows = filtrados.value
  const ult = ultimoAto.value
  return {
    total: rows.length,
    analistas: rows.filter((r) => r.carreira === 'Analista').length,
    tecnicos: rows.filter((r) => r.carreira === 'Técnico').length,
    localidades: new Set(rows.map((r) => r.localidade)).size,
    cargos: new Set(rows.map((r) => r.cargoCurto)).size,
    pcd: rows.filter((r) => r.pcd).length,
    novos: ult ? rows.filter((r) => r.ato === ult.ato).length : 0,
  }
})
</script>

<template>
  <section class="kpis" aria-label="Resumo">
    <div class="card kpi">
      <span class="label">Nomeados{{ filtrosAtivos ? ' (filtro)' : '' }}</span>
      <strong class="value">{{ kpis.total }}</strong>
      <span class="sub">{{ kpis.analistas }} analistas · {{ kpis.tecnicos }} técnicos</span>
    </div>
    <div v-if="ultimoAto" class="card kpi destaque">
      <span class="label">Último ato</span>
      <strong class="value">nº {{ ultimoAto.ato }}</strong>
      <span class="sub">
        {{ fmtData.format(ultimoAto.data) }} ·
        <span class="badge novo">+{{ kpis.novos }} nomeações</span>
      </span>
    </div>
    <div class="card kpi">
      <span class="label">Localidades</span>
      <strong class="value">{{ kpis.localidades }}</strong>
      <span class="sub">{{ kpis.cargos }} cargos diferentes</span>
    </div>
    <div class="card kpi">
      <span class="label">Pessoas com deficiência</span>
      <strong class="value">{{ kpis.pcd }}</strong>
      <span class="sub">nomeadas por cota PcD</span>
    </div>
  </section>
</template>

<style scoped>
.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.kpi {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.label {
  font-size: 13px;
  color: var(--text-2);
  font-weight: 500;
}
.value {
  font-size: 30px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.sub {
  font-size: 13px;
  color: var(--text-2);
}
.destaque {
  border-color: var(--accent);
}
@media (max-width: 860px) {
  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 420px) {
  .value {
    font-size: 24px;
  }
}
</style>
