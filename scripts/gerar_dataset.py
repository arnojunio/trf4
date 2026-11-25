#!/usr/bin/env python3
"""Converte o texto copiado da página de nomeações do TRF4 (data.txt) em um
dataset JSON tabular, consumido pelo painel (painel/public/nomeacoes.json).

Uso:
    python3 scripts/gerar_dataset.py [entrada] [saida]
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import date, datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ENTRADA_PADRAO = RAIZ / "data.txt"
SAIDA_PADRAO = RAIZ / "painel" / "public" / "nomeacoes.json"

FONTE = "TRF4 – Concurso Público Edital nº 01/2025 – Candidatos Nomeados"

ESTADOS = [
    ("RIO GRANDE DO SUL", "RS"),
    ("SANTA CATARINA", "SC"),
    ("PARANÁ", "PR"),
]

RE_PCD = re.compile(r"\s*\(Cand\. Port\. Def\.\)", re.IGNORECASE)
RE_LISTA_GERAL = re.compile(r"\s*\(Nomeado pela Lista Geral[^)]*\)", re.IGNORECASE)
RE_JUDICIARIO = re.compile(r"judici[aá]rio", re.IGNORECASE)
RE_MICRO = re.compile(r"^MICRORREGIÃO\s+", re.IGNORECASE)

MINUSCULAS = {"da", "das", "de", "do", "dos", "e"}


class ErroEstrutura(ValueError):
    """O arquivo de entrada não segue a estrutura esperada."""


def secao_de(linha: str) -> str:
    up = linha.upper()
    for nome, sigla in ESTADOS:
        if nome in up:
            return sigla
    raise ErroEstrutura(f"Seção desconhecida: {linha}")


def normaliza_cargo(raw: str) -> str:
    s = re.sub(r"\s*/\s*", " / ", raw)
    return re.sub(r"\s+", " ", s).strip()


def cargo_curto(cargo: str) -> str:
    partes = cargo.split(" / ")
    carreira = partes[0].split(" ")[0]
    ultimo = re.sub(r"^(Área|Especialidade)\s+", "", partes[-1])
    return f"{carreira} · {ultimo}"


def titulo_cidade(s: str) -> str:
    palavras = s.lower().split(" ")
    return " ".join(
        w if i > 0 and w in MINUSCULAS else w[:1].upper() + w[1:]
        for i, w in enumerate(palavras)
    )


def data_iso(s: str) -> str:
    d, m, y = (int(x) for x in s.split("/"))
    return date(y, m, d).isoformat()


def processa(texto: str) -> list[dict]:
    out: list[dict] = []
    secao = micro = cidade = cargo = None
    em_lista_geral = False
    tem_coluna_cidade = False

    for n_linha, raw in enumerate(texto.splitlines(), start=1):
        linha = raw.strip()
        if not linha:
            continue

        if "\t" in raw:
            cols = [c.strip() for c in raw.split("\t")]
            if cols[0] == "Class.":
                tem_coluna_cidade = "Cidade" in cols
                continue
            if not secao or not cargo:
                raise ErroEstrutura(f"Linha {n_linha}: candidato fora de contexto: {linha}")

            data_str = cols.pop()
            ato_str = cols.pop()
            classificacao = int(cols.pop(0)) if cols and cols[0].isdigit() else None
            nome = cols.pop(0) if cols else ""
            cidade_col = (cols.pop(0) if cols else None) if tem_coluna_cidade else None

            pcd = bool(RE_PCD.search(nome))
            marcador_lg = bool(RE_LISTA_GERAL.search(nome))
            nome = RE_LISTA_GERAL.sub("", RE_PCD.sub("", nome)).strip()

            if secao == "TRF4":
                localidade = "TRF4 – Sede (Porto Alegre)"
            elif em_lista_geral:
                localidade = f"Lista Geral – {secao}"
            else:
                localidade = cidade or "—"

            out.append(
                {
                    "id": len(out) + 1,
                    "secao": secao,
                    "microrregiao": micro,
                    "cidade": titulo_cidade(cidade_col) if cidade_col else cidade,
                    "localidade": localidade,
                    "cargo": cargo,
                    "cargoCurto": cargo_curto(cargo),
                    "carreira": "Analista" if cargo.startswith("Analista") else "Técnico",
                    "classificacao": classificacao,
                    "nome": nome,
                    "pcd": pcd,
                    "listaGeral": em_lista_geral or marcador_lg,
                    "ato": int(ato_str),
                    "dataPublicacao": data_iso(data_str),
                }
            )
            continue

        # Linhas de estrutura (sem TAB)
        up = linha.upper()
        if up.startswith("CONCURSO PÚBLICO") or up == "CANDIDATOS NOMEADOS":
            continue
        if up.startswith("TRIBUNAL REGIONAL FEDERAL"):
            secao, micro, cidade, cargo, em_lista_geral = "TRF4", None, None, None, False
        elif up.startswith("LISTA GERAL"):
            secao, micro, cidade, cargo, em_lista_geral = secao_de(linha), None, None, None, True
        elif up.startswith("SEÇÃO JUDICIÁRIA"):
            secao, micro, cidade, cargo, em_lista_geral = secao_de(linha), None, None, None, False
        elif up.startswith("MICRORREGIÃO"):
            partes = RE_MICRO.sub("", linha).split(" - ")
            micro = " – ".join(p if i == 0 else titulo_cidade(p) for i, p in enumerate(partes))
            cidade = cargo = None
        elif RE_JUDICIARIO.search(linha):
            cargo = normaliza_cargo(linha)
        else:
            cidade = titulo_cidade(linha)
            cargo = None

    return out


def monta_dataset(registros: list[dict]) -> dict:
    return {
        "fonte": FONTE,
        "geradoEm": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "totalRegistros": len(registros),
        "nomeacoes": registros,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("entrada", nargs="?", type=Path, default=ENTRADA_PADRAO)
    ap.add_argument("saida", nargs="?", type=Path, default=SAIDA_PADRAO)
    args = ap.parse_args()

    registros = processa(args.entrada.read_text(encoding="utf-8"))
    args.saida.parent.mkdir(parents=True, exist_ok=True)
    args.saida.write_text(
        json.dumps(monta_dataset(registros), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{len(registros)} nomeações gravadas em {args.saida}")


if __name__ == "__main__":
    main()
