"""Extract reference text for each playbook from the official PDF.

Output goes to playbooks/extracted/<slug>.md. It is a faithful-but-rough
transcription (bold/italic from the font runs, headings from font size,
checkboxes and bullets marked) for checking the hand-edited files in
playbooks/md against the book. It does not overwrite those files.

Usage: python scripts/extract_playbooks_from_pdf.py
"""

import re
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / "Monster-of-the-Week-Revised-Playbooks-Formfillable.pdf"
OUTPUT_DIR = ROOT / "playbooks" / "extracted"

# Two pages per playbook, in this order; slugs match the files in playbooks/md
SLUGS = [
    "the-chosen", "the-crooked", "the-divine", "the-expert", "the-flake", "the-initiate",
    "the-monstrous", "the-mundane", "the-professional", "the-spellslinger", "the-spooky",
    "the-wronged",
]

CHECKBOX_FONT = "FateCoreGlyphs"
TITLE_FONT = "3rdMan"
HEADING_SIZE = 11  # section headings are 12pt, body text 9.5pt
# Words hyphenated at a line break whose hyphen is real (others are re-joined)
KEEP_HYPHEN = {"non-descript", "spell-casting"}
LABEL_RE = re.compile(r"^\*\*[^*]+:\*\*$")
QUOTES = str.maketrans({"‘": "'", "’": "'", "“": '"', "”": '"'})


def page_runs(page):
    """Return (x, y, size, font, text) for each text run, in content-stream order."""
    runs = []

    def visit(text, cm, tm, font_dict, font_size):
        # pypdf also reports bare "\n" runs; position is all we need for line breaks
        if not text.strip("\n"):
            return
        font = (font_dict or {}).get("/BaseFont", "")
        if tm[0] == 1 and tm[4] == 0 and tm[5] == 0 and runs:
            # some runs come through with an identity matrix: they continue the previous run
            x, y, size = runs[-1][0] + 1, runs[-1][1], runs[-1][2]
        else:
            x = tm[4] * cm[0] + tm[5] * cm[2] + cm[4]
            y = tm[4] * cm[1] + tm[5] * cm[3] + cm[5]
            size = abs(tm[0] * font_size * cm[0])
        runs.append((x, y, size, font, text.replace("\n", " ")))

    page.extract_text(visitor_text=visit)
    return runs


def wrap(text, bold, italic):
    """Wrap text in markdown emphasis, keeping surrounding spaces outside."""
    if not text.strip() or not (bold or italic):
        return text
    lead = text[: len(text) - len(text.lstrip())]
    trail = text[len(text.rstrip()):]
    mark = "***" if bold and italic else "**" if bold else "*"
    return f"{lead}{mark}{text.strip()}{mark}{trail}"


def page_lines(page):
    """Group runs into visual lines: dicts with x, y, kind and markdown text."""
    lines = []
    for x, y, size, font, text in page_runs(page):
        if not text.strip():
            if lines and lines[-1]["parts"]:
                lines[-1]["parts"].append(" ")
            continue
        if not lines or abs(y - lines[-1]["y"]) > 2 or x < lines[-1]["x_last"] - 30:
            lines.append({"x": x, "y": y, "kind": "text", "parts": []})
        line = lines[-1]
        line["x_last"] = x
        style = font.split("-")[-1]
        if CHECKBOX_FONT in font:
            boxes = text.strip()
            if len(boxes) == 1 and not line["parts"]:
                line["kind"] = "item"
                line["parts"].append("- [ ] " if boxes == "b" else "- [x] ")
            else:
                line["parts"].append(f" [{boxes}] ")
        elif TITLE_FONT in font:
            line["kind"] = "title"
            line["parts"].append(text)
        else:
            bold = "Bold" in style
            if bold and size >= HEADING_SIZE and not line["parts"]:
                line["kind"] = "heading"
            if text.lstrip().startswith("•") and not line["parts"]:
                line["kind"] = "item"
                text = "- " + text.lstrip()[1:].lstrip()
            line["parts"].append(wrap(text, bold, "It" in style))
    for line in lines:
        text = "".join(line["parts"]).translate(QUOTES)
        text = re.sub(r"\*\*(\s*)\*\*", r"\1", text)  # merge adjacent bold runs
        text = re.sub(r"(?<=\S)(\*+) ([,.;:])", r"\1\2", text)  # "**read** ," -> "**read**,"
        line["text"] = re.sub(r" {2,}", " ", text).strip()
    return [l for l in lines if l["text"]]


def join_lines(lines):
    """Merge wrapped lines into blocks (paragraphs, list items, headings)."""
    blocks = []
    box_x = None  # x of the latest checkbox item, to spot bullets nested under it
    last = None  # the previous line
    for line in lines:
        text = line["text"]
        kind = line["kind"]
        block = blocks[-1] if blocks else None
        if kind == "heading":
            text = "## " + text.strip("*")
        elif kind == "title":
            text = "# " + text
        if block is None or kind != "text" or block["kind"] in ("heading", "title"):
            new_block = True
        elif LABEL_RE.match(text) or LABEL_RE.match(last["text"]):
            new_block = True  # a whole-line bold label, e.g. "Bases:"
        elif abs(last["y"] - line["y"]) > 16:  # vertical gap, or a new column
            new_block = True
        elif block["kind"] == "item":
            # item continuation lines hang to the right of the box/bullet
            new_block = line["x"] <= block["x"] + 2
        else:
            new_block = line["x"] > last["x"] + 4  # first-line indent starts a paragraph
        if new_block:
            if kind == "item" and text.startswith("- ["):
                box_x = line["x"]
            elif kind == "item" and box_x is not None and line["x"] > box_x + 15:
                text = "\t" + text
            elif kind != "item":
                box_x = None
            blocks.append({"text": text, "kind": kind, "x": line["x"]})
        elif re.search(r"[a-z] ?-(\*\*)?$", block["text"]) and re.match(r"(\*\*)?[a-z]", text):
            # re-join a word hyphenated across lines, including inside bold
            joined = re.sub(r" -(\*\*)?$", r"-\1", block["text"])
            head = re.search(r"[\w'-]+(?=(\*\*)?$)", joined).group(0)
            tail = re.match(r"(\*\*)?([\w'-]+)", text).group(2)
            if head + tail in KEEP_HYPHEN:
                block["text"] = joined + text
            elif joined.endswith("**") and text.startswith("**"):
                block["text"] = joined[:-3] + text[2:]
            else:
                block["text"] = joined[:-1] + text
        elif block["text"].endswith("**") and text.startswith("**"):
            block["text"] = block["text"][:-2] + " " + text[2:]  # bold run across lines
        else:
            block["text"] += " " + text
        last = line
    return blocks


def render(blocks):
    """Blocks to markdown: tight lists, and a col-break wherever the column changes."""
    out = []
    prev = None
    for block in blocks:
        if prev is not None:
            if abs(block["x"] - prev["x"]) > 150:
                out.append('\n\n<span class="col-break"></span>\n\n')
            elif block["kind"] == "item" and prev["kind"] == "item":
                out.append("\n")
            else:
                out.append("\n\n")
        out.append(block["text"])
        prev = block
    return "".join(out)


def main():
    reader = PdfReader(str(PDF_PATH))
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for index, slug in enumerate(SLUGS):
        parts = []
        for page_number in (index * 2 + 1, index * 2 + 2):
            blocks = join_lines(page_lines(reader.pages[page_number - 1]))
            parts.append(f"<!-- PDF page {page_number} -->\n\n" + render(blocks))
        path = OUTPUT_DIR / f"{slug}.md"
        path.write_text("\n\n".join(parts) + "\n", encoding="utf-8")
        print(f"Wrote {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
