import sys
import re

TXT_PATH = "/Users/dakshparekh/.gemini/antigravity-ide/brain/fdb31453-5ce8-4a14-80c4-babdca48fde1/cam19_text.txt"

def search():
    with open(TXT_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    pages = content.split("--- PAGE ")
    print(f"Total pages parsed: {len(pages)}")

    keywords = [
        "Hinchingbrooke Country Park",
        "Stanthorpe Twinning Association",
        "Farley House",
        "touch-sensitive sensors",
        "Listening Test 2",
        "Listening Test 3",
        "Listening Test 4",
        "Audioscripts",
        "Listening Answer Keys",
        "Test 1, Part 1",
        "Test 2, Part 1",
        "Test 3, Part 1",
    ]

    for kw in keywords:
        found_pages = []
        for p in pages:
            if not p: continue
            lines = p.split("\n")
            page_num_match = re.match(r"^(\d+)", lines[0])
            if page_num_match:
                page_num = page_num_match.group(1)
                page_body = "\n".join(lines[1:])
                if kw.lower() in page_body.lower():
                    found_pages.append(page_num)
        print(f"Keyword '{kw}': found on pages {', '.join(found_pages[:10])}")

if __name__ == "__main__":
    search()
