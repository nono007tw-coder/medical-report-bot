import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import mapping from "./mapping.json";
import "./styles.css";

const DAILY_KIDNEY_THEMES = [
  {
    label: "Sunday Glomerular Calm",
    title: "週日 · 腎絲球靜謐藍",
    summary: "以腎絲球過濾為靈感，讓報告閱讀節奏更沉穩。",
    accent: "#7c8fe8",
    accentDark: "#4657a8",
    navy: "#111a3d",
    navySoft: "#23305d",
    mist: "#eef1ff",
    glowRgb: "124, 143, 232",
  },
  {
    label: "Monday Renal Clarity",
    title: "週一 · 腎功能清晰藍",
    summary: "聚焦 eGFR、肌酸酐與趨勢判讀，開週保持清楚。",
    accent: "#2fa7d6",
    accentDark: "#17769b",
    navy: "#082437",
    navySoft: "#123d56",
    mist: "#e7f5fb",
    glowRgb: "47, 167, 214",
  },
  {
    label: "Tuesday Electrolyte Balance",
    title: "週二 · 電解質平衡綠",
    summary: "以鈉鉀鈣磷的平衡感，呈現穩定而乾淨的介面。",
    accent: "#2dbb8f",
    accentDark: "#168167",
    navy: "#0b2f2d",
    navySoft: "#164840",
    mist: "#e8f8f2",
    glowRgb: "45, 187, 143",
  },
  {
    label: "Wednesday Proteinuria Focus",
    title: "週三 · 蛋白尿焦點紫",
    summary: "強調 Pro/Cr、ACR 等腎臟風險指標，畫面更有辨識度。",
    accent: "#9b72d9",
    accentDark: "#6542a3",
    navy: "#22183f",
    navySoft: "#3a2b63",
    mist: "#f2ebfb",
    glowRgb: "155, 114, 217",
  },
  {
    label: "Thursday Dialysis Precision",
    title: "週四 · 透析精準青",
    summary: "以透析照護的精準與規律，保持輸出流程明確。",
    accent: "#20b9c8",
    accentDark: "#0e7e8a",
    navy: "#082c35",
    navySoft: "#124854",
    mist: "#e5f8fa",
    glowRgb: "32, 185, 200",
  },
  {
    label: "Friday Mineral Bone",
    title: "週五 · 礦物骨病暖金",
    summary: "以鈣磷副甲狀腺軸線為主題，讓介面帶一點溫度。",
    accent: "#d39b31",
    accentDark: "#966719",
    navy: "#2c2412",
    navySoft: "#4b3b1d",
    mist: "#fbf3df",
    glowRgb: "211, 155, 49",
  },
  {
    label: "Saturday Transplant Hope",
    title: "週六 · 移植希望墨綠",
    summary: "用柔和墨綠呈現長期追蹤、穩定照護與希望感。",
    accent: "#4ca66a",
    accentDark: "#2d7446",
    navy: "#10291e",
    navySoft: "#1e4631",
    mist: "#eaf6ee",
    glowRgb: "76, 166, 106",
  },
];

function applyDailyKidneyTheme() {
  const theme = DAILY_KIDNEY_THEMES[new Date().getDay()];
  const root = document.documentElement;
  root.style.setProperty("--navy", theme.navy);
  root.style.setProperty("--navy-soft", theme.navySoft);
  root.style.setProperty("--teal", theme.accent);
  root.style.setProperty("--teal-dark", theme.accentDark);
  root.style.setProperty("--mist", theme.mist);
  root.style.setProperty("--theme-glow-rgb", theme.glowRgb);

  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.navy);
  const navBadge = document.querySelector(".nav-badge");
  if (navBadge?.lastChild) navBadge.lastChild.textContent = ` ${theme.title}`;
  const eyebrow = document.querySelector(".eyebrow");
  if (eyebrow) eyebrow.lastChild.textContent = ` ${theme.label}`;
  const privacyLabel = document.querySelector(".privacy-label");
  if (privacyLabel) privacyLabel.textContent = "Kidney theme of the day";
  const privacyLine = document.querySelector(".privacy-line");
  if (privacyLine) {
    const textNode = [...privacyLine.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
    if (textNode) textNode.textContent = ` ${theme.summary}`;
  }
}

applyDailyKidneyTheme();

const SECTION_ORDER = ["抽血檢查", "驗尿檢查", "影像檢查", "其他檢查項目"];
const CATEGORY_ORDER = {
  抽血檢查: [
    "血液常規檢查", "肝膽功能檢查", "腎功能檢查", "腎臟特殊檢查",
    "電解質與酸鹼檢查", "血糖與糖尿病相關檢查", "血脂檢查",
    "鐵質與貧血相關檢查", "維生素與營養檢查", "甲狀腺功能檢查",
    "骨礦物質與副甲狀腺檢查", "發炎與感染指標", "感染血清學檢查",
    "心臟相關檢查", "肌肉酵素檢查", "凝血功能檢查",
    "自體免疫與風濕免疫檢查", "免疫與特殊蛋白檢查",
    "內分泌與荷爾蒙檢查", "腫瘤指標", "胰臟功能檢查", "一般生化檢查",
  ],
  驗尿檢查: [
    "尿液一般檢查", "尿蛋白與白蛋白", "尿沉渣", "尿液生化檢查",
    "24小時尿液檢查", "其他尿液檢查",
  ],
  影像檢查: [
    "超音波檢查", "X 光檢查", "電腦斷層檢查", "磁振造影檢查",
    "骨質密度檢查", "內視鏡檢查", "心臟血管檢查", "其他影像檢查",
  ],
  其他檢查項目: ["其他檢查項目"],
};
const REPORT_GROUP_ORDER = ["1. 血液檢查", "2. 生化檢查", "3. 尿液檢查", "4. 影像檢查"];
const HEMATOLOGY_CATEGORIES = new Set(["血液常規檢查", "凝血功能檢查"]);
const REPORT_CATEGORY_ORDER = {
  "1. 血液檢查": ["血液常規檢查", "凝血功能檢查", "其他血液檢查"],
  "2. 生化檢查": [
    ...CATEGORY_ORDER.抽血檢查.filter((category) => !HEMATOLOGY_CATEGORIES.has(category)),
  ],
  "3. 尿液檢查": CATEGORY_ORDER.驗尿檢查,
  "4. 影像檢查": CATEGORY_ORDER.影像檢查,
};
const EXCLUDED_REPORT_CATEGORIES = new Set(["一般生化檢查", "尿液一般檢查", "其他尿液檢查"]);
const PATIENT_CATEGORY_LABELS = {
  血液常規檢查: "血球與貧血",
  凝血功能檢查: "凝血功能",
  其他血液檢查: "其他血液項目",
  肝膽功能檢查: "肝膽功能",
  腎功能檢查: "腎臟功能",
  腎臟特殊檢查: "腎臟特殊檢查",
  電解質與酸鹼檢查: "電解質與酸鹼",
  血糖與糖尿病相關檢查: "血糖與糖尿病",
  血脂檢查: "血脂",
  鐵質與貧血相關檢查: "鐵質與貧血",
  維生素與營養檢查: "維生素與營養",
  甲狀腺功能檢查: "甲狀腺功能",
  骨礦物質與副甲狀腺檢查: "骨骼礦物質與副甲狀腺",
  發炎與感染指標: "發炎與感染",
  感染血清學檢查: "感染血清檢查",
  心臟相關檢查: "心臟相關指標",
  肌肉酵素檢查: "肌肉酵素",
  自體免疫與風濕免疫檢查: "自體免疫與風濕",
  免疫與特殊蛋白檢查: "免疫與特殊蛋白",
  內分泌與荷爾蒙檢查: "內分泌與荷爾蒙",
  腫瘤指標: "腫瘤指標",
  胰臟功能檢查: "胰臟功能",
  一般生化檢查: "一般生化",
  尿液一般檢查: "尿液一般檢查",
  尿蛋白與白蛋白: "尿蛋白與白蛋白",
  尿沉渣: "尿液顯微鏡檢查",
  尿液生化檢查: "尿液生化",
  "24小時尿液檢查": "24 小時尿液",
  其他尿液檢查: "其他尿液項目",
  超音波檢查: "超音波",
  "X 光檢查": "X 光",
  電腦斷層檢查: "電腦斷層",
  磁振造影檢查: "磁振造影",
  骨質密度檢查: "骨質密度",
  內視鏡檢查: "內視鏡",
  心臟血管檢查: "心臟與血管",
  其他影像檢查: "其他影像",
};

const SAMPLE = `SPECIMEN: BLOOD
WBC | 7.51 | 10^3/uL | 4.0-10.0 |
Hb | 10.2 | g/dL | 12.0-16.0 | L
CREAT. | 2.10 | mg/dL | 0.5-1.1 | H
eGFR | 25 | mL/min/1.73m2 | >=60 | L

SPECIMEN: URINE(SPOT)
ACRatio | 60 | mg/g | <30 | H
PCRatio | 0.25 | g/g | <0.15 | H

Abdominal Sonography
Finding: Liver is normal in size.
Impression: Mild fatty liver.`;

const HOSPITAL_SAMPLE = `檢體　　：
(Specimen type)	Blood
醫囑名稱：
(Medical order)	NA,K,Ca,P,Crea,BUN,CRP,ALT,Bil-T,Alb,
項目	H/L	結果	前次結果	單位	參考值
BUN	 H  	 34  	(  )	 mg/dL 	 6~20 mg/dL
Na	 L  	 133  	(  )	 mmol/L 	 136~145 mmol/L
K	    	 4.3 	(  )	 mmol/L 	 3.5~5.1 mmol/L
Creat	 H  	 6.34 	(  )	 mg/dL 	 M:0.7~1.2; F:0.5-0.9 mg/dL
ALT	    	 15 	(  )	 U/L 	 M:<41; F:<33 U/L`;

const aliasIndex = new Map();
for (const [canonical, item] of Object.entries(mapping)) {
  for (const alias of [canonical, ...item.aliases]) aliasIndex.set(normalize(alias), canonical);
}

const URINE_CONTEXT_ALIASES = new Map([
  ["cr", "Urine Creatinine"],
  ["crea", "Urine Creatinine"],
  ["creat", "Urine Creatinine"],
  ["creatinine", "Urine Creatinine"],
]);

const URINE_RATIO_NAMES = new Set([
  "acr",
  "acratio",
  "malbucre",
  "microalbumincreatinine",
  "microalbuminucre",
  "pcr",
  "pcratio",
  "procr",
  "proteincr",
  "proteincreatinine",
  "upcr",
]);

const URINE_COMPONENT_NAMES = new Set([
  "crea",
  "creat",
  "creatinine",
  "cr",
  "glu",
  "glucose",
  "medicalorder",
  "protein",
  "result",
  "total",
  "結果",
  "總量",
]);

const URINE_COMPONENT_CANONICALS = new Set([
  "Urine Albumin",
  "Urine Creatinine",
  "Urine Glucose",
  "Urine Protein",
  "Urine Protein Dipstick",
]);

const REFERENCE_FRAGMENT_PATTERN = /^(?:[<>]=?)?\d+(?:\.\d+)?(?:\s*[~-]\s*\d+(?:\.\d+)?)?$/;

function normalize(value) {
  return [...value.trim().toLowerCase()].filter((char) => /[\p{L}\p{N}]/u.test(char)).join("");
}

function specimenKind(specimen = "") {
  const value = specimen.toUpperCase();
  if (value.includes("URINE") || value.includes("尿")) return "urine";
  if (/(BLOOD|SERUM|PLASMA|血)/.test(value)) return "blood";
  return "unknown";
}

function lookupCanonical(rawName, specimen = "") {
  const normalized = normalize(rawName);
  if (specimenKind(specimen) === "urine" && URINE_CONTEXT_ALIASES.has(normalized)) {
    return URINE_CONTEXT_ALIASES.get(normalized);
  }
  return aliasIndex.get(normalized);
}

function dedupeKeyFor(source, canonical, position) {
  return `${specimenKind(source.specimen)}:${canonical || normalize(source.rawName) || `unknown-${position}`}`;
}

function hasUrineRatio(items) {
  return items.some((item) => URINE_RATIO_NAMES.has(normalize(item.rawName)));
}

function shouldSkipUrineComponent(source, canonical, urineRatioPresent) {
  const specimen = specimenKind(source.specimen);
  const normalized = normalize(source.rawName);
  if (!urineRatioPresent || !["urine", "unknown"].includes(specimen)) return false;
  if (URINE_COMPONENT_CANONICALS.has(canonical) && specimen === "urine") return true;
  if (URINE_COMPONENT_NAMES.has(normalized)) return true;
  return REFERENCE_FRAGMENT_PATTERN.test(source.rawName.trim());
}

function cleanResult(value) {
  const match = value.trim().match(/^\(\s*(.*?)\s*\)$/);
  return match ? match[1] : value.trim();
}

function splitFlag(value, flag = "") {
  if (flag) return [value, flag];
  const match = value.trim().match(/^(.*?)\s+([HL])$/i);
  return match ? [match[1].trim(), match[2].toUpperCase()] : [value, ""];
}

function parseTextLegacy(text) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const items = [];
  let specimen = "";
  let awaitingSpecimen = false;

  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    if (/^(?:檢體|檢體類別|檢體來源)\s*[:：]\s*$/i.test(line)) {
      awaitingSpecimen = true;
      index += 1;
      continue;
    }

    const bilingualSpecimen = line.match(/^\(\s*Specimen\s*type\s*\)\s*(?:\t+|\s{2,})(.+)$/i);
    if (bilingualSpecimen) {
      specimen = bilingualSpecimen[1].trim();
      awaitingSpecimen = false;
      index += 1;
      continue;
    }

    if (awaitingSpecimen && line) {
      specimen = line.replace(/^\(\s*Specimen\s*type\s*\)\s*/i, "").trim();
      awaitingSpecimen = false;
      index += 1;
      continue;
    }

    if (
      /^(?:醫囑名稱)\s*[:：]\s*$/i.test(line) ||
      /^\(\s*Medical\s*order\s*\)/i.test(line) ||
      /^(?:項目|Item)\s*(?:\t|\|)/i.test(line) ||
      /^DC\s*[:：]\s*%?\s*(?:\t.*)?$/i.test(line)
    ) {
      index += 1;
      continue;
    }

    const specimenMatch = line.match(/^(?:SPECIMEN|檢體|檢體類別|檢體來源)\s*[:：]\s*(.+)$/i);
    const specimenHeading = line.match(/^\[?\s*(BLOOD|SERUM|PLASMA|URINE(?:\(SPOT\))?)\s*\]?$/i);
    if (specimenMatch || specimenHeading) {
      specimen = (specimenMatch?.[1] || specimenHeading[1]).trim();
      index += 1;
      continue;
    }

    if (isImageHeading(line)) {
      const block = [line];
      index += 1;
      while (index < lines.length) {
        const next = lines[index].trimEnd();
        if (
          /^(?:SPECIMEN|檢體|檢體類別|檢體來源)\s*[:：]/i.test(next) ||
          isImageHeading(next.trim())
        ) break;
        if (next.trim()) block.push(next);
        index += 1;
      }
      items.push({
        rawName: line.split(/[|:：]/, 1)[0].trim(),
        result: "", unit: "", reference: "", flag: "", specimen,
        rawText: block.join("\n"), isImage: true,
      });
      continue;
    }

    const item = parseResultLine(line, specimen);
    items.push(item || {
      rawName: line, result: "", unit: "", reference: "", flag: "",
      specimen, rawText: line, isImage: false,
    });
    index += 1;
  }
  return items;
}

function parseText(text) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const items = [];
  let specimen = "";
  let awaitingSpecimen = false;
  let pendingOrder = "";
  let singleResultMode = false;
  let lastSingleItem = null;

  for (let index = 0; index < lines.length;) {
    const rawLine = lines[index].trimEnd();
    const line = rawLine.trim();
    if (!line) {
      index += 1;
      continue;
    }

    if (/^(?:檢體|Specimen)\s*[:：]?\s*$/i.test(line)) {
      awaitingSpecimen = true;
      pendingOrder = "";
      singleResultMode = false;
      lastSingleItem = null;
      index += 1;
      continue;
    }

    const bilingualSpecimen = line.match(/^\(\s*Specimen\s*type\s*\)\s*(?:\t+|\s{2,})(.+)$/i);
    if (bilingualSpecimen) {
      specimen = bilingualSpecimen[1].trim();
      awaitingSpecimen = false;
      pendingOrder = "";
      singleResultMode = false;
      lastSingleItem = null;
      index += 1;
      continue;
    }

    if (awaitingSpecimen) {
      specimen = line.replace(/^\(\s*Specimen\s*type\s*\)\s*/i, "").trim();
      awaitingSpecimen = false;
      index += 1;
      continue;
    }

    const medicalOrder = line.match(/^\(\s*Medical\s*order\s*\)\s*(?:\t+|\s{2,})(.+)$/i);
    if (medicalOrder) {
      pendingOrder = medicalOrder[1].trim().replace(/,+$/, "");
      singleResultMode = false;
      lastSingleItem = null;
      index += 1;
      continue;
    }

    if (/^H\/L(?:\s|\t|$)/i.test(line)) {
      singleResultMode = Boolean(pendingOrder);
      index += 1;
      continue;
    }

    if (/^參考值\s*[:：]?\s*$/i.test(line)) {
      let nextIndex = index + 1;
      while (nextIndex < lines.length && !lines[nextIndex].trim()) nextIndex += 1;
      if (lastSingleItem && nextIndex < lines.length) {
        lastSingleItem.reference = lines[nextIndex].trim();
        lastSingleItem.rawText = `${lastSingleItem.rawText}\n參考值:\n${lastSingleItem.reference}`;
        index = nextIndex + 1;
      } else {
        index += 1;
      }
      continue;
    }

    if (singleResultMode && pendingOrder) {
      const parts = rawLine.split("\t").map((part) => part.trim());
      if (parts.length >= 3) {
        const flag = ["H", "L"].includes(parts[0].toUpperCase()) ? parts[0].toUpperCase() : "";
        const result = cleanResult(parts[1]);
        const unitIndex = parts.length > 3 && /^\(\s*.*?\s*\)$/.test(parts[2]) ? 3 : 2;
        const unit = parts[unitIndex] || "";
        const reference = parts.slice(unitIndex + 1).filter(Boolean).join(" ");
        if (result) {
          const parsed = item(pendingOrder, result, unit, reference, flag, specimen, line);
          items.push(parsed);
          lastSingleItem = parsed;
          pendingOrder = "";
          singleResultMode = false;
          index += 1;
          continue;
        }
      }
    }

    if (
      /^醫囑名稱\s*[:：]?\s*$/i.test(line) ||
      /^\(\s*Medical\s*order\s*\)/i.test(line) ||
      /^(?:項目|Item)\s*(?:\t|\|)/i.test(line) ||
      /^DC\s*[:：]?\s*%?\s*(?:\t.*)?$/i.test(line) ||
      /^儀器\/方法\s*[:：]/i.test(line)
    ) {
      index += 1;
      continue;
    }

    const specimenMatch = line.match(/^(?:SPECIMEN|檢體)\s*[:：]\s*(.+)$/i);
    const specimenHeading = line.match(/^\[?\s*(BLOOD|SERUM|PLASMA|URINE(?:\(SPOT\))?)\s*\]?$/i);
    if (specimenMatch || specimenHeading) {
      specimen = (specimenMatch?.[1] || specimenHeading[1]).trim();
      pendingOrder = "";
      singleResultMode = false;
      lastSingleItem = null;
      index += 1;
      continue;
    }

    if (isImageHeading(line)) {
      const block = [line];
      index += 1;
      while (index < lines.length) {
        const next = lines[index].trimEnd();
        if (/^(?:SPECIMEN|檢體)\s*[:：]/i.test(next) || isImageHeading(next.trim())) break;
        if (next.trim()) block.push(next);
        index += 1;
      }
      items.push({
        rawName: line.split(/[|:：]/, 1)[0].trim(),
        result: "", unit: "", reference: "", flag: "", specimen,
        rawText: block.join("\n"), isImage: true,
      });
      continue;
    }

    const parsed = parseResultLine(line, specimen);
    items.push(parsed || {
      rawName: line, result: "", unit: "", reference: "", flag: "",
      specimen, rawText: line, isImage: false,
    });
    index += 1;
  }

  return items;
}

function isImageHeading(value) {
  return /(sonogram|sonography|ultrasound|x[\s-]?ray|cxr|computed tomography|\bct\b|magnetic resonance|\bmri\b|dxa|dexa|egd|colonoscopy|echocardiography|\becho\b|\becg\b)/i.test(value);
}

function parseResultLine(line, specimen) {
  const firstPipe = line.indexOf("|");
  const colonIndexes = [line.indexOf(":"), line.indexOf("：")].filter((i) => i >= 0);
  const firstColon = colonIndexes.length ? Math.min(...colonIndexes) : -1;

  if (!line.includes("\t") && firstColon >= 0 && (firstPipe < 0 || firstColon < firstPipe)) {
    const name = line.slice(0, firstColon).trim();
    const parts = line.slice(firstColon + 1).split("|").map((part) => part.trim());
    const valueTokens = parts[0].split(/\s+/, 2);
    let [result, unit = ""] = valueTokens;
    let flag = parts[2]?.toUpperCase() || "";
    [result, flag] = splitFlag(cleanResult(result), ["H", "L"].includes(flag) ? flag : "");
    const unitFlag = unit.match(/^(.*?)(?:\s+)?([HL])$/i);
    if (!flag && unitFlag) {
      unit = unitFlag[1].trim();
      flag = unitFlag[2].toUpperCase();
    }
    return item(name, result, unit, parts[1] || "", flag, specimen, line);
  }

  if (line.includes("|") || line.includes("\t")) {
    const delimiter = line.includes("|") ? "|" : "\t";
    const parts = line.split(delimiter).map((part) => part.trim());
    if (parts.length < 2) return null;

    if (
      delimiter === "\t" &&
      parts.length >= 4 &&
      (["H", "L"].includes(parts[1].toUpperCase()) || parts[1] === "") &&
      /^\(\s*.*?\s*\)$/.test(parts[3] || "")
    ) {
      return item(
        parts[0],
        cleanResult(parts[2]),
        parts[4] || "",
        parts.slice(5).filter(Boolean).join(" "),
        parts[1].toUpperCase(),
        specimen,
        line,
      );
    }

    if (
      delimiter === "\t" &&
      parts.length >= 4 &&
      (["H", "L"].includes(parts[1].toUpperCase()) || parts[1] === "") &&
      cleanResult(parts[2])
    ) {
      return item(
        parts[0],
        cleanResult(parts[2]),
        parts[3] || "",
        parts.slice(4).filter(Boolean).join(" "),
        parts[1].toUpperCase(),
        specimen,
        line,
      );
    }

    if (
      delimiter === "\t" &&
      parts.length >= 4 &&
      cleanResult(parts[1]) &&
      /^\(\s*.*?\s*\)$/.test(parts[2])
    ) {
      return item(
        parts[0],
        cleanResult(parts[1]),
        parts[3] || "",
        parts.slice(4).filter(Boolean).join(" "),
        "",
        specimen,
        line,
      );
    }

    let result = cleanResult(parts[1]);
    let flag = ["H", "L"].includes(parts[4]?.toUpperCase()) ? parts[4].toUpperCase() : "";
    [result, flag] = splitFlag(result, flag);
    return item(parts[0], result, parts[2] || "", parts[3] || "", flag, specimen, line);
  }

  const match = line.match(/^(.+?)\s{2,}(\(\s*[^)]+\s*\)|\S+)(?:\s{2,}(\S.*?))?(?:\s{2,}(\S.*?))?(?:\s{2,}([HL]))?$/i);
  if (!match) return null;
  let [result, flag] = splitFlag(cleanResult(match[2]), (match[5] || "").toUpperCase());
  return item(match[1], result, match[3] || "", match[4] || "", flag, specimen, line);
}

function item(rawName, result, unit, reference, flag, specimen, rawText) {
  return { rawName, result, unit, reference, flag, specimen, rawText, isImage: false };
}

function classify(items) {
  const grouped = {};
  const seen = new Set();
  const urineRatioPresent = hasUrineRatio(items);

  items.forEach((source, position) => {
    if (
      !source.isImage &&
      !source.result.trim() &&
      !source.unit.trim() &&
      !source.reference.trim()
    ) return;

    const canonical = lookupCanonical(source.rawName, source.specimen);
    const mapped = canonical ? mapping[canonical] : null;
    if (shouldSkipUrineComponent(source, canonical, urineRatioPresent)) return;
    const dedupeKey = dedupeKeyFor(source, canonical, position);
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const [section, category] = mapped
      ? [mapped.section, mapped.category]
      : unknownLocation(source);
    const row = {
      key: canonical || source.rawName,
      zh: mapped?.zh || source.rawName,
      en: mapped?.en || "",
      result: source.result,
      unit: source.unit,
      reference: source.reference,
      flag: source.flag,
      rawText: source.rawText,
      isImage: source.isImage || section === "影像檢查",
      order: mapped?.order ?? 99999 + position,
    };
    grouped[section] ??= {};
    grouped[section][category] ??= [];
    grouped[section][category].push(row);
  });

  const ordered = {};
  for (const section of SECTION_ORDER) {
    if (!grouped[section]) continue;
    ordered[section] = {};
    for (const category of CATEGORY_ORDER[section]) {
      const rows = grouped[section][category];
      if (rows?.length) ordered[section][category] = rows.sort((a, b) => a.order - b.order);
    }
  }
  return ordered;
}

function unknownLocation(source) {
  const combined = `${source.specimen} ${source.rawName}`.toUpperCase();
  if (source.isImage || /(SONOGRAM|SONOGRAPHY|ULTRASOUND|X-RAY|CXR|\bCT\b|MRI|DXA|DEXA|EGD|COLONOSCOPY|ECHO|ECG)/.test(combined)) {
    return ["影像檢查", "其他影像檢查"];
  }
  if (combined.includes("URINE") || combined.includes("尿")) return ["驗尿檢查", "其他尿液檢查"];
  if (/(BLOOD|SERUM|PLASMA|血)/.test(combined)) {
    return ["抽血檢查", inferUnknownBloodCategory(source.rawName)];
  }
  return ["其他檢查項目", "其他檢查項目"];
}

function inferUnknownBloodCategory(rawName) {
  const name = normalize(rawName);
  const rules = [
    [/^(hbs|hbe|antihb|hbv|hcv|hiv|rpr|tppa|vdrl|cmv|ebv|covid|sars|influenza)/, "感染血清學檢查"],
    [/^(wbc|rbc|hb|hgb|hct|mcv|mch|mchc|rdw|rdwcv|mpv|plt|platelet|anc|band|neu|neut|lym|lymph|mono|eos|baso|retic)/, "血液常規檢查"],
    [/^(pt|inr|aptt|fibrinogen|fib|ddimer)/, "凝血功能檢查"],
    [/^(ast|got|alt|gpt|alp|ggt|bil|tbil|dbil|ibil|alb|albumin|tp|tpro|ldh)/, "肝膽功能檢查"],
    [/^(bun|creat|crea|cr|egfr|gfr|ua|uricacid|cystatin)/, "腎功能檢查"],
    [/^(na|cl|ca|mg|hco3|co2|ag|aniongap)/, "電解質與酸鹼檢查"],
    [/^(k|p|ip)$/, "電解質與酸鹼檢查"],
    [/^(glu|glucose|sugar|hba1c|a1c|fructosamine)/, "血糖與糖尿病相關檢查"],
    [/^(chol|tchol|tg|hdl|ldl)/, "血脂檢查"],
    [/^(iron|fe|tibc|ferritin|tsat|transferrin|b12|folate)/, "鐵質與貧血相關檢查"],
    [/^(tsh|ft4|freet4|ft3|freet3|thyroglobulin)/, "甲狀腺功能檢查"],
    [/^(crp|esr|pct|il6)/, "發炎與感染指標"],
    [/^(ana|anca|rf|ccp|c3|c4|igg|iga|igm|ige|immunoglobulin|complement|dsdna)/, "自體免疫與風濕免疫檢查"],
    [/^(cortisol|acth|insulin|cpeptide|prolactin|lh|fsh|estradiol|testosterone|progesterone|hcg)/, "內分泌與荷爾蒙檢查"],
    [/^(troponin|tni|ckmb|bnp|ntprobnp)/, "心臟相關檢查"],
    [/^(ck|cpk|myoglobin)/, "肌肉酵素檢查"],
    [/^(afp|cea|ca125|ca153|ca199|psa)/, "腫瘤指標"],
    [/^(amylase|lipase)/, "胰臟功能檢查"],
  ];
  return rules.find(([pattern]) => pattern.test(name))?.[1] || "一般生化檢查";
}

function inferReportGroup(section, category, source) {
  if (section === "影像檢查" || source.isImage) return "4. 影像檢查";
  if (section === "驗尿檢查") return "3. 尿液檢查";
  if (section === "抽血檢查" && HEMATOLOGY_CATEGORIES.has(category)) return "1. 血液檢查";
  if (section === "抽血檢查") return "2. 生化檢查";

  const name = normalize(source.rawName);
  if (/^(wbc|rbc|hb|hgb|hct|mcv|mch|mchc|rdwcv|mpv|plt|platelet|anc|band|neu|lym|mono|eos|baso|pt|inr|aptt|ddimer)$/.test(name)) {
    return "1. 血液檢查";
  }
  if (`${source.specimen} ${source.rawName}`.toUpperCase().includes("URINE")) return "3. 尿液檢查";
  return "2. 生化檢查";
}

function categoryForGroup(row) {
  const allowed = REPORT_CATEGORY_ORDER[row.reportGroup];
  if (allowed.includes(row.category)) return row.category;
  if (row.reportGroup === "1. 血液檢查") return "其他血液檢查";
  if (row.reportGroup === "2. 生化檢查") return "一般生化檢查";
  if (row.reportGroup === "3. 尿液檢查") return "其他尿液檢查";
  return "其他影像檢查";
}

let reviewRows = [];
let reviewedSource = "";
let previewTimer;
let exportApproved = false;

const UNIT_PATTERN = /^(?:%|‰|\/?(?:u|µ|μ)?l|10\^\d+\/(?:u|µ|μ)?l|(?:f|p|n|µ|μ|m)?g\/(?:d|m)?l|(?:m|µ|μ|n)?mol\/l|m?eq\/l|(?:m|µ|μ|n)?(?:iu|u)\/ml|(?:m|µ|μ|n)?(?:iu|u)\/l|au\/ml|bau\/ml|cu|coi|index|s\/co|copies?\/ml|copies?\/g|mg\/g|g\/g|ml\/min(?:\/1\.73m\^?2)?|fl|pg|sec|seconds?|min|hours?|ratio)$/i;
const RESULT_PATTERN = /^(?:[<>]=?\s*)?(?:-?\d+(?:\.\d+)?|positive|negative|trace|few|moderate|many|normal|reactive|nonreactive|not detected|detected)$/i;
const EMPTY_MARKER_PATTERN = /^(?:\(\s*\)|[-–—]|n\/a|na)?$/i;

function cleanField(value) {
  return String(value || "").replace(/\u00a0/g, " ").trim();
}

function looksLikeUnit(value) {
  const normalized = cleanField(value).replace(/\s+/g, "");
  return Boolean(normalized && UNIT_PATTERN.test(normalized));
}

function looksLikeReference(value) {
  const normalized = cleanField(value);
  if (!normalized) return false;
  return (
    /(?:[<>]=?|~|–|—|\bto\b)\s*-?\d/i.test(normalized) ||
    /\d\s*-\s*\d/.test(normalized) ||
    /\b(?:male|female|healthy|prediabetes|diabetes|deficiency|insufficiency|recommendation|normal|negative|nonreactive)\b/i.test(normalized)
  );
}

function looksLikeResult(value) {
  const normalized = cleanField(value);
  return Boolean(normalized && RESULT_PATTERN.test(normalized));
}

function splitResultAndUnit(value) {
  const match = cleanField(value).match(/^((?:[<>]=?\s*)?-?\d+(?:\.\d+)?)\s+(.+)$/);
  if (!match || !looksLikeUnit(match[2])) return null;
  return { result: match[1], unit: match[2] };
}

function smartAlignFields(source) {
  const aligned = {
    ...source,
    result: cleanField(source.result),
    unit: cleanField(source.unit),
    reference: cleanField(source.reference),
    flag: cleanField(source.flag).toUpperCase(),
  };
  const fixes = [];
  const issues = [];

  if (EMPTY_MARKER_PATTERN.test(aligned.result)) aligned.result = "";
  if (EMPTY_MARKER_PATTERN.test(aligned.unit)) aligned.unit = "";
  if (EMPTY_MARKER_PATTERN.test(aligned.reference)) aligned.reference = "";

  if (["H", "L"].includes(aligned.result) && looksLikeResult(aligned.unit)) {
    const shiftedReference = aligned.reference;
    aligned.flag = aligned.result;
    aligned.result = aligned.unit;
    aligned.unit = looksLikeUnit(shiftedReference) ? shiftedReference : "";
    aligned.reference = looksLikeUnit(shiftedReference) ? "" : shiftedReference;
    fixes.push("已修正 H/L 與結果欄錯位");
  }

  const combined = splitResultAndUnit(aligned.result);
  if (combined && !aligned.unit) {
    aligned.result = combined.result;
    aligned.unit = combined.unit;
    fixes.push("已拆分結果與單位");
  }
  if (!aligned.result && looksLikeResult(aligned.unit)) {
    aligned.result = aligned.unit;
    aligned.unit = "";
    fixes.push("已將數值移回結果欄");
  }
  if (!aligned.reference && looksLikeReference(aligned.unit) && !looksLikeUnit(aligned.unit)) {
    aligned.reference = aligned.unit;
    aligned.unit = "";
    fixes.push("已將範圍移回正常值欄");
  }
  if (!aligned.unit && aligned.reference && looksLikeUnit(aligned.reference)) {
    aligned.unit = aligned.reference;
    aligned.reference = "";
    fixes.push("已將單位移回單位欄");
  }
  if (aligned.result && !looksLikeResult(aligned.result) && looksLikeUnit(aligned.result)) {
    issues.push("結果欄疑似放入單位");
  } else if (aligned.result && looksLikeReference(aligned.result)) {
    issues.push("結果欄疑似放入正常值");
  }
  if (!aligned.result && (aligned.unit || aligned.reference)) issues.push("結果欄空白但後方仍有資料");
  if (aligned.unit && looksLikeReference(aligned.unit) && !looksLikeUnit(aligned.unit)) {
    issues.push("單位欄疑似放入正常值");
  }
  if (aligned.reference && looksLikeUnit(aligned.reference)) {
    issues.push("正常值欄疑似放入單位");
  }
  // Hospital systems use many assay-specific units and narrative references.
  // Preserve unfamiliar values instead of blocking an otherwise valid report.

  return { aligned, fixes, issues };
}

function assessReviewRow({ mapped, isDuplicate, hasContent, fixes, issues }) {
  const notices = [...fixes];
  const critical = [...issues];
  if (!mapped) notices.push("未識別項目");
  if (!hasContent) critical.push("沒有可輸出的結果");
  if (isDuplicate) notices.push("重複項目");
  const confidence = critical.length
    ? "needs-review"
    : isDuplicate || !mapped
      ? "notice"
      : fixes.length
        ? "corrected"
        : "ready";
  return {
    confidence,
    warning: notices.length > 0 || critical.length > 0,
    warningText: critical[0] || notices.join("、") || "可使用",
    included: hasContent && !isDuplicate && critical.length === 0,
  };
}

function refreshRowAssessment(row) {
  const { aligned, fixes, issues } = smartAlignFields(row);
  row.result = aligned.result;
  row.unit = aligned.unit;
  row.reference = aligned.reference;
  row.flag = aligned.flag;
  const hasContent = Boolean(row.isImage || row.result || row.unit || row.reference);
  Object.assign(row, assessReviewRow({
    mapped: row._mapped,
    isDuplicate: row._duplicate,
    hasContent,
    fixes,
    issues,
  }));
}

function buildReviewRows(items) {
  const seen = new Set();
  const urineRatioPresent = hasUrineRatio(items);
  return items.map((source, position) => {
    const { aligned, fixes, issues } = smartAlignFields(source);
    const canonical = lookupCanonical(aligned.rawName, aligned.specimen);
    const mapped = canonical ? mapping[canonical] : null;
    if (shouldSkipUrineComponent(aligned, canonical, urineRatioPresent)) return null;
    const [section, category] = mapped
      ? [mapped.section, mapped.category]
      : unknownLocation(aligned);
    const reportGroup = inferReportGroup(section, category, aligned);
    const outputCategory = categoryForGroup({ reportGroup, category });
    if (EXCLUDED_REPORT_CATEGORIES.has(outputCategory)) return null;
    const dedupeKey = dedupeKeyFor(aligned, canonical, position);
    const isDuplicate = seen.has(dedupeKey);
    const hasContent = Boolean(
      aligned.isImage ||
      aligned.result ||
      aligned.unit ||
      aligned.reference,
    );
    if (!isDuplicate && hasContent && issues.length === 0) seen.add(dedupeKey);
    if (mapped && !hasContent) return null;
    const warnings = [];
    if (!mapped) warnings.push("未辨識項目");
    if (!hasContent) warnings.push("沒有結果");
    if (isDuplicate) warnings.push("重複項目");

    const assessment = assessReviewRow({
      mapped, isDuplicate, hasContent, fixes, issues,
    });

    return {
      id: position,
      included: hasContent && !isDuplicate,
      warning: warnings.length > 0,
      warningText: warnings.join("、"),
      key: canonical || aligned.rawName,
      zh: mapped?.zh || aligned.rawName,
      en: mapped?.en || aligned.rawName,
      result: aligned.result,
      unit: aligned.unit,
      reference: aligned.reference,
      flag: aligned.flag,
      rawText: aligned.rawText,
      isImage: source.isImage || section === "影像檢查",
      section,
      category,
      reportGroup,
      ...assessment,
      _mapped: Boolean(mapped),
      _duplicate: isDuplicate,
      order: mapped?.order ?? 99999 + position,
    };
  }).filter(Boolean);
}

function groupReviewRows(rows) {
  const grouped = {};
  for (const row of rows.filter((entry) => entry.included && !isExcludedReportRow(entry))) {
    const category = categoryForGroup(row);
    grouped[row.reportGroup] ??= {};
    grouped[row.reportGroup][category] ??= [];
    grouped[row.reportGroup][category].push({ ...row, category });
  }

  const ordered = {};
  for (const reportGroup of REPORT_GROUP_ORDER) {
    if (!grouped[reportGroup]) continue;
    ordered[reportGroup] = {};
    for (const category of REPORT_CATEGORY_ORDER[reportGroup]) {
      const rowsInCategory = grouped[reportGroup][category];
      if (rowsInCategory?.length) {
        ordered[reportGroup][category] = rowsInCategory.sort(
          (a, b) => a.order - b.order || a.id - b.id,
        );
      }
    }
  }
  return ordered;
}

function isExcludedReportRow(row) {
  return EXCLUDED_REPORT_CATEGORIES.has(row.category) ||
    EXCLUDED_REPORT_CATEGORIES.has(categoryForGroup(row)) ||
    EXCLUDED_REPORT_CATEGORIES.has(PATIENT_CATEGORY_LABELS[row.category]);
}

function renderPreview() {
  previewBody.replaceChildren();
  for (const row of reviewRows.filter((entry) => !isExcludedReportRow(entry))) {
    const tr = document.createElement("tr");
    if (row.confidence === "needs-review") tr.className = "warning-row critical-row";
    else if (row.confidence === "notice") tr.className = "warning-row";
    else if (row.confidence === "corrected") tr.className = "corrected-row";

    const includeCell = document.createElement("td");
    const include = document.createElement("input");
    include.type = "checkbox";
    include.className = "preview-check";
    include.checked = row.included;
    include.dataset.id = row.id;
    include.dataset.field = "included";
    includeCell.appendChild(include);
    tr.appendChild(includeCell);

    const groupCell = document.createElement("td");
    const groupSelect = document.createElement("select");
    groupSelect.dataset.id = row.id;
    groupSelect.dataset.field = "reportGroup";
    groupSelect.setAttribute("aria-label", "分類");
    for (const group of REPORT_GROUP_ORDER) {
      const option = document.createElement("option");
      option.value = group;
      option.textContent = group;
      option.selected = row.reportGroup === group;
      groupSelect.appendChild(option);
    }
    groupCell.appendChild(groupSelect);
    tr.appendChild(groupCell);

    for (const field of ["zh", "result", "unit", "reference"]) {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "text";
      input.value = row[field];
      input.dataset.id = row.id;
      input.dataset.field = field;
      input.setAttribute("aria-label", field);
      td.appendChild(input);
      tr.appendChild(td);
    }

    const flagCell = document.createElement("td");
    const flagSelect = document.createElement("select");
    flagSelect.dataset.id = row.id;
    flagSelect.dataset.field = "flag";
    for (const [value, label] of [["", "正常"], ["H", "H"], ["L", "L"]]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = row.flag === value;
      flagSelect.appendChild(option);
    }
    flagCell.appendChild(flagSelect);
    tr.appendChild(flagCell);

    const statusCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `preview-status ${row.confidence || (row.warning ? "warning" : "ok")}`;
    badge.textContent = row.warning ? row.warningText : "可使用";
    statusCell.appendChild(badge);
    tr.appendChild(statusCell);
    previewBody.appendChild(tr);
  }

  updatePreviewSummary();
}

function updatePreviewSummary() {
  const visibleRows = reviewRows.filter((row) => !isExcludedReportRow(row));
  const included = visibleRows.filter((row) => row.included).length;
  const corrected = visibleRows.filter((row) => row.confidence === "corrected").length;
  const needsReview = visibleRows.filter((row) => row.confidence === "needs-review").length;
  const notices = visibleRows.filter((row) => row.confidence === "notice").length;
  const unresolved = reviewRows.filter(
    (row) => !isExcludedReportRow(row) && row.included && row.confidence === "needs-review",
  ).length;
  previewSummary.textContent = `智慧辨識 ${visibleRows.length} 列，目前輸出 ${included} 列；自動校正 ${corrected} 列，需確認 ${needsReview} 列，提示 ${notices} 列。`;
  const canApprove = included > 0;
  const canDownload = canApprove;
  exportConfirmButton.disabled = !canApprove;
  exportConfirmButton.textContent = exportApproved
    ? "已確認預覽，可輸出 PDF / Word"
    : "確認預覽，可以輸出 PDF / Word";
  generateButton.disabled = !canDownload;
  pdfButton.disabled = !canDownload;
}

function createPreviewInput(row, field, className = "") {
  const input = document.createElement("input");
  input.type = "text";
  input.value = row[field] || "";
  input.dataset.id = row.id;
  input.dataset.field = field;
  input.className = className;
  input.setAttribute("aria-label", field);
  return input;
}

function renderPreviewFourColumns() {
  previewBody.replaceChildren();

  const orderedRows = reviewRows.filter((row) => !isExcludedReportRow(row)).sort((left, right) => {
    const leftGroup = REPORT_GROUP_ORDER.indexOf(left.reportGroup);
    const rightGroup = REPORT_GROUP_ORDER.indexOf(right.reportGroup);
    if (leftGroup !== rightGroup) return leftGroup - rightGroup;

    const groupOrder = REPORT_CATEGORY_ORDER[left.reportGroup] || [];
    const leftCategory = groupOrder.indexOf(categoryForGroup(left));
    const rightCategory = groupOrder.indexOf(categoryForGroup(right));
    if (leftCategory !== rightCategory) return leftCategory - rightCategory;
    return (left.order ?? 0) - (right.order ?? 0) || left.id - right.id;
  });

  let lastSectionKey = "";
  for (const row of orderedRows) {
    const category = categoryForGroup(row);
    const sectionKey = `${row.reportGroup}|${category}`;
    if (sectionKey !== lastSectionKey) {
      const sectionRow = document.createElement("tr");
      sectionRow.className = "preview-section-row";
      const sectionCell = document.createElement("td");
      sectionCell.colSpan = 4;
      sectionCell.textContent = `${row.reportGroup} · ${PATIENT_CATEGORY_LABELS[category] || category}`;
      sectionRow.append(sectionCell);
      previewBody.append(sectionRow);
      lastSectionKey = sectionKey;
    }

    const tr = document.createElement("tr");
    if (row.confidence === "needs-review") tr.className = "warning-row critical-row";
    else if (row.confidence === "notice") tr.className = "warning-row";
    else if (row.confidence === "corrected") tr.className = "corrected-row";

    const zhCell = document.createElement("td");
    const zhStack = document.createElement("div");
    zhStack.className = "preview-cell-stack";
    const zhLine = document.createElement("div");
    zhLine.className = "preview-cell-line";
    const included = document.createElement("input");
    included.type = "checkbox";
    included.className = "preview-check";
    included.checked = row.included;
    included.dataset.id = row.id;
    included.dataset.field = "included";
    included.setAttribute("aria-label", "是否輸出");
    zhLine.append(included, createPreviewInput(row, "zh"));

    const groupSelect = document.createElement("select");
    groupSelect.dataset.id = row.id;
    groupSelect.dataset.field = "reportGroup";
    groupSelect.className = "group-select";
    groupSelect.setAttribute("aria-label", "報告分類");
    for (const group of REPORT_GROUP_ORDER) {
      const option = document.createElement("option");
      option.value = group;
      option.textContent = group;
      option.selected = row.reportGroup === group;
      groupSelect.append(option);
    }
    zhStack.append(zhLine, groupSelect);
    zhCell.append(zhStack);

    const enCell = document.createElement("td");
    enCell.append(createPreviewInput(row, "en"));

    const resultCell = document.createElement("td");
    const resultStack = document.createElement("div");
    resultStack.className = "preview-cell-stack";
    const resultLine = document.createElement("div");
    resultLine.className = "preview-cell-line";
    resultLine.append(
      createPreviewInput(row, "result", "result-input"),
      createPreviewInput(row, "unit", "unit-input"),
    );
    const flagSelect = document.createElement("select");
    flagSelect.dataset.id = row.id;
    flagSelect.dataset.field = "flag";
    flagSelect.setAttribute("aria-label", "高低標記");
    for (const [value, label] of [["", "正常"], ["H", "H（偏高）"], ["L", "L（偏低）"]]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = row.flag === value;
      flagSelect.append(option);
    }
    resultStack.append(resultLine, flagSelect);
    resultCell.append(resultStack);

    const referenceCell = document.createElement("td");
    const referenceStack = document.createElement("div");
    referenceStack.className = "preview-cell-stack";
    referenceStack.append(createPreviewInput(row, "reference"));
    const badge = document.createElement("span");
    badge.className = `preview-status ${row.confidence || (row.warning ? "warning" : "ok")}`;
    badge.textContent = row.warning ? row.warningText : "已對齊";
    referenceStack.append(badge);
    referenceCell.append(referenceStack);

    tr.append(zhCell, enCell, resultCell, referenceCell);
    previewBody.append(tr);
  }

  updatePreviewSummary();
}

function invalidatePreview(message = "內容已變更，請重新按「整理並預覽」。") {
  reviewedSource = "";
  reviewRows = [];
  exportApproved = false;
  previewPanel.hidden = true;
  exportConfirmButton.disabled = true;
  generateButton.disabled = true;
  pdfButton.disabled = true;
  setStatus(message);
}

function preparePreview({ scroll = false } = {}) {
  const text = sourceText.value.trim();
  if (!text) {
    setStatus("請先選擇文字檔或貼上內容。", "error");
    return false;
  }
  reviewRows = buildReviewRows(parseText(text));
  reviewedSource = text;
  exportApproved = false;
  renderPreviewFourColumns();
  previewPanel.hidden = false;
  if (scroll) previewPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  setStatus("預覽已建立。請先確認欄位內容，再按「確認預覽，可以輸出」。", "success");
  return true;
}

const border = { style: BorderStyle.SINGLE, size: 4, color: "7F8C99" };
const borders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };

function textParagraph(text, { bold = false, center = false, size = 18 } = {}) {
  return new Paragraph({
    alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { before: 0, after: 0 },
    children: [new TextRun({ text, bold, size, font: "Arial", eastAsia: "Microsoft JhengHei" })],
  });
}

function cell(text, width, options = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 110, bottom: 110, left: 130, right: 130 },
    shading: options.header
      ? { type: ShadingType.CLEAR, fill: "D9EAF7" }
      : options.fill
        ? { type: ShadingType.CLEAR, fill: options.fill }
        : undefined,
    borders,
    children: [textParagraph(text, options)],
  });
}

function labTable(rows) {
  const widths = [2800, 5000, 2800, 4538];
  return new Table({
    width: { size: 15138, type: WidthType.DXA },
    columnWidths: widths,
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: ["中文項目", "英文項目", "結果", "正常值"].map((value, index) =>
          cell(value, widths[index], { header: true, bold: true, center: true })
        ),
      }),
      ...rows.map((row, rowIndex) => {
        const fill = rowIndex % 2 ? "F7FAFC" : undefined;
        return new TableRow({
          cantSplit: true,
          children: [
            cell(row.zh, widths[0], { bold: true, fill }),
            cell(row.en, widths[1], { size: 16, fill }),
            cell([row.result, row.unit].filter(Boolean).join(" "), widths[2], {
              bold: ["H", "L"].includes(row.flag),
              center: true,
              fill,
            }),
            cell(row.reference, widths[3], { center: true, size: 16, fill }),
          ],
        });
      }),
    ],
  });
}

async function makeDocx(grouped) {
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 220 },
      children: [new TextRun({ text: "檢查報告整理", bold: true, size: 40, font: "Arial", eastAsia: "Microsoft JhengHei", color: "1F4E79" })],
    }),
  ];

  for (const [section, categories] of Object.entries(grouped)) {
    children.push(new Paragraph({ text: section, heading: HeadingLevel.HEADING_1 }));
    for (const [category, rows] of Object.entries(categories)) {
      children.push(new Paragraph({
        text: PATIENT_CATEGORY_LABELS[category] || category,
        heading: HeadingLevel.HEADING_2,
      }));
      children.push(labTable(rows.map((row) => row.isImage
        ? { ...row, result: row.rawText, unit: "", reference: "" }
        : row)));
      children.push(new Paragraph({ text: "", spacing: { after: 80 } }));
    }
  }

  const document = new Document({
    styles: {
      default: {
        document: { run: { font: "Arial", size: 20 }, paragraph: { spacing: { after: 80, line: 264 } } },
        heading1: { run: { font: "Arial", size: 32, bold: true, color: "1F4E79" }, paragraph: { spacing: { before: 280, after: 120 } } },
        heading2: { run: { font: "Arial", size: 24, bold: true, color: "1F4E79" }, paragraph: { spacing: { before: 180, after: 80 } } },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE },
          margin: { top: 850, right: 850, bottom: 850, left: 850 },
        },
      },
      children,
    }],
  });
  return Packer.toBlob(document);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makePdfReport(grouped) {
  const root = document.createElement("div");
  root.className = "pdf-report";
  root.style.cssText = `
    position: fixed; left: 0; top: 0; z-index: 2147483647; width: 283mm;
    box-sizing: border-box;
    max-height: none; overflow: visible; pointer-events: none;
    padding: 7mm 8mm 9mm; color: #17304c; background: #fff;
    font-family: "Microsoft JhengHei", "Noto Sans TC", Arial, sans-serif;
    font-size: 10px; line-height: 1.45;
  `;

  const title = document.createElement("div");
  title.innerHTML = `
    <div style="text-align:center;margin:0 0 10mm;padding-bottom:5mm;border-bottom:1.5px solid #2f769d;">
      <div style="font-size:9px;letter-spacing:2px;color:#198f82;margin-bottom:2mm;">MEDORA REPORT INTELLIGENCE</div>
      <h1 style="font-size:24px;line-height:1.3;margin:0;color:#123d63;">檢查報告整理</h1>
    </div>`;
  root.appendChild(title);

  for (const [section, categories] of Object.entries(grouped)) {
    const sectionBlock = document.createElement("section");
    sectionBlock.style.cssText = "margin:0 0 7mm;";
    sectionBlock.innerHTML = `<h2 style="font-size:18px;color:#174e78;margin:0 0 4mm;">${escapeHtml(section)}</h2>`;

    for (const [category, rows] of Object.entries(categories)) {
      const categoryBlock = document.createElement("div");
      categoryBlock.style.cssText = "margin:0 0 6mm;break-inside:auto;";
      categoryBlock.innerHTML = `<h3 style="font-size:13px;color:#174e78;margin:0 0 2.5mm;">${escapeHtml(PATIENT_CATEGORY_LABELS[category] || category)}</h3>`;

      const headers = ["中文項目", "英文項目", "結果", "正常值"];
      const table = document.createElement("table");
      table.style.cssText = "width:100%;border-collapse:collapse;table-layout:fixed;font-size:8.8px;break-inside:auto;";
      const headerWidths = ["20%", "32%", "19%", "29%"];
      table.innerHTML = `
        <thead style="display:table-header-group;"><tr>${headers.map((header, index) =>
          `<th style="width:${headerWidths[index]};padding:2.6mm 2.2mm;text-align:center;background:#dcecf5;border:1px solid #9aabb7;color:#173b55;font-weight:700;letter-spacing:.04em;">${header}</th>`
        ).join("")}</tr></thead>
        <tbody>${rows.map((row, rowIndex) => `<tr data-report-row style="break-inside:avoid;page-break-inside:avoid;background:${rowIndex % 2 ? "#f7fafc" : "#ffffff"};">
            <td style="padding:2.5mm 2.2mm;border:1px solid #9aabb7;vertical-align:middle;text-align:left;white-space:nowrap;font-weight:700;">${escapeHtml(row.zh)}</td>
            <td style="padding:2.5mm 2.2mm;border:1px solid #9aabb7;vertical-align:middle;text-align:left;line-height:1.4;overflow-wrap:normal;word-break:keep-all;">${escapeHtml(row.en)}</td>
            <td style="padding:2.5mm 2.2mm;border:1px solid #9aabb7;vertical-align:middle;text-align:${row.isImage ? "left" : "center"};white-space:${row.isImage ? "pre-wrap" : "nowrap"};font-variant-numeric:tabular-nums;font-weight:${["H", "L"].includes(row.flag) ? "700" : "500"};">${escapeHtml(row.isImage ? row.rawText : [row.result, row.unit].filter(Boolean).join(" "))}</td>
            <td style="padding:2.5mm 2.2mm;border:1px solid #9aabb7;vertical-align:middle;text-align:center;line-height:1.4;font-variant-numeric:tabular-nums;">${escapeHtml(row.reference)}</td>
          </tr>`).join("")}</tbody>`;
      categoryBlock.appendChild(table);
      sectionBlock.appendChild(categoryBlock);
    }
    root.appendChild(sectionBlock);
  }

  const footer = document.createElement("p");
  footer.textContent = "本報告僅整理檢查結果，不提供診斷、判讀或醫療建議。";
  footer.style.cssText = "margin:8mm 0 0;padding-top:3mm;border-top:1px solid #d8e3e8;color:#6e808b;font-size:8px;text-align:center;";
  root.appendChild(footer);

  return root;
}

function getPdfRowRanges(report, canvas) {
  const reportRect = report.getBoundingClientRect();
  const scale = canvas.width / reportRect.width;
  return [...report.querySelectorAll("[data-report-row]")]
    .map((row) => {
      const rect = row.getBoundingClientRect();
      return {
        top: Math.round((rect.top - reportRect.top) * scale),
        bottom: Math.round((rect.bottom - reportRect.top) * scale),
      };
    })
    .filter((range) => range.bottom > range.top);
}

function choosePdfSliceHeight(sourceY, pagePixelHeight, canvasHeight, rowRanges) {
  const naturalEnd = Math.min(sourceY + pagePixelHeight, canvasHeight);
  if (naturalEnd >= canvasHeight) return canvasHeight - sourceY;

  const crossingRow = rowRanges.find(
    (range) => range.top < naturalEnd && range.bottom > naturalEnd,
  );
  if (!crossingRow) return naturalEnd - sourceY;

  const spaceBeforeRow = crossingRow.top - sourceY;
  const rowHeight = crossingRow.bottom - crossingRow.top;
  const enoughContentBeforeRow = spaceBeforeRow >= pagePixelHeight * 0.2;
  const rowFitsOnPage = rowHeight < pagePixelHeight;
  if (enoughContentBeforeRow && rowFitsOnPage) return spaceBeforeRow;

  return naturalEnd - sourceY;
}

function getReportData() {
  const text = sourceText.value.trim();
  if (!text) throw new Error("請先選擇文字檔或貼上內容");
  if (!reviewedSource || reviewedSource !== text) {
    throw new Error("內容尚未預覽，請先按「整理並預覽」");
  }
  const grouped = groupReviewRows(reviewRows);
  const count = Object.values(grouped).reduce(
    (total, categories) => total + Object.values(categories).reduce((sum, rows) => sum + rows.length, 0),
    0,
  );
  if (!count) throw new Error("找不到可整理的內容");
  return {
    grouped,
    count,
  };
}

const fileInput = document.querySelector("#fileInput");
const fileName = document.querySelector("#fileName");
const sourceText = document.querySelector("#sourceText");
const status = document.querySelector("#status");
const generateButton = document.querySelector("#generateButton");
const pdfButton = document.querySelector("#pdfButton");
const previewButton = document.querySelector("#previewButton");
const previewPanel = document.querySelector("#previewPanel");
const previewBody = document.querySelector("#previewBody");
const previewSummary = document.querySelector("#previewSummary");
const exportConfirmButton = document.createElement("button");
exportConfirmButton.id = "exportConfirmButton";
exportConfirmButton.className = "confirm-export-button";
exportConfirmButton.type = "button";
exportConfirmButton.disabled = true;
exportConfirmButton.textContent = "確認預覽，可以輸出 PDF / Word";
previewPanel.appendChild(exportConfirmButton);

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;
  fileName.textContent = file.name;
  sourceText.value = await file.text();
  invalidatePreview(`已載入 ${file.name}，請按「AI 智慧辨識並預覽」。`);
});

document.querySelector("#sampleButton").addEventListener("click", () => {
  sourceText.value = HOSPITAL_SAMPLE;
  fileName.textContent = "示範資料";
  invalidatePreview("已載入示範資料，請按「AI 智慧辨識並預覽」。");
});

sourceText.addEventListener("input", () => {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    invalidatePreview("內容已變更，請重新按「AI 智慧辨識並預覽」。");
  }, 150);
});

previewButton.addEventListener("click", () => {
  preparePreview({ scroll: true });
});

previewBody.addEventListener("input", (event) => {
  const control = event.target.closest("[data-id][data-field]");
  if (!control) return;
  const row = reviewRows.find((entry) => entry.id === Number(control.dataset.id));
  if (!row) return;
  row[control.dataset.field] = control.type === "checkbox" ? control.checked : control.value;
  if (control.dataset.field !== "included" && control.dataset.field !== "reportGroup") {
    refreshRowAssessment(row);
  }
  exportApproved = false;
  updatePreviewSummary();
});

previewBody.addEventListener("change", (event) => {
  const control = event.target.closest("[data-id][data-field]");
  if (!control) return;
  const row = reviewRows.find((entry) => entry.id === Number(control.dataset.id));
  if (!row) return;
  row[control.dataset.field] = control.type === "checkbox" ? control.checked : control.value;
  exportApproved = false;
  if (control.dataset.field !== "included" && control.dataset.field !== "reportGroup") {
    refreshRowAssessment(row);
    renderPreviewFourColumns();
  } else {
    updatePreviewSummary();
  }
});

exportConfirmButton.addEventListener("click", () => {
  exportApproved = true;
  updatePreviewSummary();
  setStatus("已確認預覽。現在可以選擇下載 PDF 或 Word。", "success");
});

function confirmExportIfNeeded(formatName) {
  if (exportApproved) return true;
  const confirmed = window.confirm(`預覽已建立。是否確認輸出 ${formatName}？`);
  if (confirmed) {
    exportApproved = true;
    updatePreviewSummary();
  }
  return confirmed;
}

generateButton.addEventListener("click", async () => {
  if (!confirmExportIfNeeded("Word")) return;
  generateButton.disabled = true;
  setStatus("正在整理並製作 Word，請稍候...");
  try {
    const { grouped, count } = getReportData();
    const blob = await makeDocx(grouped);
    saveAs(blob, "檢查報告整理-病人閱讀版.docx");
    setStatus(`完成：已整理 ${count} 個項目，Word 已開始下載。`, "success");
  } catch (error) {
    console.error(error);
    setStatus(`無法產生報告：${error.message}`, "error");
  } finally {
    updatePreviewSummary();
  }
});

pdfButton.addEventListener("click", async () => {
  if (!confirmExportIfNeeded("PDF")) return;
  pdfButton.disabled = true;
  setStatus("正在整理並製作 PDF，請稍候...");
  try {
    const { grouped, count } = getReportData();
    const report = makePdfReport(grouped);
    document.body.appendChild(report);
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    await document.fonts?.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    try {
      const canvas = await html2canvas(report, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        logging: false,
        windowWidth: Math.ceil(report.getBoundingClientRect().width),
        windowHeight: report.scrollHeight,
      });
      if (!canvas.width || !canvas.height) throw new Error("報告畫面建立失敗");

      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape", compress: true });
      const pageWidthMm = 283;
      const pageHeightMm = 196;
      const pagePixelHeight = Math.floor(canvas.width * pageHeightMm / pageWidthMm);
      const rowRanges = getPdfRowRanges(report, canvas);
      let sourceY = 0;
      let pageIndex = 0;

      while (sourceY < canvas.height) {
        const sliceHeight = choosePdfSliceHeight(
          sourceY,
          pagePixelHeight,
          canvas.height,
          rowRanges,
        );
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = pagePixelHeight;
        const context = pageCanvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        context.drawImage(
          canvas,
          0, sourceY, canvas.width, sliceHeight,
          0, 0, canvas.width, sliceHeight,
        );
        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(
          pageCanvas.toDataURL("image/jpeg", 0.96),
          "JPEG",
          7, 7, pageWidthMm, pageHeightMm,
          undefined,
          "FAST",
        );
        sourceY += sliceHeight;
        pageIndex += 1;
      }
      pdf.save("檢查報告整理-病人閱讀版.pdf");
    } finally {
      document.documentElement.style.overflow = previousOverflow;
      report.remove();
    }
    setStatus(`完成：已整理 ${count} 個項目，PDF 已開始下載。`, "success");
  } catch (error) {
    console.error(error);
    document.querySelector(".pdf-report")?.remove();
    setStatus(`無法產生 PDF：${error.message}`, "error");
  } finally {
    updatePreviewSummary();
  }
});

function setStatus(message, type = "") {
  status.textContent = message;
  status.className = `status ${type}`.trim();
}
