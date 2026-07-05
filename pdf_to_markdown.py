#!/usr/bin/env python3
import argparse
import re
import sys
from pathlib import Path


def extract_text_from_pdf(pdf_path: Path) -> str:
    try:
        import fitz  # type: ignore
    except ImportError:
        try:
            from pypdf import PdfReader  # type: ignore
        except ImportError as exc:
            raise RuntimeError("请先安装 fitz 或 pypdf") from exc

        reader = PdfReader(str(pdf_path))
        pages = []
        for page in reader.pages:
            text = page.extract_text() or ""
            pages.append(text)
        return "\n".join(pages)

    doc = fitz.open(str(pdf_path))
    try:
        pages = []
        for page in doc:
            pages.append(page.get_text("text"))
        return "\n".join(pages)
    finally:
        doc.close()


def looks_like_formula(line: str) -> bool:
    s = line.strip()
    if not s:
        return False

    if s.startswith("$$") or s.endswith("$$"):
        return True

    if re.search(r'\\(frac|sum|int|alpha|beta|gamma|delta|sqrt|left|right|cdot|quad|rightarrow|rightarrow|begin|end)', s):
        return True

    if re.search(r'[α-ωΑ-Ω∑∫√∞≤≥≠≈≡]', s):
        return True

    if re.search(r'[_^]', s) and re.search(r'[A-Za-z]', s):
        return True

    if "=" in s and len(s) > 2 and not re.search(r'[。！？]', s):
        return True

    return False


def clean_line(line: str) -> str:
    line = line.replace("\u00a0", " ")
    line = re.sub(r"\s+", " ", line).strip()
    return line


def to_markdown(text: str) -> str:
    blocks = []
    paragraph = []

    for raw in text.splitlines():
        line = clean_line(raw)
        if not line:
            if paragraph:
                blocks.append(" ".join(paragraph))
                paragraph = []
            continue

        if looks_like_formula(line):
            if paragraph:
                blocks.append(" ".join(paragraph))
                paragraph = []
            blocks.append(f"$$\n{line}\n$$")
        else:
            paragraph.append(line)

    if paragraph:
        blocks.append(" ".join(paragraph))

    return "\n\n".join(blocks)


def main() -> int:
    parser = argparse.ArgumentParser(description="把 PDF 转成 Markdown，并尽量保留公式格式")
    parser.add_argument("input_pdf", help="输入 PDF 文件")
    parser.add_argument("output_md", nargs="?", help="输出 Markdown 文件，默认和 PDF 同名")
    args = parser.parse_args()

    input_pdf = Path(args.input_pdf)
    if not input_pdf.exists():
        print(f"输入文件不存在: {input_pdf}", file=sys.stderr)
        return 1

    if input_pdf.suffix.lower() != ".pdf":
        print("请提供 .pdf 文件", file=sys.stderr)
        return 1

    output_md = Path(args.output_md) if args.output_md else input_pdf.with_suffix(".md")

    try:
        raw_text = extract_text_from_pdf(input_pdf)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    markdown_text = to_markdown(raw_text)
    output_md.write_text(markdown_text, encoding="utf-8")
    print(f"已生成: {output_md}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())