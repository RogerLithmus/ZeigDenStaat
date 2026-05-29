"""Quick dump of PDF text to understand structure."""
import pdfplumber

pdf_path = r"c:\Projects\ZeigDenStaat\ressourcen\WD-3-118-24-pdf.pdf"

with pdfplumber.open(pdf_path) as pdf:
    print(f"Total pages: {len(pdf.pages)}")
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        print(f"\n{'='*80}")
        print(f"PAGE {i+1}")
        print(f"{'='*80}")
        if text:
            print(text)
        else:
            print("[No text extracted]")
