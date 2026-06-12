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
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import mapping from "./mapping.json";
import "./styles.css";

const SECTION_ORDER = ["抽血檢查", "驗尿檢查", "影像檢查", "其他檢查項目"];
const CATEGORY_ORDER = {
  抽血檢查: [
    "血液常規檢查", "肝膽功能檢查", "腎功能檢查", "腎臟特殊檢查",
    "電解質與酸鹼檢查", "血糖與糖尿病相關檢查", "血脂檢查",
    "鐵質與貧血相關檢查", "維生素與營養檢查", "甲狀腺功能檢查",
    "骨礦物質與副甲狀腺檢查", "發炎與感染指標", "感染血清學檢查",
    "心臟相關檢查", "肌肉酵素檢查", "凝血功能檢查",
    "自體免疫與風濕免疫檢查", "免疫與特殊蛋白檢查",
    "內分泌與荷爾蒙檢查", "腫瘤指標", "胰臟功能檢查", "其他抽血檢查",
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

const aliasIndex = new Map();
for (const [canonical, item] of Object.entries(mapping)) {
  for (const alias of [canonical, ...item.aliases]) aliasIndex.set(normalize(alias), canonical);
}

function normalize(value) {
  return [...value.trim().toLowerCase()].filter((char) => /[\p{L}\p{N}]/u.test(char)).join("");
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

function parseText(text) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const items = [];
  let specimen = "";

  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim();
    if (!line) {
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

function isImageHeading(value) {
  return /(sonogram|sonography|ultrasound|x[\s-]?ray|cxr|computed tomography|\bct\b|magnetic resonance|\bmri\b|dxa|dexa|egd|colonoscopy|echocardiography|\becho\b|\becg\b)/i.test(value);
}

function parseResultLine(line, specimen) {
  const firstPipe = line.indexOf("|");
  const colonIndexes = [line.indexOf(":"), line.indexOf("：")].filter((i) => i >= 0);
  const firstColon = colonIndexes.length ? Math.min(...colonIndexes) : -1;

  if (firstColon >= 0 && (firstPipe < 0 || firstColon < firstPipe)) {
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

  items.forEach((source, position) => {
    const canonical = aliasIndex.get(normalize(source.rawName));
    const mapped = canonical ? mapping[canonical] : null;
    const dedupeKey = canonical || normalize(source.rawName) || `unknown-${position}`;
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
  if (/(BLOOD|SERUM|PLASMA|血)/.test(combined)) return ["抽血檢查", "其他抽血檢查"];
  return ["其他檢查項目", "其他檢查項目"];
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
    margins: { top: 90, bottom: 90, left: 100, right: 100 },
    shading: options.header ? { type: ShadingType.CLEAR, fill: "D9EAF7" } : undefined,
    borders,
    children: [textParagraph(text, options)],
  });
}

function labTable(rows) {
  const widths = [1650, 3550, 1750, 2410];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: ["中文項目", "English", "結果", "正常值"].map((value, index) =>
          cell(value, widths[index], { header: true, bold: true, center: index >= 2 })
        ),
      }),
      ...rows.map((row) => new TableRow({
        children: [
          cell(row.zh, widths[0]),
          cell(row.en, widths[1]),
          cell([row.result, row.unit].filter(Boolean).join(" "), widths[2], { bold: ["H", "L"].includes(row.flag), center: true }),
          cell(row.reference, widths[3], { center: true }),
        ],
      })),
    ],
  });
}

function imageTable(rows) {
  const widths = [2100, 2700, 4560];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: ["中文檢查項目", "English", "檢查結果"].map((value, index) =>
          cell(value, widths[index], { header: true, bold: true, center: index === 2 })
        ),
      }),
      ...rows.map((row) => new TableRow({
        children: [
          cell(row.zh, widths[0]),
          cell(row.en, widths[1]),
          cell(row.rawText || [row.result, row.unit].filter(Boolean).join(" "), widths[2]),
        ],
      })),
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
      children.push(new Paragraph({ text: category, heading: HeadingLevel.HEADING_2 }));
      children.push(section === "影像檢查" ? imageTable(rows) : labTable(rows));
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
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: 1020, right: 964, bottom: 1020, left: 964 },
        },
      },
      children,
    }],
  });
  return Packer.toBlob(document);
}

const fileInput = document.querySelector("#fileInput");
const fileName = document.querySelector("#fileName");
const sourceText = document.querySelector("#sourceText");
const status = document.querySelector("#status");
const generateButton = document.querySelector("#generateButton");

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;
  fileName.textContent = file.name;
  sourceText.value = await file.text();
  setStatus(`已載入 ${file.name}，可以產生 Word。`);
});

document.querySelector("#sampleButton").addEventListener("click", () => {
  sourceText.value = SAMPLE;
  fileName.textContent = "示範資料";
  setStatus("已載入示範資料，可以產生 Word。");
});

generateButton.addEventListener("click", async () => {
  const text = sourceText.value.trim();
  if (!text) {
    setStatus("請先選擇文字檔或貼上內容。", "error");
    return;
  }

  generateButton.disabled = true;
  setStatus("正在整理並製作 Word，請稍候...");
  try {
    const grouped = classify(parseText(text));
    const count = Object.values(grouped).reduce(
      (total, categories) => total + Object.values(categories).reduce((sum, rows) => sum + rows.length, 0),
      0,
    );
    if (!count) throw new Error("找不到可整理的內容");
    const blob = await makeDocx(grouped);
    saveAs(blob, "檢查報告整理.docx");
    setStatus(`完成：已整理 ${count} 個項目，Word 已開始下載。`, "success");
  } catch (error) {
    console.error(error);
    setStatus(`無法產生報告：${error.message}`, "error");
  } finally {
    generateButton.disabled = false;
  }
});

function setStatus(message, type = "") {
  status.textContent = message;
  status.className = `status ${type}`.trim();
}
