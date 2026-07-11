"""Applique les migrations SQL et le seed sur la base Supabase.

Utilise pg8000 (driver pur Python) via le pooler de session Supabase.
Lit SUPABASE_DB_PASSWORD dans .env.local. Usage :
  video/.venv/bin/python scripts/apply_migration.py [--seed]
"""

import os
import ssl
import sys

import pg8000.native

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_REF = "mucgtbryctekehwsqajv"
POOLER_HOSTS = [
    "aws-0-eu-west-1.pooler.supabase.com",
    "aws-1-eu-west-1.pooler.supabase.com",
]


def read_env(key):
    with open(os.path.join(BASE, ".env.local")) as fh:
        for line in fh:
            if line.startswith(key + "="):
                return line.strip().split("=", 1)[1]
    raise SystemExit(f"{key} introuvable dans .env.local")


def connect():
    password = read_env("SUPABASE_DB_PASSWORD")
    # Equivalent de sslmode=require (chiffre, sans verification de CA :
    # le pooler Supabase presente une CA propre absente du trust store).
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    last = None
    for host in POOLER_HOSTS:
        try:
            return pg8000.native.Connection(
                user=f"postgres.{PROJECT_REF}", password=password,
                host=host, port=5432, database="postgres", ssl_context=ctx,
                timeout=20)
        except Exception as e:  # noqa: BLE001
            last = e
            print(f"  ({host} : {type(e).__name__})")
    raise SystemExit(f"connexion impossible : {last}")


def run_sql_file(con, path):
    with open(path) as fh:
        sql = fh.read()
    con.run(sql)
    print(f"OK : {os.path.basename(path)}")


def main():
    con = connect()
    print("connecte.")
    files = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not files:
        files = ["supabase/migrations/0001_init.sql"]
    for f in files:
        run_sql_file(con, os.path.join(BASE, f))
    if "--seed" in sys.argv:
        run_sql_file(con, os.path.join(BASE, "supabase/seed.sql"))
    n = con.run("select count(*) from classes")[0][0]
    print(f"verification : {n} classes en base")
    con.close()


if __name__ == "__main__":
    main()
