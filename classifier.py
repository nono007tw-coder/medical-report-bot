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
        return "抽血檢查", "其他抽血檢查"
    return "其他檢查項目", "其他檢查項目"


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
