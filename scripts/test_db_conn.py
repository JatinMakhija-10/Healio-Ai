import os, psycopg2
from dotenv import load_dotenv
load_dotenv('.env.local')

# Build connection from individual parts to avoid URL parsing issues
host = "db.jqtfqseimrqusumznnpv.supabase.co"  # direct DB host (not pooler)
port = 5432
dbname = "postgres"
user = "postgres"
password = os.getenv('SUPABASE_DB_PASSWORD', '')

print(f'Connecting to {host}:{port} ...', flush=True)
conn = psycopg2.connect(
    host=host, port=port, dbname=dbname, user=user, password=password,
    connect_timeout=20, options='-c statement_timeout=0'
)
cur = conn.cursor()
cur.execute("SELECT COUNT(*) FROM ayurvedic_knowledge_embeddings WHERE source = 'PlanetAyurveda'")
count = cur.fetchone()[0]
print(f'PlanetAyurveda rows: {count:,}', flush=True)
cur.close()
conn.close()
print('Connection OK', flush=True)
