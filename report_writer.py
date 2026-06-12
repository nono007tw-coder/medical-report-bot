from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt

from styles import configure_document, set_run_font, style_table


def _result_text(row):
    return " ".join(part for part in (row["result"], row["unit"]) if part).strip()


def _add_title(doc):
    paragraph = doc.add_paragraph(style="Title")
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run("檢查報告整理")
    set_run_font(run, size=20, bold=True)


def _add_lab_table(doc, rows):
    table = doc.add_table(rows=1, cols=4)
    headers = ["中文項目", "English", "結果", "正常值"]
    for cell, text in zip(table.rows[0].cells, headers):
        cell.text = text
    for row in rows:
        cells = table.add_row().cells
        values = [row["zh"], row["en"], _result_text(row), row["reference"]]
        for cell, value in zip(cells, values):
            cell.text = value
        if row["flag"] in {"H", "L"}:
            for run in cells[2].paragraphs[0].runs:
                run.bold = True
    style_table(table, [3.0, 6.5, 3.2, 4.4])


def _add_image_table(doc, rows):
    table = doc.add_table(rows=1, cols=3)
    headers = ["中文檢查項目", "English", "檢查結果"]
    for cell, text in zip(table.rows[0].cells, headers):
        cell.text = text
    for row in rows:
        cells = table.add_row().cells
        result = row["raw_text"] or _result_text(row)
        values = [row["zh"], row["en"], result]
        for cell, value in zip(cells, values):
            cell.text = value
    style_table(table, [3.5, 5.0, 8.6], body_center_columns=())


def _add_other_table(doc, rows):
    table = doc.add_table(rows=1, cols=4)
    headers = ["項目", "English", "結果", "正常值"]
    for cell, text in zip(table.rows[0].cells, headers):
        cell.text = text
    for row in rows:
        cells = table.add_row().cells
        values = [row["zh"], row["en"], _result_text(row) or row["raw_text"], row["reference"]]
        for cell, value in zip(cells, values):
            cell.text = value
    style_table(table, [3.2, 5.4, 4.0, 4.5])


def write_report(grouped, output_path):
    doc = Document()
    configure_document(doc)
    _add_title(doc)

    for section, categories in grouped.items():
        doc.add_paragraph(section, style="Heading 1")
        for category, rows in categories.items():
            doc.add_paragraph(category, style="Heading 2")
            if section == "影像檢查":
                _add_image_table(doc, rows)
            elif section in {"抽血檢查", "驗尿檢查"}:
                _add_lab_table(doc, rows)
            else:
                _add_other_table(doc, rows)
            spacer = doc.add_paragraph()
            spacer.paragraph_format.space_after = Pt(2)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(output_path)
    return output_path
