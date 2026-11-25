import sys
import unittest
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from gerar_dataset import ENTRADA_PADRAO, cargo_curto, normaliza_cargo, processa  # noqa: E402

ROWS = processa(ENTRADA_PADRAO.read_text(encoding="utf-8"))


class TestProcessa(unittest.TestCase):
    def test_total(self):
        self.assertEqual(len(ROWS), 174)

    def test_por_ato(self):
        self.assertEqual(
            Counter(r["ato"] for r in ROWS),
            {4592: 75, 4740: 28, 4849: 33, 4930: 26, 4994: 12},
        )

    def test_sem_classificacao(self):
        self.assertEqual(sum(r["classificacao"] is None for r in ROWS), 13)

    def test_pcd(self):
        pcd = [r for r in ROWS if r["pcd"]]
        self.assertEqual(len(pcd), 7)
        self.assertTrue(all("(" not in r["nome"] for r in ROWS))

    def test_trf4_sem_cidade(self):
        r = next(x for x in ROWS if x["nome"] == "GABRIELA LEITE KOCHENBORGER")
        self.assertEqual(r["secao"], "TRF4")
        self.assertIsNone(r["cidade"])

    def test_lista_geral_usa_coluna_cidade(self):
        r = next(x for x in ROWS if x["nome"] == "RENAN GOMES OLAZ")
        self.assertEqual(r["secao"], "RS")
        self.assertTrue(r["listaGeral"])
        self.assertEqual(r["cidade"], "Rio Grande")
        self.assertEqual(r["classificacao"], 4)
        self.assertEqual(r["localidade"], "Lista Geral – RS")

    def test_cidade_e_microrregiao(self):
        r = next(x for x in ROWS if x["cidade"] == "Curitiba")
        self.assertEqual(r["secao"], "PR")
        self.assertTrue(r["microrregiao"].startswith("PS"))

    def test_data_iso(self):
        self.assertEqual(ROWS[0]["dataPublicacao"], "2026-04-29")


class TestCargo(unittest.TestCase):
    def test_normaliza_e_resume(self):
        c = normaliza_cargo("Técnico Judiciário/Área Administrativa/Especialidade Agente da Polícia Judicial")
        self.assertEqual(c, "Técnico Judiciário / Área Administrativa / Especialidade Agente da Polícia Judicial")
        self.assertEqual(cargo_curto(c), "Técnico · Agente da Polícia Judicial")
        self.assertEqual(cargo_curto(normaliza_cargo("Analista Judiciário/ Área Judiciária")), "Analista · Judiciária")


if __name__ == "__main__":
    unittest.main()
