def _item(aliases, zh, en, section, category, order):
    return {
        "aliases": aliases,
        "zh": zh,
        "en": en,
        "section": section,
        "category": category,
        "order": order,
    }


LAB_MAPPING = {
    # CBC
    "WBC": _item(["WBC", "White Blood Cell", "Leukocyte"], "白血球", "White Blood Cell, WBC", "抽血檢查", "血液常規檢查", 101),
    "RBC": _item(["RBC", "Red Blood Cell"], "紅血球", "Red Blood Cell, RBC", "抽血檢查", "血液常規檢查", 102),
    "Hb": _item(["Hb", "HGB", "Hemoglobin"], "血紅素", "Hemoglobin, Hb", "抽血檢查", "血液常規檢查", 103),
    "Hct": _item(["Hct", "HCT", "Hematocrit"], "血比容", "Hematocrit, Hct", "抽血檢查", "血液常規檢查", 104),
    "MCV": _item(["MCV"], "平均紅血球容積", "Mean Corpuscular Volume, MCV", "抽血檢查", "血液常規檢查", 105),
    "MCH": _item(["MCH"], "平均紅血球血紅素量", "Mean Corpuscular Hemoglobin, MCH", "抽血檢查", "血液常規檢查", 106),
    "MCHC": _item(["MCHC"], "平均紅血球血紅素濃度", "Mean Corpuscular Hemoglobin Concentration, MCHC", "抽血檢查", "血液常規檢查", 107),
    "Platelet": _item(["PLT", "Platelet", "Platelet Count"], "血小板", "Platelet Count, PLT", "抽血檢查", "血液常規檢查", 108),
    # Liver
    "AST": _item(["AST", "GOT", "SGOT"], "天門冬胺酸轉胺酶", "Aspartate Aminotransferase, AST", "抽血檢查", "肝膽功能檢查", 201),
    "ALT": _item(["ALT", "GPT", "SGPT"], "丙胺酸轉胺酶", "Alanine Aminotransferase, ALT", "抽血檢查", "肝膽功能檢查", 202),
    "ALP": _item(["ALP", "Alkaline Phosphatase"], "鹼性磷酸酶", "Alkaline Phosphatase, ALP", "抽血檢查", "肝膽功能檢查", 203),
    "GGT": _item(["GGT", "r-GT", "Gamma-GT"], "γ-麩胺醯轉移酶", "Gamma-Glutamyl Transferase, GGT", "抽血檢查", "肝膽功能檢查", 204),
    "Total Bilirubin": _item(["T-Bil", "Total Bilirubin"], "總膽紅素", "Total Bilirubin, T-Bil", "抽血檢查", "肝膽功能檢查", 205),
    "Albumin": _item(["ALB", "Albumin"], "白蛋白", "Albumin, Alb", "抽血檢查", "肝膽功能檢查", 206),
    "Total Protein": _item(["TP", "Total Protein"], "總蛋白", "Total Protein, TP", "抽血檢查", "肝膽功能檢查", 207),
    "LDH": _item(["LDH", "Lactate Dehydrogenase"], "乳酸脫氫酶", "Lactate Dehydrogenase, LDH", "抽血檢查", "肝膽功能檢查", 208),
    # Kidney
    "BUN": _item(["BUN", "Blood Urea Nitrogen", "Urea Nitrogen"], "血中尿素氮", "Blood Urea Nitrogen, BUN", "抽血檢查", "腎功能檢查", 301),
    "Creatinine": _item(["CREAT.", "CREAT", "Crea", "Creatinine", "Cr"], "肌酸酐", "Creatinine, Cr", "抽血檢查", "腎功能檢查", 302),
    "eGFR": _item(["eGFR", "Estimated GFR"], "估算腎絲球過濾率", "Estimated Glomerular Filtration Rate, eGFR", "抽血檢查", "腎功能檢查", 303),
    "Uric Acid": _item(["Uric Acid", "UA"], "尿酸", "Uric Acid, UA", "抽血檢查", "腎功能檢查", 304),
    "Cystatin C": _item(["Cystatin C"], "胱抑素 C", "Cystatin C", "抽血檢查", "腎臟特殊檢查", 401),
    # Electrolytes
    "Sodium": _item(["Na", "Sodium"], "鈉", "Sodium, Na", "抽血檢查", "電解質與酸鹼檢查", 501),
    "Potassium": _item(["K", "Potassium"], "鉀", "Potassium, K", "抽血檢查", "電解質與酸鹼檢查", 502),
    "Chloride": _item(["Cl", "Chloride"], "氯", "Chloride, Cl", "抽血檢查", "電解質與酸鹼檢查", 503),
    "Calcium": _item(["Ca", "Calcium"], "鈣", "Calcium, Ca", "抽血檢查", "電解質與酸鹼檢查", 504),
    "Phosphate": _item(["P", "I.P.", "IP", "Phosphate", "Phosphorus"], "磷", "Phosphate, P", "抽血檢查", "電解質與酸鹼檢查", 505),
    "Magnesium": _item(["Mg", "Magnesium"], "鎂", "Magnesium, Mg", "抽血檢查", "電解質與酸鹼檢查", 506),
    "Bicarbonate": _item(["HCO3", "Bicarbonate", "Total CO2", "CO2"], "碳酸氫根", "Bicarbonate, HCO3-", "抽血檢查", "電解質與酸鹼檢查", 507),
    # Glucose/lipid
    "Glucose": _item(["Glucose", "GLU", "AC Sugar", "Fasting Glucose"], "葡萄糖", "Glucose, Glu", "抽血檢查", "血糖與糖尿病相關檢查", 601),
    "HbA1c": _item(["HbA1c", "A1C", "Glycated Hemoglobin"], "糖化血色素", "Glycated Hemoglobin, HbA1c", "抽血檢查", "血糖與糖尿病相關檢查", 602),
    "Total Cholesterol": _item(["T-CHOL", "CHOL", "Total Cholesterol"], "總膽固醇", "Total Cholesterol, TC", "抽血檢查", "血脂檢查", 701),
    "Triglyceride": _item(["TG", "Triglyceride"], "三酸甘油酯", "Triglyceride, TG", "抽血檢查", "血脂檢查", 702),
    "HDL-C": _item(["HDL", "HDL-C", "HDL Cholesterol"], "高密度脂蛋白膽固醇", "High-Density Lipoprotein Cholesterol, HDL-C", "抽血檢查", "血脂檢查", 703),
    "LDL-C": _item(["LDL", "LDL-C", "LDL Cholesterol"], "低密度脂蛋白膽固醇", "Low-Density Lipoprotein Cholesterol, LDL-C", "抽血檢查", "血脂檢查", 704),
    # Iron/nutrition/thyroid/bone
    "Iron": _item(["Iron", "Fe"], "血清鐵", "Serum Iron, Fe", "抽血檢查", "鐵質與貧血相關檢查", 801),
    "TIBC": _item(["TIBC"], "總鐵結合能力", "Total Iron-Binding Capacity, TIBC", "抽血檢查", "鐵質與貧血相關檢查", 802),
    "Ferritin": _item(["Ferritin"], "鐵蛋白", "Ferritin", "抽血檢查", "鐵質與貧血相關檢查", 803),
    "TSAT": _item(["TSAT", "Transferrin Saturation"], "轉鐵蛋白飽和度", "Transferrin Saturation, TSAT", "抽血檢查", "鐵質與貧血相關檢查", 804),
    "Vitamin D": _item(["Vitamin D", "25-OH Vitamin D", "25(OH)D"], "維生素 D", "25-Hydroxyvitamin D, 25(OH)D", "抽血檢查", "維生素與營養檢查", 901),
    "TSH": _item(["TSH"], "甲狀腺刺激素", "Thyroid-Stimulating Hormone, TSH", "抽血檢查", "甲狀腺功能檢查", 1001),
    "Free T4": _item(["FREE T4", "Free T4", "FT4"], "游離甲狀腺素", "Free Thyroxine, Free T4", "抽血檢查", "甲狀腺功能檢查", 1002),
    "Intact-PTH": _item(["Intact-PTH", "iPTH", "PTH"], "完整副甲狀腺素", "Intact Parathyroid Hormone, iPTH", "抽血檢查", "骨礦物質與副甲狀腺檢查", 1101),
    # Inflammation/cardiac/muscle/coagulation
    "CRP": _item(["CRP", "C-Reactive Protein"], "C 反應蛋白", "C-Reactive Protein, CRP", "抽血檢查", "發炎與感染指標", 1201),
    "ESR": _item(["ESR"], "紅血球沉降速率", "Erythrocyte Sedimentation Rate, ESR", "抽血檢查", "發炎與感染指標", 1202),
    "PCT": _item(["PCT", "Procalcitonin"], "降鈣素原", "Procalcitonin, PCT", "抽血檢查", "發炎與感染指標", 1203),
    "Troponin": _item(["Troponin", "Troponin-I", "hs-TnI"], "心肌肌鈣蛋白", "Cardiac Troponin, cTn", "抽血檢查", "心臟相關檢查", 1401),
    "CK-MB": _item(["CK-MB", "CKMB"], "肌酸激酶同功酶 MB", "Creatine Kinase-MB, CK-MB", "抽血檢查", "心臟相關檢查", 1402),
    "BNP": _item(["BNP"], "B 型利鈉肽", "B-Type Natriuretic Peptide, BNP", "抽血檢查", "心臟相關檢查", 1403),
    "NT-proBNP": _item(["NT-proBNP", "NT-pro BNP"], "N 端前 B 型利鈉肽", "N-Terminal pro-B-Type Natriuretic Peptide, NT-proBNP", "抽血檢查", "心臟相關檢查", 1404),
    "CK": _item(["CK", "CPK", "Creatine Kinase"], "肌酸激酶", "Creatine Kinase, CK", "抽血檢查", "肌肉酵素檢查", 1501),
    "Myoglobin": _item(["Myoglobin"], "肌紅蛋白", "Myoglobin", "抽血檢查", "肌肉酵素檢查", 1502),
    "PT": _item(["PT", "Prothrombin Time"], "凝血酶原時間", "Prothrombin Time, PT", "抽血檢查", "凝血功能檢查", 1601),
    "INR": _item(["INR"], "國際標準化比值", "International Normalized Ratio, INR", "抽血檢查", "凝血功能檢查", 1602),
    "APTT": _item(["APTT", "aPTT"], "活化部分凝血活酶時間", "Activated Partial Thromboplastin Time, APTT", "抽血檢查", "凝血功能檢查", 1603),
    "D-dimer": _item(["D-dimer", "D Dimer"], "D-二聚體", "D-Dimer", "抽血檢查", "凝血功能檢查", 1604),
    # Immune
    "ANA": _item(["ANA"], "抗核抗體", "Antinuclear Antibody, ANA", "抽血檢查", "自體免疫與風濕免疫檢查", 1701),
    "RF": _item(["RF", "Rheumatoid Factor"], "類風濕因子", "Rheumatoid Factor, RF", "抽血檢查", "自體免疫與風濕免疫檢查", 1702),
    "ANCA": _item(["ANCA"], "抗嗜中性球細胞質抗體", "Antineutrophil Cytoplasmic Antibody, ANCA", "抽血檢查", "自體免疫與風濕免疫檢查", 1703),
    "C3": _item(["C3", "Complement C3"], "補體 C3", "Complement Component 3, C3", "抽血檢查", "自體免疫與風濕免疫檢查", 1704),
    "C4": _item(["C4", "Complement C4"], "補體 C4", "Complement Component 4, C4", "抽血檢查", "自體免疫與風濕免疫檢查", 1705),
    "IgG": _item(["IgG"], "免疫球蛋白 G", "Immunoglobulin G, IgG", "抽血檢查", "免疫與特殊蛋白檢查", 1801),
    "IgA": _item(["IgA"], "免疫球蛋白 A", "Immunoglobulin A, IgA", "抽血檢查", "免疫與特殊蛋白檢查", 1802),
    "IgM": _item(["IgM"], "免疫球蛋白 M", "Immunoglobulin M, IgM", "抽血檢查", "免疫與特殊蛋白檢查", 1803),
    "Free Light Chain": _item(["Free Light Chain", "FLC", "Kappa/Lambda"], "游離輕鏈", "Serum Free Light Chain, FLC", "抽血檢查", "免疫與特殊蛋白檢查", 1804),
    # Tumor/pancreas
    "AFP": _item(["AFP"], "甲型胎兒蛋白", "Alpha-Fetoprotein, AFP", "抽血檢查", "腫瘤指標", 2001),
    "CEA": _item(["CEA"], "癌胚抗原", "Carcinoembryonic Antigen, CEA", "抽血檢查", "腫瘤指標", 2002),
    "CA19-9": _item(["CA19-9", "CA 19-9"], "醣類抗原 19-9", "Carbohydrate Antigen 19-9, CA19-9", "抽血檢查", "腫瘤指標", 2003),
    "PSA": _item(["PSA"], "前列腺特異抗原", "Prostate-Specific Antigen, PSA", "抽血檢查", "腫瘤指標", 2004),
    "Thyroglobulin": _item(["Thyroglobulin", "Tg"], "甲狀腺球蛋白", "Thyroglobulin, Tg", "抽血檢查", "甲狀腺功能檢查", 1003),
    "Amylase": _item(["Amylase"], "澱粉酶", "Amylase", "抽血檢查", "胰臟功能檢查", 2101),
    "Lipase": _item(["Lipase"], "脂肪酶", "Lipase", "抽血檢查", "胰臟功能檢查", 2102),
    # Urine
    "Urine Protein": _item(["Urine Protein", "Protein(U)", "Urine Total Protein"], "尿蛋白", "Urine Protein", "驗尿檢查", "尿蛋白與白蛋白", 2301),
    "Urine Creatinine": _item(["Urine Creatinine", "Creatinine(U)", "U-Cr"], "尿液肌酸酐", "Urine Creatinine, U-Cr", "驗尿檢查", "尿蛋白與白蛋白", 2302),
    "ACR": _item(["ACRatio", "ACR", "UACR"], "尿白蛋白肌酸酐比", "Albumin-to-Creatinine Ratio, ACR", "驗尿檢查", "尿蛋白與白蛋白", 2303),
    "PCR": _item(["PCRatio", "PCR", "UPCR"], "尿蛋白肌酸酐比", "Protein-to-Creatinine Ratio, PCR", "驗尿檢查", "尿蛋白與白蛋白", 2304),
    "Urine Albumin": _item(["Urine Albumin", "Microalbumin", "U-Albumin"], "尿液白蛋白", "Urine Albumin", "驗尿檢查", "尿蛋白與白蛋白", 2305),
    "Urine pH": _item(["pH(U)", "Urine pH", "pH"], "尿液酸鹼值", "Urine pH", "驗尿檢查", "尿液一般檢查", 2201),
    "Urine SG": _item(["Specific Gravity", "S.G.", "SG"], "尿液比重", "Urine Specific Gravity, SG", "驗尿檢查", "尿液一般檢查", 2202),
    "Urine Glucose": _item(["Glucose(U)", "Urine Glucose"], "尿糖", "Urine Glucose", "驗尿檢查", "尿液一般檢查", 2203),
    "Urine RBC": _item(["RBC(U)", "Urine RBC"], "尿液紅血球", "Urine Red Blood Cell, RBC", "驗尿檢查", "尿沉渣", 2401),
    "Urine WBC": _item(["WBC(U)", "Urine WBC"], "尿液白血球", "Urine White Blood Cell, WBC", "驗尿檢查", "尿沉渣", 2402),
    # Imaging and procedures
    "Abdominal Sonography": _item(["Abdominal Sonography", "Abdominal Ultrasound", "SONOGRAM"], "腹部超音波", "Abdominal Sonography", "影像檢查", "超音波檢查", 3001),
    "CXR": _item(["Chest X-ray", "CXR"], "胸部 X 光", "Chest X-ray, CXR", "影像檢查", "X 光檢查", 3101),
    "CT": _item(["Computed Tomography", "CT"], "電腦斷層", "Computed Tomography, CT", "影像檢查", "電腦斷層檢查", 3201),
    "MRI": _item(["Magnetic Resonance Imaging", "MRI"], "磁振造影", "Magnetic Resonance Imaging, MRI", "影像檢查", "磁振造影檢查", 3301),
    "DXA": _item(["DXA", "DEXA", "Bone Density"], "骨質密度檢查", "Dual-Energy X-ray Absorptiometry, DXA", "影像檢查", "骨質密度檢查", 3401),
    "EGD": _item(["EGD", "Gastroscopy"], "上消化道內視鏡", "Esophagogastroduodenoscopy, EGD", "影像檢查", "內視鏡檢查", 3501),
    "Colonoscopy": _item(["Colonoscopy"], "大腸鏡", "Colonoscopy", "影像檢查", "內視鏡檢查", 3502),
    "ECG": _item(["ECG", "EKG", "Electrocardiography"], "心電圖", "Electrocardiography, ECG", "影像檢查", "心臟血管檢查", 3601),
    "Echocardiography": _item(["Echocardiography", "Echo"], "心臟超音波", "Echocardiography, Echo", "影像檢查", "心臟血管檢查", 3602),
}


def normalize_name(value):
    return "".join(ch.lower() for ch in value.strip() if ch.isalnum())


ALIAS_INDEX = {}
for canonical, data in LAB_MAPPING.items():
    for alias in [canonical, *data["aliases"]]:
        ALIAS_INDEX[normalize_name(alias)] = canonical


def lookup_item(name):
    canonical = ALIAS_INDEX.get(normalize_name(name))
    return (canonical, LAB_MAPPING[canonical]) if canonical else (None, None)
