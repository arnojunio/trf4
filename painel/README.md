# Painel de Nomeações – TRF4 (Edital 01/2025)

```sh
npm install      # use `npx npm@11 install` se o npm 10 der erro "edgesOut"
npm run dev      # http://localhost:5173
npm run test:unit
npm run build    # gera dist/ (site estático)
```

## Dados

O painel lê um único dataset tabular, `public/nomeacoes.json`:

```json
{
  "fonte": "TRF4 – Concurso Público Edital nº 01/2025 – Candidatos Nomeados",
  "geradoEm": "2026-11-25T20:00:00+00:00",
  "totalRegistros": 174,
  "nomeacoes": [
    {
      "id": 1, "secao": "TRF4", "microrregiao": null, "cidade": null,
      "localidade": "TRF4 – Sede (Porto Alegre)",
      "cargo": "Analista Judiciário / Área Apoio Especializado / Especialidade Biblioteconomia",
      "cargoCurto": "Analista · Biblioteconomia", "carreira": "Analista",
      "classificacao": 1, "nome": "RICARDO ZACARIAS GONCALVES",
      "pcd": false, "listaGeral": true, "ato": 4592, "dataPublicacao": "2026-04-29"
    }
  ]
}
```

`secao` ∈ `TRF4 | RS | SC | PR`; `classificacao` pode ser `null`; `dataPublicacao` é AAAA-MM-DD.
O tipo correspondente está em `src/lib/tipos.ts`. Qualquer sistema que publique um JSON nesse
formato pode alimentar o painel.

**Atualizar os dados:** o arquivo é gerado a partir do texto copiado do site do TRF4
(`data.txt`, na raiz do repositório) pelo script Python:

```sh
python3 scripts/gerar_dataset.py                       # data.txt -> painel/public/nomeacoes.json
python3 -m unittest scripts/test_gerar_dataset.py      # testes do script
```

Em dev basta recarregar a página; em produção, copie o novo JSON para `dist/`.
