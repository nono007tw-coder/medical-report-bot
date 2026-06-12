import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from mapping import LAB_MAPPING

target = Path(__file__).resolve().parent / "src" / "mapping.json"
target.write_text(json.dumps(LAB_MAPPING, ensure_ascii=False, indent=2), encoding="utf-8")
print(target)
