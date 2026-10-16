from __future__ import annotations

from pathlib import Path

from markdown_it import MarkdownIt
from mdit_py_plugins.tasklists import tasklists_plugin


def convert_markdown_to_html(
    input_path: Path,
    output_path: Path,
    title: str,
) -> None:
    text = input_path.read_text(encoding="utf-8")
    md = (
        MarkdownIt("commonmark")
        .use(tasklists_plugin, enabled=True)
    )
    body = md.render(text)
    html = f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>{title}</title>
  <link rel=\"stylesheet\" href=\"md_playbook.css\" />
</head>
<body>
{body}
</body>
</html>
"""
    output_path.write_text(html, encoding="utf-8")


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    output_dir = repo_root / "playbooks" / "html"
    output_dir.mkdir(parents=True, exist_ok=True)
    for input_path in sorted((repo_root / "playbooks" / "md").glob("*.md")):
        title = next(
            line[2:] for line in input_path.read_text(encoding="utf-8").splitlines()
            if line.startswith("# ")
        )
        output_path = output_dir / f"{input_path.stem}.html"
        convert_markdown_to_html(input_path, output_path, title)
        print(f"Wrote {output_path.relative_to(repo_root)}")


if __name__ == "__main__":
    main()
