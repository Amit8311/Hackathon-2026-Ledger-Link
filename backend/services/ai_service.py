import json
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from google import genai
from google.genai import types
from PIL import Image

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))

EXTRACTION_PROMPT = """You are a financial document parser. Extract structured data from this invoice/bill.

Return ONLY a valid JSON object with these fields (use null if not found):
{
  "vendor_name": "string",
  "invoice_number": "string",
  "invoice_date": "YYYY-MM-DD",
  "amount": number,
  "tax_amount": number,
  "total_amount": number,
  "description": "brief description of goods/services",
  "transaction_type": "purchase_invoice | sales_invoice | payment | salary_register | bank_statement | ledger"
}

Be precise with numbers. Extract only what is clearly visible."""


def extract_invoice_data(file_path: str) -> dict:
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        return _extract_from_image(file_path)
    elif suffix == ".pdf":
        return _extract_from_pdf(file_path)
    else:
        return {"error": "Unsupported file type"}


def _extract_from_image(file_path: str) -> dict:
    try:
        image = Image.open(file_path)
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=[EXTRACTION_PROMPT, image],
        )
        return _parse_ai_response(response.text)
    except Exception as e:
        return {"error": str(e)}


def _extract_from_pdf(file_path: str) -> dict:
    try:
        import PyPDF2
        text = ""
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() or ""

        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=f"{EXTRACTION_PROMPT}\n\nDocument text:\n{text[:4000]}",
        )
        return _parse_ai_response(response.text)
    except Exception as e:
        return {"error": str(e)}


def _parse_ai_response(raw_text: str) -> dict:
    try:
        start = raw_text.find("{")
        end = raw_text.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(raw_text[start:end])
    except json.JSONDecodeError:
        pass
    return {"raw_text": raw_text, "parse_error": True}
