import tempfile
import unittest
from pathlib import Path

from docx import Document

from classifier import classify_items
from parser import parse_text
from report_writer import write_report


class ParserTests(unittest.TestCase):
    def test_hospital_tabular_format(self):
        text = """檢體　　：
(Specimen type)\tBlood
醫囑名稱：
(Medical order)\tNA,K,Ca,P,Crea,BUN,CRP,ALT,Bil-T,Alb,
項目\tH/L\t結果\t前次結果\t單位\t參考值
BUN\t H  \t 34  \t(  )\t mg/dL \t 6~20 mg/dL
Na\t L  \t 133  \t(  )\t mmol/L \t 136~145 mmol/L
K\t   \t 4.3 \t(  )\t mmol/L \t 3.5~5.1 mmol/L
"""
        items = parse_text(text)

        self.assertEqual([item.raw_name for item in items], ["BUN", "Na", "K"])
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
            self.assertEqual(headings, ["抽血檢查", "驗尿檢查", "影像檢查"])
            self.assertEqual(
                [cell.text for cell in doc.tables[0].rows[0].cells],
                ["中文項目", "English", "結果", "正常值"],
            )
            result_cell = doc.tables[0].rows[1].cells[2]
            self.assertTrue(any(run.bold for run in result_cell.paragraphs[0].runs))
            image_text = doc.tables[-1].rows[1].cells[2].text
            self.assertIn("Finding: Test finding.", image_text)
            self.assertIn("Impression: Test impression.", image_text)


if __name__ == "__main__":
    unittest.main()
