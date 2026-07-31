TXT_PATH = "/Users/dakshparekh/.gemini/antigravity-ide/brain/fdb31453-5ce8-4a14-80c4-babdca48fde1/cam19_text.txt"
import os

def list_structure():
    with open(TXT_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    pages = content.split("--- PAGE ")
    print(f"Total pages: {len(pages)}")

    for idx in range(90, len(pages)):
        p = pages[idx]
        lines = [line.strip() for line in p.split("\n") if line.strip()]
        snippet = " | ".join(lines[:5])
        print(f"Page {idx}: {snippet[:120]}")

if __name__ == "__main__":
    list_structure()
