from collections import defaultdict

from config import CATEGORY_ORDER, SECTION_ORDER
from mapping import lookup_item, normalize_name


def _unknown_location(item):
    specimen = item.specimen.upper()
    name = item.raw_name.upper()
    combined = f"{specimen} {name}"
    if item.is_image or any(token in combined for token in (
        "SONOGRAM", "SONOGRAPHY", "ULTRASOUND", "X-RAY", "CXR", " CT", "MRI",
        "DXA", "DEXA", "EGD", "COLONOSCOPY", "ECHO", "ECG",
    )):
        return "影像檢查", "其他影像檢查"
    if "URINE" in combined or "尿" in combined:
        return "驗尿檢查", "其他尿液檢查"
    if any(token in combined for token in ("BLOOD", "SERUM", "PLASMA", "血")):
        return "抽血檢查", _unknown_blood_category(item.raw_name)
    return "其他檢查項目", "其他檢查項目"


def _unknown_blood_category(raw_name):
    name = normalize_name(raw_name)
    rules = (
        (("wbc", "rbc", "hb", "hgb", "hct", "mcv", "mch", "mchc", "rdw", "mpv", "plt", "anc", "band", "neu", "lym", "mono", "eos", "baso", "retic"), "血液常規檢查"),
        (("pt", "inr", "aptt", "fibrinogen", "fib", "ddimer"), "凝血功能檢查"),
        (("ast", "got", "alt", "gpt", "alp", "ggt", "bil", "tbil", "dbil", "ibil", "alb", "tp", "ldh"), "肝膽功能檢查"),
        (("bun", "creat", "crea", "egfr", "gfr", "uricacid", "cystatin"), "腎功能檢查"),
        (("na", "cl", "ca", "mg", "hco3", "co2", "aniongap"), "電解質與酸鹼檢查"),
        (("glu", "glucose", "sugar", "hba1c", "a1c", "fructosamine"), "血糖與糖尿病相關檢查"),
        (("chol", "tchol", "tg", "hdl", "ldl"), "血脂檢查"),
        (("iron", "tibc", "ferritin", "tsat", "transferrin", "b12", "folate"), "鐵質與貧血相關檢查"),
        (("tsh", "ft4", "freet4", "ft3", "freet3"), "甲狀腺功能檢查"),
        (("crp", "esr", "pct", "il6"), "發炎與感染指標"),
        (("troponin", "tni", "ckmb", "bnp", "ntprobnp"), "心臟相關檢查"),
        (("ck", "cpk", "myoglobin"), "肌肉酵素檢查"),
        (("afp", "cea", "ca125", "ca153", "ca199", "psa"), "腫瘤指標"),
        (("amylase", "lipase"), "胰臟功能檢查"),
    )
    for prefixes, category in rules:
        if name.startswith(prefixes):
            return category
    return "一般生化檢查"


def classify_items(items):
    grouped = defaultdict(lambda: defaultdict(list))
    seen = set()

    for position, item in enumerate(items):
        if (
            not item.is_image
            and not item.result.strip()
            and not item.unit.strip()
            and not item.reference.strip()
        ):
            continue

        canonical, mapped = lookup_item(item.raw_name)
        dedupe_key = canonical or normalize_name(item.raw_name)
        if not dedupe_key:
            dedupe_key = f"unknown-{position}"
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)

        if mapped:
            row = {
                "key": canonical,
                "zh": mapped["zh"],
                "en": mapped["en"],
                "result": item.result,
                "unit": item.unit,
                "reference": item.reference,
                "flag": item.flag,
                "raw_text": item.raw_text,
                "is_image": item.is_image or mapped["section"] == "影像檢查",
                "order": mapped["order"],
            }
            grouped[mapped["section"]][mapped["category"]].append(row)
        else:
            section, category = _unknown_location(item)
            row = {
                "key": item.raw_name,
                "zh": item.raw_name,
                "en": "",
                "result": item.result,
                "unit": item.unit,
                "reference": item.reference,
                "flag": item.flag,
                "raw_text": item.raw_text,
                "is_image": item.is_image or section == "影像檢查",
                "order": 99999 + position,
            }
            grouped[section][category].append(row)

    ordered = {}
    for section in SECTION_ORDER:
        if section not in grouped:
            continue
        ordered[section] = {}
        for category in CATEGORY_ORDER[section]:
            rows = grouped[section].get(category, [])
            if rows:
                ordered[section][category] = sorted(rows, key=lambda row: row["order"])
    return ordered
