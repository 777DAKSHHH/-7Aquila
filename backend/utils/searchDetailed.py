import re

TXT_PATH = "/Users/dakshparekh/.gemini/antigravity-ide/brain/fdb31453-5ce8-4a14-80c4-babdca48fde1/cam19_text.txt"

def search():
    with open(TXT_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    pages = content.split("--- PAGE ")
    print(f"Total pages: {len(pages)}")

    # Let's search for Hinchingbrooke in the transcripts
    # Hinchingbrooke is Q1-10 in Test 1. Let's find all occurrences of 'Hinchingbrooke'
    h_pages = []
    for idx, p in enumerate(pages):
        if "hinchingbrooke" in p.lower():
            h_pages.append(idx)
    print(f"Occurrences of 'Hinchingbrooke': pages {h_pages}")

    # Let's find occurrences of 'Stanthorpe'
    s_pages = []
    for idx, p in enumerate(pages):
        if "stanthorpe" in p.lower():
            s_pages.append(idx)
    print(f"Occurrences of 'Stanthorpe': pages {s_pages}")

    # Let's find occurrences of 'Listening' + 'Answer'
    ans_pages = []
    for idx, p in enumerate(pages):
        if "listening" in p.lower() and "answers" in p.lower() and ("test 1" in p.lower() or "test 2" in p.lower()):
            ans_pages.append(idx)
    print(f"Possible Answer pages: {ans_pages}")

    # Print first few lines of page 4 which matched 'Audioscripts'
    if len(pages) > 4:
        print("\n--- Page 4 start ---")
        print("\n".join(pages[4].split("\n")[:15]))

if __name__ == "__main__":
    search()
