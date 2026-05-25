#!/usr/bin/env python3
"""
Import agencies from a semicolon-delimited CSV into Neo4j (neo4j-driver v5+).
CSV header: Id;Name;ParentId;Depth;Classification;Jurisdiction
"""

import csv
import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

# CONFIG
load_dotenv()
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER")
NEO4J_PASS = os.getenv("NEO4J_PASS")
CSV_PATH = "../data/resolved_mappings.csv"
BATCH_SIZE = 500

print(NEO4J_USER, NEO4J_PASS)

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))

def ensure_constraints(tx):
    tx.run(
        "CREATE CONSTRAINT IF NOT EXISTS FOR (a:Agency) REQUIRE a.id IS UNIQUE"
    )

def import_batch(tx, rows):
    query = """
    UNWIND $rows AS r
    MERGE (child:Agency {id: r.Id})
      ON CREATE SET child.name = r.Name
      ON MATCH SET child.name = coalesce(child.name, r.Name)
    WITH child, r
    WHERE r.ParentId IS NOT NULL AND r.ParentId <> ''
    MERGE (parent:Agency {id: r.ParentId})
    MERGE (parent)-[:PARENT_OF]->(child)
    """
    tx.run(query, rows=rows)

def read_csv_in_batches(path, batch_size=BATCH_SIZE):
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        batch = []
        for row in reader:
            entry = {
                "Id": row.get("Id", "").strip(),
                "Name": row.get("Name", "").strip() if row.get("Name") else None,
                "ParentId": format(float(row.get("ParentId", "")), "g") if row.get("ParentId") else None,
            }
            print(entry)
            if not entry["Id"]:
                print("Row without id. Skipping...")
                continue
            batch.append(entry)
            if len(batch) >= batch_size:
                yield batch
                batch = []
        if batch:
            yield batch

def main():
    with driver.session() as session:
        # use execute_write for v5+ drivers
        session.execute_write(lambda tx: ensure_constraints(tx))
        for batch in read_csv_in_batches(CSV_PATH, BATCH_SIZE):
            session.execute_write(lambda tx, rows=batch: import_batch(tx, rows))
    driver.close()
    print("Import finished.")

if __name__ == "__main__":
    main()
