from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
DEFAULT_OUTPUT = PROJECT_ROOT / "output" / "檢查報告整理-病人閱讀版.docx"

SECTION_ORDER = ["抽血檢查", "驗尿檢查", "影像檢查", "其他檢查項目"]

BLOOD_CATEGORY_ORDER = [
    "血液常規檢查", "肝膽功能檢查", "腎功能檢查", "腎臟特殊檢查",
    "電解質與酸鹼檢查", "血糖與糖尿病相關檢查", "血脂檢查",
    "鐵質與貧血相關檢查", "維生素與營養檢查", "甲狀腺功能檢查",
    "骨礦物質與副甲狀腺檢查", "發炎與感染指標", "感染血清學檢查",
    "心臟相關檢查", "肌肉酵素檢查", "凝血功能檢查",
    "自體免疫與風濕免疫檢查", "免疫與特殊蛋白檢查",
    "內分泌與荷爾蒙檢查", "腫瘤指標", "胰臟功能檢查", "一般生化檢查",
]

URINE_CATEGORY_ORDER = [
    "尿液一般檢查", "尿蛋白與白蛋白", "尿沉渣", "尿液生化檢查",
    "24小時尿液檢查", "其他尿液檢查",
]

IMAGE_CATEGORY_ORDER = [
    "超音波檢查", "X 光檢查", "電腦斷層檢查", "磁振造影檢查",
    "骨質密度檢查", "內視鏡檢查", "心臟血管檢查", "其他影像檢查",
]

CATEGORY_ORDER = {
    "抽血檢查": BLOOD_CATEGORY_ORDER,
    "驗尿檢查": URINE_CATEGORY_ORDER,
    "影像檢查": IMAGE_CATEGORY_ORDER,
    "其他檢查項目": ["其他檢查項目"],
}
