import tempfile
import unittest
from pathlib import Path

from docx import Document

from classifier import classify_items
from parser import parse_text
from report_writer import write_report


class ParserTests(unittest.TestCase):
    def test_irregular_cbc_differential_format(self):
        text = """檢體　　：
(Specimen type)\tBlood
醫囑名稱：
(Medical order)\tDC,WBC,Hb,Plt,
項目\tH/L\t結果\t前次結果\t 單位\t  參考值
WBC\t   \t6600\t(  )\t/uL\t4180 ~ 9380
RBC\t   \t\t(  )\t\t
Hb\tL\t8.7\t(  )\tg/dL\t13.3 ~ 17.4
Plt\t   \t171000\t(  )\t/uL\t145000 ~ 383000
ANC\t   \t4415\t(  )\t/uL\t1890 ~ 6760
DC :%\t\t\t\t\t
Band\t   \t0.0\t(  )\t%\t0 ~ 5
Neu.\t   \t66.9\t(  )\t%\t45.0 ~ 81.2
Lym.\t   \t14.8\t(  )\t%\t13.0 ~ 45.5
Mono.\tH\t10.5\t(  )\t%\t3.7 ~ 8.8
Eos.\tH\t7.6\t(  )\t%\t0.2 ~ 6.6
Baso.\t   \t0.2\t(  )\t%\t0.1 ~ 1.6
"""
        items = parse_text(text)
        grouped = classify_items(items)
        rows = grouped["抽血檢查"]["血液常規檢查"]

        self.assertNotIn("DC", [item.raw_name for item in items])
        self.assertEqual(
            [row["key"] for row in rows],
            [
                "WBC", "Hb", "Platelet", "ANC", "Band",
                "Neutrophil", "Lymphocyte", "Monocyte",
                "Eosinophil", "Basophil",
            ],
        )
        self.assertEqual(rows[1]["result"], "8.7")
        self.assertEqual(rows[1]["flag"], "L")
        self.assertEqual(rows[7]["flag"], "H")
        self.assertEqual(rows[8]["reference"], "0.2 ~ 6.6")

    def test_hospital_tabular_format(self):
        text = """檢體　　：
(Specimen type)\tBlood
醫囑名稱：
(Medical order)\tNA,K,Ca,P,Crea,BUN,CRP,ALT,Bil-T,Alb,
項目\tH/L\t結果\t前次結果\t單位\t參考值
BUN\t H  \t 34  \t(  )\t mg/dL \t 6~20 mg/dL
Na\t L  \t 133  \t(  )\t mmol/L \t 136~145 mmol/L
K\t   \t 4.3 \t(  )\t mmol/L \t 3.5~5.1 mmol/L
Cl\t   \t  \t(  )\t  \t
GLU\t   \t  \t(  )\t  \t
Creat\t H  \t 6.34 \t(  )\t mg/dL \t M:0.7~1.2; F:0.5-0.9 mg/dL
ALT\t   \t 15 \t(  )\t U/L \t M:<41; F:<33 U/L
"""
        items = parse_text(text)

        self.assertEqual(
            [item.raw_name for item in items],
            ["BUN", "Na", "K", "Cl", "GLU", "Creat", "ALT"],
        )
        self.assertEqual(items[0].specimen, "Blood")
        self.assertEqual(
            (items[0].flag, items[0].result, items[0].unit, items[0].reference),
            ("H", "34", "mg/dL", "6~20 mg/dL"),
        )
        self.assertEqual(
            (items[1].flag, items[1].result, items[1].unit, items[1].reference),
            ("L", "133", "mmol/L", "136~145 mmol/L"),
        )
        self.assertEqual(
            (items[2].flag, items[2].result, items[2].unit, items[2].reference),
            ("", "4.3", "mmol/L", "3.5~5.1 mmol/L"),
        )
        self.assertEqual(
            (items[5].flag, items[5].result, items[5].unit, items[5].reference),
            ("H", "6.34", "mg/dL", "M:0.7~1.2; F:0.5-0.9 mg/dL"),
        )
        self.assertEqual(
            (items[6].flag, items[6].result, items[6].unit, items[6].reference),
            ("", "15", "U/L", "M:<41; F:<33 U/L"),
        )

    def test_pipe_format_and_parentheses(self):
        items = parse_text("SPECIMEN: BLOOD\nCreatinine | ( 2.10 ) | mg/dL | 0.5-1.1 | H")
        self.assertEqual(items[0].result, "2.10")
        self.assertEqual(items[0].flag, "H")

    def test_inline_flag_and_specimen_heading(self):
        items = parse_text("[BLOOD]\nHb | 10.2 L | g/dL | 12.0-16.0")
        self.assertEqual(items[0].specimen, "BLOOD")
        self.assertEqual(items[0].result, "10.2")
        self.assertEqual(items[0].flag, "L")

    def test_tab_and_colon_formats(self):
        items = parse_text("SERUM\nNa\t139\tmmol/L\t136-145\nK: 4.5 mmol/L | 3.5-5.1")
        self.assertEqual(len(items), 2)
        self.assertEqual(items[0].raw_name, "Na")
        self.assertEqual(items[1].raw_name, "K")

    def test_unknown_items_are_preserved(self):
        grouped = classify_items(parse_text(
            "SPECIMEN: URINE\nUnknown Crystal | Few | | N/A"
        ))
        rows = grouped["驗尿檢查"]["其他尿液檢查"]
        self.assertEqual(rows[0]["zh"], "Unknown Crystal")

    def test_duplicate_aliases_are_removed(self):
        grouped = classify_items(parse_text(
            "SPECIMEN: BLOOD\nCreatinine | 2.1 | mg/dL | 0.5-1.1\n"
            "Crea | 2.1 | mg/dL | 0.5-1.1"
        ))
        self.assertEqual(len(grouped["抽血檢查"]["腎功能檢查"]), 1)


class ReportTests(unittest.TestCase):
    def test_hospital_format_report_keeps_reference_columns(self):
        grouped = classify_items(parse_text(
            "檢體　　：\n"
            "(Specimen type)\tBlood\n"
            "項目\tH/L\t結果\t前次結果\t單位\t參考值\n"
            "Cl\t\t\t(  )\t\t\n"
            "Creat\tH\t6.34\t(  )\tmg/dL\tM:0.7~1.2; F:0.5-0.9 mg/dL\n"
            "ALT\t\t15\t(  )\tU/L\tM:<41; F:<33 U/L\n"
        ))
        rows = [
            row
            for categories in grouped.values()
            for category_rows in categories.values()
            for row in category_rows
        ]

        self.assertEqual({row["key"] for row in rows}, {"Creatinine", "ALT"})
        creatinine = next(row for row in rows if row["key"] == "Creatinine")
        alt = next(row for row in rows if row["key"] == "ALT")
        self.assertEqual(creatinine["reference"], "M:0.7~1.2; F:0.5-0.9 mg/dL")
        self.assertEqual(alt["reference"], "M:<41; F:<33 U/L")

    def test_docx_columns_order_and_bold_flag(self):
        grouped = classify_items(parse_text(
            "SPECIMEN: BLOOD\nHb | 10.2 | g/dL | 12.0-16.0 | L\n"
            "SPECIMEN: URINE\nACR | 60 | mg/g | <30 | H\n"
            "Abdominal Sonography\nFinding: Test finding.\nImpression: Test impression."
        ))
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "report.docx"
            write_report(grouped, output)
            doc = Document(output)
            headings = [p.text for p in doc.paragraphs if p.style.name == "Heading 1"]
            self.assertEqual(headings, ["1. 血液檢查", "3. 尿液檢查", "4. 影像檢查"])
            self.assertEqual(
                [cell.text for cell in doc.tables[0].rows[0].cells],
                ["中文項目", "英文項目", "結果", "正常值"],
            )
            result_cell = doc.tables[0].rows[1].cells[2]
            self.assertTrue(any(run.bold for run in result_cell.paragraphs[0].runs))
            self.assertEqual(len(doc.tables[-1].columns), 4)
            image_text = doc.tables[-1].rows[1].cells[2].text
            self.assertIn("Finding: Test finding.", image_text)
            self.assertIn("Impression: Test impression.", image_text)
            report_text = "\n".join(
                [paragraph.text for paragraph in doc.paragraphs]
                + [cell.text for table in doc.tables for row in table.rows for cell in row.cells]
            )
            self.assertNotIn("原始資料", report_text)
            self.assertNotIn("English", report_text)
            self.assertNotIn("其他抽血", report_text)


if __name__ == "__main__":
    unittest.main()
