import os
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

from classifier import classify_items
from config import DEFAULT_OUTPUT, PROJECT_ROOT
from parser import read_and_parse
from report_writer import write_report


class ReportBotApp:
    def __init__(self, root):
        self.root = root
        self.root.title("檢查報告機器人")
        self.root.geometry("680x360")
        self.root.minsize(620, 330)

        self.input_path = tk.StringVar()
        self.output_path = tk.StringVar(value=str(DEFAULT_OUTPUT))
        self.status = tk.StringVar(value="請先選擇一個純文字檔。")

        frame = ttk.Frame(root, padding=24)
        frame.pack(fill="both", expand=True)

        ttk.Label(frame, text="檢查報告機器人", font=("Microsoft JhengHei", 20, "bold")).pack(anchor="w")
        ttk.Label(
            frame,
            text="選擇醫院檢查文字檔，程式會整理成 Word。只整理資料，不做判讀或診斷。",
            wraplength=610,
        ).pack(anchor="w", pady=(6, 22))

        self._path_row(frame, "輸入文字檔", self.input_path, self.choose_input)
        self._path_row(frame, "輸出 Word", self.output_path, self.choose_output)

        button_row = ttk.Frame(frame)
        button_row.pack(fill="x", pady=(22, 14))
        ttk.Button(button_row, text="產生 Word 報告", command=self.generate).pack(side="left")
        ttk.Button(button_row, text="開啟輸出資料夾", command=self.open_output_folder).pack(side="left", padx=10)

        ttk.Separator(frame).pack(fill="x", pady=8)
        ttk.Label(frame, textvariable=self.status, wraplength=610).pack(anchor="w", pady=(8, 0))

    def _path_row(self, parent, label, variable, command):
        row = ttk.Frame(parent)
        row.pack(fill="x", pady=6)
        ttk.Label(row, text=label, width=12).pack(side="left")
        ttk.Entry(row, textvariable=variable).pack(side="left", fill="x", expand=True, padx=(0, 8))
        ttk.Button(row, text="選擇", command=command).pack(side="right")

    def choose_input(self):
        path = filedialog.askopenfilename(
            title="選擇檢查資料文字檔",
            initialdir=PROJECT_ROOT / "input",
            filetypes=[("文字檔", "*.txt"), ("所有檔案", "*.*")],
        )
        if path:
            self.input_path.set(path)
            self.status.set("已選擇輸入檔，請按「產生 Word 報告」。")

    def choose_output(self):
        path = filedialog.asksaveasfilename(
            title="選擇 Word 儲存位置",
            initialdir=PROJECT_ROOT / "output",
            initialfile="檢查報告整理.docx",
            defaultextension=".docx",
            filetypes=[("Word 文件", "*.docx")],
        )
        if path:
            self.output_path.set(path)

    def generate(self):
        input_file = Path(self.input_path.get().strip())
        output_file = Path(self.output_path.get().strip())
        if not input_file.is_file():
            messagebox.showwarning("尚未選擇", "請先選擇一個純文字檔。")
            return
        if output_file.suffix.lower() != ".docx":
            output_file = output_file.with_suffix(".docx")
            self.output_path.set(str(output_file))

        try:
            parsed = read_and_parse(input_file)
            grouped = classify_items(parsed)
            count = sum(len(rows) for categories in grouped.values() for rows in categories.values())
            if count == 0:
                messagebox.showwarning("沒有資料", "文字檔中沒有可整理的內容。")
                return
            write_report(grouped, output_file)
        except Exception as exc:
            messagebox.showerror("產生失敗", f"無法產生報告：\n{exc}")
            self.status.set("產生失敗，原始檔案沒有被修改。")
            return

        self.status.set(f"完成：已整理 {count} 個項目。\n{output_file}")
        if messagebox.askyesno("完成", f"已整理 {count} 個項目。\n\n要現在開啟 Word 報告嗎？"):
            os.startfile(output_file)

    def open_output_folder(self):
        output = Path(self.output_path.get().strip() or DEFAULT_OUTPUT)
        output.parent.mkdir(parents=True, exist_ok=True)
        os.startfile(output.parent)


def main():
    root = tk.Tk()
    try:
        root.iconname("檢查報告機器人")
    except tk.TclError:
        pass
    ReportBotApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
