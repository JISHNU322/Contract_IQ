import psycopg2

conn = psycopg2.connect(
    dbname="contractiq_db",
    user="contractiq",
    password="devpassword",
    host="localhost",
    port="5432"
)
print("Connected:", conn)
conn.close()