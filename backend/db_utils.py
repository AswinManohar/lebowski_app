import sqlite3
import os
from contextlib import contextmanager

DB_PATH = "stopwatch.db"

def init_db():
    # Create database directory if it doesn't exist
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Create tables if they don't exist
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS time_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            elapsed_time REAL NOT NULL,
            formatted_time TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            thought TEXT
        )
        ''')
        conn.commit()

@contextmanager
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def export_thoughts_to_csv(output_path="thoughts.csv"):
    """Export all thoughts to a CSV file"""
    import csv
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT timestamp, formatted_time, thought 
            FROM time_records 
            WHERE thought IS NOT NULL
            ORDER BY timestamp
        """)
        
        rows = cursor.fetchall()
        
        with open(output_path, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['Timestamp', 'Duration', 'Thought'])
            
            for row in rows:
                writer.writerow([row['timestamp'], row['formatted_time'], row['thought']])
    
    return output_path 