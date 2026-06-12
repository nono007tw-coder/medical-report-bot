import argparse
from pathlib import Path

from classifier import classify_items
from config import DEFAULT_OUTPUT
from parser import read_and_parse
from report_writer import write_report


def main():
    parser = argparse.ArgumentParser(description="將原始檢查文字整理成 Word 報告。")
    parser.add_argument("input_file", type=Path, help="輸入純文字檔")
    parser.add_argument("-o", "--output", type=Path, default=DEFAULT_OUTPUT, help="輸出 DOCX 路徑")
    args = parser.parse_args()

    if not args.input_file.exists():
        parser.error(f"找不到輸入檔案：{args.input_file}")

    parsed = read_and_parse(args.input_file)
    grouped = classify_items(parsed)
    output = write_report(grouped, args.output)
    print(f"已產生：{output}")
    print(f"整理項目數：{sum(len(rows) for categories in grouped.values() for rows in categories.values())}")


if __name__ == "__main__":
    main()
