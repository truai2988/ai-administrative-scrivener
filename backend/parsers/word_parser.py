"""
Word パーサー

python-docx を用いてWordファイル（.docx）からテキストと表データを抽出する。
段落、表、ヘッダー/フッターの情報を保持する。
"""

import io
import logging

import docx

logger = logging.getLogger(__name__)


def extract_word_text(file_bytes: bytes, filename: str) -> str:
    """
    Wordファイルのバイト列を受け取り、構造化テキストに変換する。

    - 段落テキストをそのまま出力
    - 表データを行ごとに「|」区切りで出力
    - ヘッダー/フッターも抽出
    """
    try:
        document = docx.Document(io.BytesIO(file_bytes))
    except Exception as e:
        logger.error(f"python-docx でのファイル読み込みに失敗: {filename} - {e}")
        return f"=== ファイル: {filename} (読み込みエラー) ===\n"

    sections: list[str] = [f"=== ファイル: {filename} ===\n"]

    # ヘッダー抽出
    for section in document.sections:
        header = section.header
        if header and header.paragraphs:
            header_text = " ".join(p.text.strip() for p in header.paragraphs if p.text.strip())
            if header_text:
                sections.append(f"[ヘッダー] {header_text}")

    # 本文の段落と表を出現順に処理
    for element in document.element.body:
        tag = element.tag.split("}")[-1]  # 名前空間を除去

        if tag == "p":
            # 段落
            para = docx.oxml.ns.qn("w:p")
            if element.tag == para or tag == "p":
                text = element.text or ""
                # python-docx の Paragraph オブジェクトから取得
                for para_obj in document.paragraphs:
                    if para_obj._element is element:
                        text = para_obj.text.strip()
                        break
                if text:
                    sections.append(f"  {text}")

        elif tag == "tbl":
            # 表
            sections.append("\n  [表]")
            for table in document.tables:
                if table._element is element:
                    for row in table.rows:
                        cells = [cell.text.strip() for cell in row.cells]
                        sections.append(f"    {' | '.join(cells)}")
                    sections.append("")
                    break

    # フッター抽出
    for section in document.sections:
        footer = section.footer
        if footer and footer.paragraphs:
            footer_text = " ".join(p.text.strip() for p in footer.paragraphs if p.text.strip())
            if footer_text:
                sections.append(f"[フッター] {footer_text}")

    return "\n".join(sections)
