<script setup lang="ts">
import { computed } from 'vue'
import { fmtDataCurta, useNomeacoes, type GrupoVaga } from '@/composables/useNomeacoes'
import { SECAO_LABEL, type Secao } from '@/lib/parser'

const emit = defineEmits<{ ver: [] }>()
const { grupos, filtros } = useNomeacoes()

const porSecao = computed(() => {
  const m = new Map<Secao, GrupoVaga[]>()
  for (const g of grupos.value) {
    if (!m.has(g.secao)) m.set(g.secao, [])
    m.get(g.secao)!.push(g)
  }
  return [...m.entries()].map(([secao, itens]) => ({
    secao,
    itens,
    total: itens.reduce((s, g) => s + g.total, 0),
  }))
})

function verCandidatos(g: GrupoVaga) {
  filtros.secao = g.secao
  filtros.localidade = g.localidade
  filtros.cargo = g.cargoCurto
  emit('ver')
}
</script>

<template>
  <section class="progresso">
    <header class="topo">
      <div>
        <h2>Até onde a lista andou</h2>
        <p class="muted">
          Maior classificação nomeada em cada localidade e cargo. Os círculos mostram cada
          classificação já chamada (s/c = nomeado sem número de classificação na lista).
        </p>
      </div>
      <ul class="legenda" aria-label="Legenda">
        <li><span class="pos" /> Ampla / geral</li>
        <li><span class="pos pcd" /> PcD</li>
        <li><span class="pos novo" /> Último ato</li>
      </ul>
    </header>

    <p v-if="!porSecao.length" class="card vazio">Nenhuma nomeação com os filtros atuais.</p>

    <div v-for="s in porSecao" :key="s.secao" class="secao">
      <h3>
        {{ SECAO_LABEL[s.secao] }}
        <span class="muted">· {{ s.total }} nomeados em {{ s.itens.length }} listas</span>
      </h3>
      <div class="grid">
        <article v-for="g in s.itens" :key="g.key" class="card vaga">
          <div class="cab">
            <div class="min">
              <template v-if="g.secao === 'TRF4'">
                <p class="local" :title="g.cargo">{{ g.cargoCurto }}</p>
                <p class="cargo">Sede · Porto Alegre</p>
              </template>
              <template v-else>
                <p class="local">{{ g.localidade }}</p>
                <p class="cargo" :title="g.cargo">{{ g.cargoCurto }}</p>
              </template>
            </div>
            <div v-if="g.maiorClass" class="ate">
              <small>até a</small>
              <strong>{{ g.maiorClass }}<sup>ª</sup></strong>
            </div>
            <div v-else class="ate">
              <small>sem</small>
              <small>classificação</small>
            </div>
          </div>
          <ol class="posicoes" :aria-label="`Classificações nomeadas: ${g.total}`">
            <li
              v-for="(c, i) in g.classificacoes"
              :key="i"
              class="pos"
              :class="{ pcd: c.pcd, novo: c.novo, sc: c.n === null }"
              :title="`${c.n ? c.n + 'º – ' : 'Sem classificação geral – '}${c.nome}${c.pcd ? ' (PcD)' : ''}`"
            >
              {{ c.n ?? 's/c' }}
            </li>
          </ol>
          <footer>
            <span>
              {{ g.total }} {{ g.total === 1 ? 'nomeado' : 'nomeados' }}
              <span v-if="g.novos" class="badge novo">+{{ g.novos }} novo{{ g.novos > 1 ? 's' : '' }}</span>
            </span>
            <span class="muted">último: {{ fmtDataCurta.format(g.ultimoAto.data) }}</span>
          </footer>
          <button type="button" class="ver" @click="verCandidatos(g)">Ver candidatos →</button>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.topo {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
h2 {
  margin: 0;
  font-size: 18px;
}
.topo p {
  margin: 2px 0 0;
  font-size: 13px;
  max-width: 60ch;
}
.legenda {
  display: flex;
  gap: 14px;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 12px;
  color: var(--text-2);
}
.legenda li {
  display: flex;
  align-items: center;
  gap: 6px;
}
.legenda .pos {
  width: 14px;
  height: 14px;
  min-width: 0;
  padding: 0;
}
.secao {
  margin-top: 20px;
}
h3 {
  font-size: 15px;
  margin: 0 0 10px;
}
h3 .muted {
  font-weight: 400;
  font-size: 13px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  align-items: start;
  gap: 12px;
}
.vaga {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cab {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.min {
  min-width: 0;
}
.local {
  margin: 0;
  font-weight: 700;
}
.cargo {
  margin: 0;
  font-size: 13px;
  color: var(--text-2);
}
.ate {
  text-align: right;
  line-height: 1;
  flex-shrink: 0;
}
.ate small {
  display: block;
  font-size: 11px;
  color: var(--text-3);
  margin-bottom: 2px;
}
.ate strong {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent-text);
  letter-spacing: -0.02em;
}
.ate sup {
  font-size: 14px;
}
.posicoes {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.pos {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
  padding: 0 5px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: var(--accent-soft);
  color: var(--accent-text);
  border: 2px solid transparent;
  cursor: default;
}
.pos.pcd {
  background: var(--pcd-soft);
  color: var(--pcd);
}
.pos.novo {
  border-color: var(--novo);
}
.pos.sc {
  font-size: 10px;
}
footer {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  flex-wrap: wrap;
}
.ver {
  align-self: flex-start;
  border: 0;
  background: none;
  padding: 0;
  color: var(--accent-text);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.ver:hover {
  text-decoration: underline;
}
.vazio {
  padding: 24px;
  text-align: center;
  color: var(--text-2);
}
</style>
