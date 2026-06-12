# Medical Report Bot

將醫院檢驗系統貼出的純文字，整理成給病人閱讀的 Word 檢查報告。本工具只整理資料，不提供診斷、判讀、推論、衛教或醫療建議。

## 安裝

```bash
python -m pip install -r requirements.txt
```

## 執行

### 最簡單方式

用滑鼠點兩下：

```text
啟動報告機器人.bat
```

接著選擇文字檔，按「產生 Word 報告」即可。

第一次開啟時，如果電腦尚未安裝 Word 報告工具，啟動檔會自動安裝。這個步驟需要網路，通常只會執行一次。

### 指令方式

在專案資料夾中執行：

```bash
python generate_report.py input/sample_input.txt
```

預設輸出：

```text
output/檢查報告整理.docx
```

也可以指定輸出位置：

```bash
python generate_report.py input/sample_input.txt -o output/我的報告.docx
```

## 輸入格式

建議每行使用直線分隔：

```text
項目 | 結果 | 單位 | 正常值 | H或L
```

檢體區塊可使用：

```text
SPECIMEN: BLOOD
SPECIMEN: URINE(SPOT)
```

影像檢查可直接貼上檢查名稱與完整原文。Finding、Impression、Conclusion 會保留，不會摘要或改寫。

## 輸出格式

大類順序固定為抽血、驗尿、影像、其他。沒有資料的分類不顯示。抽血與驗尿表格欄位為中文項目、English、結果、正常值；影像表格欄位為中文檢查項目、English、檢查結果。

## 新增 mapping

編輯 `mapping.py` 的 `LAB_MAPPING`，每個項目需包含：

```python
{
    "aliases": [],
    "zh": "",
    "en": "",
    "section": "",
    "category": "",
    "order": 0,
}
```

English 建議使用 `English Full Name, Abbreviation` 格式。

## 未知項目

未知項目不會刪除。程式會保留原始名稱、結果、單位及正常值，並依檢體來源放入其他抽血、其他尿液、其他影像或其他檢查項目。

## 修改分類順序

編輯 `config.py` 的 `SECTION_ORDER`、`BLOOD_CATEGORY_ORDER`、`URINE_CATEGORY_ORDER` 或 `IMAGE_CATEGORY_ORDER`。

## 修改 Word 樣式

編輯 `styles.py`。頁面、字型、顏色、表格框線與儲存格間距都集中在此檔案。

## 注意事項

- 本工具只做資料整理。
- 不可用本工具取代醫師或其他醫療專業人員。
- 原始資料若含病人個資，請依院內規範保管。
- 只有原始資料明確標示 H 或 L 時，結果才會加粗；程式不自行判定異常。

## 自動測試

```bash
python -m unittest discover -v
```
