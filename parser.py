import re
from dataclasses import dataclass

SPECIMEN_RE = re.compile(
    r"^\s*(?:SPECIMEN|檢體|檢體類別|檢體來源)\s*[:：]\s*(.+)$",
    re.I,
)
SPECIMEN_HEADING_RE = re.compile(
    r"^\s*\[?\s*(BLOOD|SERUM|PLASMA|URINE(?:\(SPOT\))?)\s*\]?\s*$",
    re.I,
)
IMAGE_START_RE = re.compile(
    r"(sonogram|sonography|ultrasound|x[\s-]?ray|cxr|computed tomography|\bct\b|"
    r"magnetic resonance|\bmri\b|dxa|dexa|egd|colonoscopy|echocardiography|\becho\b|\becg\b)",
    re.I,
)
RESULT_RE = re.compile(
    r"^\s*(?P<name>[^|:\t]+?)\s*(?:\||:|\t)\s*"
    r"(?P<result>\(\s*[^)]+\s*\)|[<>]=?\s*\S+|≥\s*\S+|≤\s*\S+|\S+)"
    r"(?:\s+(?P<unit>[^|]+?))?\s*(?:\|\s*(?P<reference>.*?))?"
    r"(?:\s*\|\s*(?P<flag>[HL]))?\s*$",
    re.I,
)


@dataclass
class ParsedItem:
    raw_name: str
    result: str = ""
    unit: str = ""
    reference: str = ""
    flag: str = ""
    specimen: str = ""
    raw_text: str = ""
    is_image: bool = False


def _clean_result(value):
    value = value.strip()
    bracketed = re.fullmatch(r"\(\s*(.*?)\s*\)", value)
    return bracketed.group(1) if bracketed else value


def _split_result_flag(result, flag=""):
    if flag:
        return result, flag
    match = re.fullmatch(r"(.*?)\s+([HL])", result.strip(), re.I)
    if match:
        return match.group(1).strip(), match.group(2).upper()
    return result, ""


def _parse_delimited(line, specimen):
    delimiter = "|" if "|" in line else "\t"
    parts = [part.strip() for part in line.split(delimiter)]
    if (
        delimiter == "\t"
        and len(parts) >= 4
        and (parts[1].upper() in {"H", "L"} or not parts[1])
        and re.fullmatch(r"\(\s*.*?\s*\)", parts[3])
    ):
        return ParsedItem(
            raw_name=parts[0],
            result=_clean_result(parts[2]),
            unit=parts[4] if len(parts) > 4 else "",
            reference=" ".join(part for part in parts[5:] if part),
            flag=parts[1].upper(),
            specimen=specimen,
            raw_text=line,
        )
    if (
        delimiter == "\t"
        and len(parts) >= 4
        and (parts[1].upper() in {"H", "L"} or not parts[1])
        and _clean_result(parts[2])
    ):
        return ParsedItem(
            raw_name=parts[0],
            result=_clean_result(parts[2]),
            unit=parts[3],
            reference=" ".join(part for part in parts[4:] if part),
            flag=parts[1].upper(),
            specimen=specimen,
            raw_text=line,
        )
    if (
        delimiter == "\t"
        and len(parts) >= 4
        and _clean_result(parts[1])
        and re.fullmatch(r"\(\s*.*?\s*\)", parts[2])
    ):
        return ParsedItem(
            raw_name=parts[0],
            result=_clean_result(parts[1]),
            unit=parts[3],
            reference=" ".join(part for part in parts[4:] if part),
            flag="",
            specimen=specimen,
            raw_text=line,
        )
    if len(parts) >= 2:
        name, result = parts[0], _clean_result(parts[1])
        unit = parts[2] if len(parts) > 2 else ""
        reference = parts[3] if len(parts) > 3 else ""
        flag = parts[4].upper() if len(parts) > 4 and parts[4].upper() in {"H", "L"} else ""
        result, flag = _split_result_flag(result, flag)
        return ParsedItem(name, result, unit, reference, flag, specimen, line)
    return None


def _parse_colon(line, specimen):
    separator = "：" if "：" in line else ":"
    name, remainder = (part.strip() for part in line.split(separator, 1))
    if not name or not remainder:
        return None
    parts = [part.strip() for part in remainder.split("|")]
    value_part = parts[0]
    reference = parts[1] if len(parts) > 1 else ""
    explicit_flag = parts[2].upper() if len(parts) > 2 and parts[2].upper() in {"H", "L"} else ""

    bracketed = re.match(r"^\(\s*([^)]+?)\s*\)(?:\s+(.*))?$", value_part)
    if bracketed:
        result = bracketed.group(1).strip()
        unit = (bracketed.group(2) or "").strip()
    else:
        tokens = value_part.split(maxsplit=1)
        result = tokens[0] if tokens else ""
        unit = tokens[1] if len(tokens) > 1 else ""

    result, flag = _split_result_flag(result, explicit_flag)
    if not flag and unit.upper() in {"H", "L"}:
        flag, unit = unit.upper(), ""
    elif not flag:
        unit_match = re.fullmatch(r"(.*?)\s+([HL])", unit, re.I)
        if unit_match:
            unit, flag = unit_match.group(1).strip(), unit_match.group(2).upper()
    return ParsedItem(name, result, unit, reference, flag, specimen, line)


def _parse_whitespace(line, specimen):
    match = re.match(
        r"^\s*(?P<name>.+?)\s{2,}(?P<result>\(\s*[^)]+\s*\)|\S+)"
        r"(?:\s{2,}(?P<unit>\S.*?))?(?:\s{2,}(?P<reference>\S.*?))?"
        r"(?:\s{2,}(?P<flag>[HL]))?\s*$",
        line,
        re.I,
    )
    if not match:
        return None
    data = match.groupdict(default="")
    result, flag = _split_result_flag(_clean_result(data["result"]), data["flag"].upper())
    return ParsedItem(data["name"], result, data["unit"], data["reference"], flag, specimen, line)


def parse_text(text):
    items = []
    specimen = ""
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    index = 0
    awaiting_specimen = False

    while index < len(lines):
        line = lines[index].strip()
        if not line:
            index += 1
            continue

        if re.match(r"^(?:檢體|檢體類別|檢體來源)\s*[:：]\s*$", line, re.I):
            awaiting_specimen = True
            index += 1
            continue

        bilingual_specimen = re.match(
            r"^\(\s*Specimen\s*type\s*\)\s*(?:\t+|\s{2,})(.+)$",
            line,
            re.I,
        )
        if bilingual_specimen:
            specimen = bilingual_specimen.group(1).strip()
            awaiting_specimen = False
            index += 1
            continue

        if awaiting_specimen:
            specimen = re.sub(
                r"^\(\s*Specimen\s*type\s*\)\s*",
                "",
                line,
                flags=re.I,
            ).strip()
            awaiting_specimen = False
            index += 1
            continue

        if (
            re.match(r"^醫囑名稱\s*[:：]\s*$", line, re.I)
            or re.match(r"^\(\s*Medical\s*order\s*\)", line, re.I)
            or re.match(r"^(?:項目|Item)\s*(?:\t|\|)", line, re.I)
            or re.match(r"^DC\s*[:：]\s*%?\s*(?:\t.*)?$", line, re.I)
        ):
            index += 1
            continue

        specimen_match = SPECIMEN_RE.match(line)
        if specimen_match:
            specimen = specimen_match.group(1).strip()
            index += 1
            continue

        specimen_heading = SPECIMEN_HEADING_RE.match(line)
        if specimen_heading:
            specimen = specimen_heading.group(1).strip()
            index += 1
            continue

        if IMAGE_START_RE.search(line):
            block = [line]
            index += 1
            while index < len(lines):
                next_line = lines[index].rstrip()
                if SPECIMEN_RE.match(next_line) or IMAGE_START_RE.search(next_line):
                    break
                if next_line.strip():
                    block.append(next_line)
                index += 1
            name = block[0].split("|", 1)[0].split(":", 1)[0].strip()
            items.append(ParsedItem(name, raw_text="\n".join(block), specimen=specimen, is_image=True))
            continue

        colon_positions = [position for position in (line.find(":"), line.find("：")) if position >= 0]
        first_colon = min(colon_positions) if colon_positions else -1
        first_pipe = line.find("|")
        if "\t" in line:
            parsed = _parse_delimited(line, specimen)
        elif first_colon >= 0 and (first_pipe < 0 or first_colon < first_pipe):
            parsed = _parse_colon(line, specimen)
        elif "|" in line:
            parsed = _parse_delimited(line, specimen)
        else:
            parsed = _parse_whitespace(line, specimen)
        if parsed:
            items.append(parsed)
        else:
            # Preserve unparsed content instead of stopping.
            items.append(ParsedItem(line, raw_text=line, specimen=specimen))
        index += 1

    return items


def _parse_text_with_single_orders(text):
    items = []
    specimen = ""
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    index = 0
    awaiting_specimen = False
    pending_order = ""
    single_result_mode = False
    last_single_item = None

    while index < len(lines):
        raw_line = lines[index].rstrip()
        line = raw_line.strip()
        if not line:
            index += 1
            continue

        if re.match(r"^(?:檢體|Specimen)\s*[:：]?\s*$", line, re.I):
            awaiting_specimen = True
            pending_order = ""
            single_result_mode = False
            last_single_item = None
            index += 1
            continue

        bilingual_specimen = re.match(
            r"^\(\s*Specimen\s*type\s*\)\s*(?:\t+|\s{2,})(.+)$",
            line,
            re.I,
        )
        if bilingual_specimen:
            specimen = bilingual_specimen.group(1).strip()
            awaiting_specimen = False
            pending_order = ""
            single_result_mode = False
            last_single_item = None
            index += 1
            continue

        if awaiting_specimen:
            specimen = re.sub(
                r"^\(\s*Specimen\s*type\s*\)\s*",
                "",
                line,
                flags=re.I,
            ).strip()
            awaiting_specimen = False
            index += 1
            continue

        medical_order = re.match(
            r"^\(\s*Medical\s*order\s*\)\s*(?:\t+|\s{2,})(.+)$",
            line,
            re.I,
        )
        if medical_order:
            pending_order = medical_order.group(1).strip().rstrip(",")
            single_result_mode = False
            last_single_item = None
            index += 1
            continue

        if re.match(r"^H/L(?:\s|\t|$)", line, re.I):
            single_result_mode = bool(pending_order)
            index += 1
            continue

        if re.match(r"^參考值\s*[:：]?\s*$", line, re.I):
            next_index = index + 1
            while next_index < len(lines) and not lines[next_index].strip():
                next_index += 1
            if last_single_item is not None and next_index < len(lines):
                last_single_item.reference = lines[next_index].strip()
                last_single_item.raw_text = (
                    f"{last_single_item.raw_text}\n參考值:\n{last_single_item.reference}"
                )
                index = next_index + 1
            else:
                index += 1
            continue

        if single_result_mode and pending_order:
            parts = [part.strip() for part in raw_line.split("\t")]
            if len(parts) >= 3:
                flag = parts[0].upper() if parts[0].upper() in {"H", "L"} else ""
                result = _clean_result(parts[1])
                unit_index = (
                    3
                    if len(parts) > 3 and re.fullmatch(r"\(\s*.*?\s*\)", parts[2])
                    else 2
                )
                unit = parts[unit_index] if len(parts) > unit_index else ""
                reference = " ".join(part for part in parts[unit_index + 1:] if part)
                if result:
                    parsed = ParsedItem(
                        raw_name=pending_order,
                        result=result,
                        unit=unit,
                        reference=reference,
                        flag=flag,
                        specimen=specimen,
                        raw_text=line,
                    )
                    items.append(parsed)
                    last_single_item = parsed
                    pending_order = ""
                    single_result_mode = False
                    index += 1
                    continue

        if (
            re.match(r"^醫囑名稱\s*[:：]?\s*$", line, re.I)
            or re.match(r"^\(\s*Medical\s*order\s*\)", line, re.I)
            or re.match(r"^(?:項目|Item)\s*(?:\t|\|)", line, re.I)
            or re.match(r"^DC\s*[:：]?\s*%?\s*(?:\t.*)?$", line, re.I)
            or re.match(r"^儀器/方法\s*[:：]", line, re.I)
        ):
            index += 1
            continue

        specimen_match = re.match(
            r"^\s*(?:SPECIMEN|檢體)\s*[:：]\s*(.+)$",
            line,
            re.I,
        )
        specimen_heading = SPECIMEN_HEADING_RE.match(line)
        if specimen_match or specimen_heading:
            specimen = (
                specimen_match.group(1)
                if specimen_match
                else specimen_heading.group(1)
            ).strip()
            pending_order = ""
            single_result_mode = False
            last_single_item = None
            index += 1
            continue

        if IMAGE_START_RE.search(line):
            block = [line]
            index += 1
            while index < len(lines):
                next_line = lines[index].rstrip()
                if re.match(r"^\s*(?:SPECIMEN|檢體)\s*[:：]", next_line, re.I) or IMAGE_START_RE.search(next_line):
                    break
                if next_line.strip():
                    block.append(next_line)
                index += 1
            name = block[0].split("|", 1)[0].split(":", 1)[0].strip()
            items.append(ParsedItem(name, raw_text="\n".join(block), specimen=specimen, is_image=True))
            continue

        colon_positions = [
            position for position in (line.find(":"), line.find("："))
            if position >= 0
        ]
        first_colon = min(colon_positions) if colon_positions else -1
        first_pipe = line.find("|")
        if "\t" in line:
            parsed = _parse_delimited(line, specimen)
        elif first_colon >= 0 and (first_pipe < 0 or first_colon < first_pipe):
            parsed = _parse_colon(line, specimen)
        elif "|" in line:
            parsed = _parse_delimited(line, specimen)
        else:
            parsed = _parse_whitespace(line, specimen)
        if parsed:
            items.append(parsed)
        else:
            items.append(ParsedItem(line, raw_text=line, specimen=specimen))
        index += 1

    return items


parse_text = _parse_text_with_single_orders


def read_and_parse(path):
    for encoding in ("utf-8-sig", "utf-8", "cp950"):
        try:
            return parse_text(path.read_text(encoding=encoding))
        except UnicodeDecodeError:
            continue
    return parse_text(path.read_text(encoding="utf-8", errors="replace"))
