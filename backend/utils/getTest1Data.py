TXT_PATH = "/Users/dakshparekh/.gemini/antigravity-ide/brain/fdb31453-5ce8-4a14-80c4-babdca48fde1/cam19_text.txt"

def get_test_1():
    with open(TXT_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    pages = content.split("--- PAGE ")
    
    # Search each page for Listening Test 1 answers
    print("Searching for answer keys...")
    for idx, p in enumerate(pages):
        if "hinchingbrooke" in p.lower() and ("answers" in p.lower() or "key" in p.lower() or "tapescript" in p.lower() or "audioscript" in p.lower()):
            print(f"Page {idx} contains hinchingbrooke + answers/keys/scripts. Length: {len(p)}")
            lines = p.split("\n")
            print("\n".join(lines[:30]))
            print("====================================")

    # Let's search generally for 'listening answers' or 'test 1'
    for idx, p in enumerate(pages):
        if "test 1" in p.lower() and "listening" in p.lower() and ("answer key" in p.lower() or "answers" in p.lower()):
            print(f"Page {idx} contains 'test 1 listening answers/key'. Length: {len(p)}")
            lines = p.split("\n")
            print("\n".join(lines[:30]))
            print("====================================")

if __name__ == "__main__":
    get_test_1()
