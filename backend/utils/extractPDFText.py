import sys
import os
from pypdf import PdfReader

PDF_PATH = "/Users/dakshparekh/Downloads/19 Academic IELTS.pdf"
OUTPUT_PATH = "/Users/dakshparekh/.gemini/antigravity-ide/brain/fdb31453-5ce8-4a14-80c4-babdca48fde1/cam19_text.txt"

def extract_text():
    print(f"Reading PDF from: {PDF_PATH}")
    if not os.path.exists(PDF_PATH):
        print(f"Error: PDF file does not exist at {PDF_PATH}")
        return

    try:
        reader = PdfReader(PDF_PATH)
        num_pages = len(reader.pages)
        print(f"Found {num_pages} pages in PDF.")

        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text()
                f.write(f"\n--- PAGE {i+1} ---\n")
                f.write(page_text)
                
        print(f"Successfully extracted text to: {OUTPUT_PATH}")
    except Exception as e:
        print(f"Exception during extraction: {e}")

if __name__ == "__main__":
    extract_text()
