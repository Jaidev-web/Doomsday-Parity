from typing import Optional
import io


class DocumentService:
    def extract_text(self, file_bytes: bytes, content_type: str) -> str:
        """Extract text from a file based on its content type."""
        if "pdf" in content_type:
            return self._extract_pdf(file_bytes)
        elif "docx" in content_type or "word" in content_type:
            return self._extract_docx(file_bytes)
        elif "text" in content_type:
            return file_bytes.decode("utf-8", errors="replace")
        return "[Unsupported file type for text extraction]"

    def _extract_pdf(self, file_bytes: bytes) -> str:
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            text = ""
            for page in reader.pages:
                text += (page.extract_text() or "") + "\n"
            return text.strip() or "[No extractable text found in PDF]"
        except Exception as e:
            return f"[Error extracting PDF: {str(e)}]"

    def _extract_docx(self, file_bytes: bytes) -> str:
        try:
            from docx import Document
            doc = Document(io.BytesIO(file_bytes))
            text = "\n".join(p.text for p in doc.paragraphs)
            return text.strip() or "[No text found in DOCX]"
        except Exception as e:
            return f"[Error extracting DOCX: {str(e)}]"

    def get_file_info(self, file_bytes: bytes, filename: str) -> dict:
        return {
            "filename": filename,
            "size_bytes": len(file_bytes),
            "size_kb": round(len(file_bytes) / 1024, 2),
        }


document_service = DocumentService()
