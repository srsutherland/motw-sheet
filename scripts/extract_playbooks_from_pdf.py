from __future__ import annotations

import re
from pathlib import Path
from typing import Iterable, List

from PyPDF2 import PdfReader

PDF_PATH = Path("Monster-of-the-Week-Revised-Playbooks-Formfillable.pdf")
OUTPUT_DIR = Path("playbooks") / "md"
PAGES_PER_PLAYBOOK = 2
SKIP_SLUGS = {"the-spell-slinger"}

SECTION_HEADINGS = {
    "Luck",
    "Harm",
    "Experience",
    "Combat Magic",
    "Moves",
    "Gear",
    "Getting Started",
    "Introductions",
    "History",
    "Leveling Up",
    "Improvements",
    "Advanced Improvements",
}

BULLET_RE = re.compile(r"^(?:[b•�]|\u2022)\s+")
HYPHEN_BREAK_RE = re.compile(r"([A-Za-z])-(\n)([A-Za-z])")
SPECIAL_RE = re.compile(r"^(.*?special)\s*:\s*(.*)$", re.IGNORECASE)


def slugify(title: str) -> str:
    title = title.strip().lower()
    title = re.sub(r"[^a-z0-9]+", "-", title)
    return title.strip("-")


def extract_title(lines: List[str]) -> str | None:
    for line in lines[:15]:
        clean = line.strip()
        if clean.lower().startswith("the "):
            return clean
    return None


def normalize_text(text: str) -> str:
    text = HYPHEN_BREAK_RE.sub(r"\1\3", text)
    return text


def to_markdown_lines(text: str, title: str | None) -> List[str]:
    lines = [line.rstrip() for line in text.splitlines()]
    output: List[str] = []
    used_title = False

    for raw in lines:
        line = raw.strip()
        if not line:
            if output and output[-1] != "":
                output.append("")
            continue

        if title and not used_title and line == title:
            output.append(f"# {title}")
            output.append("")
            used_title = True
            continue

        if line in SECTION_HEADINGS:
            output.append(f"## {line}")
            output.append("")
            continue

        special_match = SPECIAL_RE.match(line)
        if special_match:
            label, rest = special_match.groups()
            output.append(f"**{label.title()}:** {rest}")
            output.append("")
            continue

        if BULLET_RE.match(line):
            line = BULLET_RE.sub("", line)
            line = re.sub(r"\s+:", ":", line)
            output.append(f"- [ ] {line}")
            continue

        output.append(line)

    while output and output[-1] == "":
        output.pop()

    return output


def split_pages(reader: PdfReader) -> Iterable[tuple[int, int]]:
    for start in range(0, len(reader.pages), PAGES_PER_PLAYBOOK):
        end = min(start + PAGES_PER_PLAYBOOK - 1, len(reader.pages) - 1)
        yield start, end


def build_playbook_markdown(page_texts: List[str]) -> str:
    first_lines = page_texts[0].splitlines()
    title = extract_title(first_lines) or "Playbook"

    pages_md: List[str] = []
    for idx, text in enumerate(page_texts):
        normalized = normalize_text(text)
        lines = to_markdown_lines(normalized, title if idx == 0 else None)
        page_md = ["<div class=\"page\">", ""] + lines + ["", "</div>"]
        pages_md.append("\n".join(page_md))

    return "\n".join(pages_md)


def main() -> None:
    reader = PdfReader(str(PDF_PATH))
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for start, end in split_pages(reader):
        page_texts = []
        for i in range(start, end + 1):
            page_texts.append(reader.pages[i].extract_text() or "")

        title = extract_title(page_texts[0].splitlines()) or f"Playbook-{start}"
        slug = slugify(title)
        if slug in SKIP_SLUGS:
            continue

        md_content = build_playbook_markdown(page_texts)
        output_path = OUTPUT_DIR / f"{slug}.md"
        output_path.write_text(md_content, encoding="utf-8")
        print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
