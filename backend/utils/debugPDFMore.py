from pypdf import PdfReader
import os

PDF_PATH = "/Users/dakshparekh/Downloads/19 Academic IELTS.pdf"

def inspect_pages():
    print(f"Reading PDF from: {PDF_PATH}")
    if not os.path.exists(PDF_PATH):
        print("PDF does not exist.")
        return

    reader = PdfReader(PDF_PATH)
    print(f"Total pages: {len(reader.pages)}")

    for p_idx in [32, 33, 34, 35, 54, 55, 56, 57]:
        page = reader.pages[p_idx]
        text = page.extract_text()
        print(f"Page {p_idx+1} length: {len(text)}")
        if text:
            print(f"Snippet of Page {p_idx+1}: {repr(text[:200])}")
        else:
            print(f"Page {p_idx+1} is empty.")

inspect_pages()
