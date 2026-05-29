#!/usr/bin/env python3
"""
Import agencies from an Excel file into Neo4j (neo4j-driver v5+).
Reads data from data/Bundesbehörden_Verzeichnis.xlsx, sheet "🏛️ Bundesbehörden".
"""

import os
import openpyxl
from neo4j import GraphDatabase
from dotenv import load_dotenv

# CONFIG
script_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(script_dir, ".env"))

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER")
NEO4J_PASS = os.getenv("NEO4J_PASS")
EXCEL_PATH = os.path.abspath(os.path.join(script_dir, "../data/Bundesbehörden_Verzeichnis.xlsx"))
BATCH_SIZE = 500

print(f"Connecting to Neo4j at {NEO4J_URI} as user {NEO4J_USER}")

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))

def ensure_constraints(tx):
    tx.run(
        "CREATE CONSTRAINT IF NOT EXISTS FOR (a:Agency) REQUIRE a.id IS UNIQUE"
    )
    tx.run(
        "CREATE CONSTRAINT IF NOT EXISTS FOR (r:Ressort) REQUIRE r.name IS UNIQUE"
    )

def import_batch(tx, rows):
    # 1. Base import of the nodes with properties
    query = """
    UNWIND $rows AS r
    MERGE (child:Agency {id: r.Id})
    SET child.name = r.Name,
        child.ressort = r.Ressort,
        child.classification = r.Classification,
        child.headquarters = r.Headquarters,
        child.employees = r.Employees,
        child.budget = r.Budget,
        child.legal_form = r.LegalForm,
        child.website = r.Website,
        child.comment = r.Comment
    """
    tx.run(query, rows=rows)
    
    # 2. Add classification as additional dynamic label
    by_class = {}
    for r in rows:
        c = r.get("Classification")
        if c:
            by_class.setdefault(c, []).append(r["Id"])
            
    for classification, ids in by_class.items():
        clean_label = classification.replace("`", "").strip()
        if not clean_label:
            continue
        label_query = f"""
        UNWIND $ids AS node_id
        MATCH (child:Agency {{id: node_id}})
        SET child:`{clean_label}`
        """
        tx.run(label_query, ids=ids)

    # 3. Create Ressort nodes and relationships
    ressort_query = """
    UNWIND $rows AS r
    WITH r WHERE r.Ressort IS NOT NULL AND r.Ressort <> ''
    MATCH (child:Agency {id: r.Id})
    MERGE (parent:Ressort {name: r.Ressort})
    MERGE (child)-[:BELONGS_TO]->(parent)
    """
    tx.run(ressort_query, rows=rows)

def read_excel_in_batches(path, batch_size=BATCH_SIZE):
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb["🏛️ Bundesbehörden"]
    
    rows_to_import = []
    
    for row in ws.iter_rows(min_row=9):
        val_id = row[0].value
        if val_id is None:
            continue
        
        try:
            if isinstance(val_id, float):
                agency_id = str(int(val_id))
            else:
                agency_id = str(int(val_id))
        except (ValueError, TypeError):
            agency_id = str(val_id).strip()
            
        if not agency_id:
            continue
            
        name = str(row[1].value).strip() if row[1].value is not None else ""
        ressort = str(row[2].value).strip() if row[2].value is not None else None
        classification = str(row[3].value).strip() if row[3].value is not None else None
        headquarters = str(row[4].value).strip() if row[4].value is not None else None
        
        employees = None
        if row[5].value is not None:
            try:
                employees = int(row[5].value)
            except (ValueError, TypeError):
                pass
                
        budget = None
        if row[6].value is not None:
            try:
                budget = float(row[6].value)
            except (ValueError, TypeError):
                pass
                
        legal_form = str(row[7].value).strip() if row[7].value is not None else None
        website = str(row[8].value).strip() if row[8].value is not None else None
        comment = str(row[9].value).strip() if row[9].value is not None else None
        
        entry = {
            "Id": agency_id,
            "Name": name,
            "Ressort": ressort,
            "Classification": classification,
            "Headquarters": headquarters,
            "Employees": employees,
            "Budget": budget,
            "LegalForm": legal_form,
            "Website": website,
            "Comment": comment,
        }
        rows_to_import.append(entry)
        
    print(f"Total nodes to import: {len(rows_to_import)}")
    
    for i in range(0, len(rows_to_import), batch_size):
        yield rows_to_import[i:i + batch_size]

def main():
    with driver.session() as session:
        session.execute_write(lambda tx: ensure_constraints(tx))
        for batch in read_excel_in_batches(EXCEL_PATH, BATCH_SIZE):
            session.execute_write(lambda tx, rows=batch: import_batch(tx, rows))
    driver.close()
    print("Import finished successfully.")

if __name__ == "__main__":
    main()
