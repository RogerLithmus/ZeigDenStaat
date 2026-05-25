import os
from pypdf import PdfReader

pdf_dir = r"C:\Projects\ZeigDenStaat\ressourcen"
pdfs = ["Dienstreisen_Behoerden.pdf", "WD-3-118-24-pdf.pdf", "uebersicht-stiftungen.pdf"]

print("=== ANALYZING PDF FILES ===")
for pdf_name in pdfs:
    pdf_path = os.path.join(pdf_dir, pdf_name)
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        continue
    
    try:
        reader = PdfReader(pdf_path)
        num_pages = len(reader.pages)
        print(f"\nFile: {pdf_name}")
        print(f"Pages: {num_pages}")
        
        # Read first page
        first_page_text = reader.pages[0].extract_text()
        print("First page text (first 600 chars):")
        print("-" * 50)
        print(first_page_text[:600])
        print("-" * 50)
        
        # If there are multiple pages, look at page 2 as well
        if num_pages > 1:
            second_page_text = reader.pages[1].extract_text()
            print("Second page text (first 300 chars):")
            print(second_page_text[:300])
            print("-" * 50)
            
    except Exception as e:
        print(f"Error reading {pdf_name}: {e}")
