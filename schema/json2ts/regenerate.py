#!/usr/bin/env python3
"""Regenerate TypeScript declarations for the schemas in the parent folder.

Writes one <name>.schema.d.ts per schema, plus index.d.ts, into this folder, via
json-schema-to-typescript (npx). Usage: py regenerate.py
"""
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCHEMA_DIR = HERE.parent
TS_DIR = HERE
REPO_ROOT = HERE.parent
VERBOSE = True


def verbose(msg):
    if VERBOSE:
        print(msg)


def run(*cmd):
    subprocess.run([str(c) for c in cmd], check=True)


def schema_files():
    files = sorted(SCHEMA_DIR.glob("*.schema.json"))
    if not files:
        sys.exit(f"No *.schema.json files in {SCHEMA_DIR}")
    return files


def ts_name(title):
    """json2ts's toSafeString (utils.js): how a title becomes a type name."""
    s = re.sub(r"(^\s*[^a-zA-Z_$])|([^a-zA-Z_$\d])", " ", title)
    s = re.sub(r"^_[a-z]", lambda m: m[0].upper(), s)
    s = re.sub(r"_[a-z]", lambda m: m[0][1:].upper(), s)
    s = re.sub(r"[\d$]+[a-zA-Z]", lambda m: m[0].upper(), s)
    s = re.sub(r"\s+([a-zA-Z])", lambda m: m[1].upper(), s)
    s = re.sub(r"^\d+", "", re.sub(r"\s", "", s))
    return s[:1].upper() + s[1:]


def regenerate_ts():
    verbose(f"Repo root: {REPO_ROOT}")
    verbose(f"Running from: {TS_DIR}")
    npx = shutil.which("npx")  # finds npx.cmd on Windows
    if not npx:
        sys.exit("npx not found; install Node.js")

    owner = {}  # type name -> output module ("common.schema") that declares it
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        properties = {}
        for f in schema_files():
            verbose(f"Processing: {f.relative_to(REPO_ROOT)}")
            module = f.name.removesuffix(".json")
            schema = json.loads(f.read_text(encoding="utf-8"))
            # json2ts only names a $def after its key when the def is in the root file
            # being compiled, or is an object/array; strings and unions in other files
            # get inlined. A title always names it, so give each untitled def its key.
            for key, definition in schema.get("$defs", {}).items():
                if isinstance(definition, dict):
                    definition.setdefault("title", key)
                    owner[ts_name(definition["title"])] = module
            (tmp / f.name).write_text(json.dumps(schema, indent=2), encoding="utf-8")
            # common.schema.json has only $defs; its types come in through refs.
            if "properties" in schema:
                if "title" in schema:
                    owner[ts_name(schema["title"])] = module
                key = f.name.removesuffix(".schema.json").replace("-", "_")
                properties[key] = {"$ref": f.name}

        # json2ts compiles one root at a time and re-declares everything it reaches, so
        # compile an index that $refs each root schema into a single file, then split it.
        index_file = tmp / "index.json"
        index_file.write_text(json.dumps({
            "title": "Index",
            "type": "object",
            "properties": properties,
        }, indent=2), encoding="utf-8")
        combined = tmp / "combined.d.ts"

        json2ts_args = [
            "-i", index_file.as_posix(),
            "--cwd", tmp.as_posix(),
            "-o", combined.as_posix(),
            "--no-additionalProperties"
        ]
        # Forward slashes: json2ts treats -i as a glob, where \ is an escape character.
        run(npx, "--yes", "--package=json-schema-to-typescript@16", "json2ts", *json2ts_args)
        text = combined.read_text(encoding="utf-8")

    # json2ts has no option for blank lines between declarations: add one before each
    # top-level doc comment or export (unless it directly follows a doc comment).
    text = re.sub(r"(?m)(?<! \*/\n)^(?=export |/\*\*)", "\n", text)
    banner, *chunks = re.split(r"\n\n+(?=/\*\*|export )", text.strip())

    def names_used(decls):
        """Type names used in code (not comments, string literals or declared names)."""
        code = re.sub(r'/\*[\s\S]*?\*/|"(?:[^"\\]|\\.)*"|export (?:type|interface) \w+',
                      "", "\n".join(decls))
        return set(re.findall(r"\b[A-Z]\w*\b", code))

    # Sort declarations into modules. Duplicates json2ts made from a description beside
    # a $ref (Timestamp1, Playbook1) go with the original's module, or are dropped if
    # nothing uses them.
    named = [(re.search(r"^export (?:type|interface) (\w+)", c, re.M)[1], c) for c in chunks]
    named = [(n, c) for n, c in named if n != "Index"]
    used = names_used(c for _, c in named)
    modules = {}
    declared = {}  # name -> module
    for name, chunk in named:
        if re.search(r"\d$", name) and name not in used:
            continue
        module = owner.get(name) or owner.get(re.sub(r"\d+$", "", name))
        if module is None:
            print(f"warning: no schema owns {name}; putting it in misc.d.ts")
            module = "misc"
        modules.setdefault(module, []).append(chunk)
        declared[name] = module

    TS_DIR.mkdir(parents=True, exist_ok=True)
    for old in TS_DIR.glob("*.d.ts"):
        old.unlink()
    for module, decls in modules.items():
        imports = {}
        for name in sorted(names_used(decls)):
            if declared.get(name, module) != module:
                imports.setdefault(declared[name], []).append(name)
        import_lines = [f'import type {{ {", ".join(names)} }} from "./{source}";'
                        for source, names in sorted(imports.items())]
        parts = [banner] + (["\n".join(import_lines)] if import_lines else []) + decls
        out = TS_DIR / f"{module}.d.ts"
        out.write_text("\n\n".join(parts) + "\n", encoding="utf-8", newline="\n")
        verbose(f"Wrote {out.relative_to(REPO_ROOT)}")

    index = "".join(f'export * from "./{m}";\n' for m in sorted(modules))
    (TS_DIR / "index.d.ts").write_text(index, encoding="utf-8", newline="\n")
    verbose(f"Wrote {(TS_DIR / 'index.d.ts').relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    try:
        regenerate_ts()
    except subprocess.CalledProcessError as e:
        sys.exit(f"Failed (exit code {e.returncode}): {' '.join(e.cmd)}")