#!/usr/bin/env python3
"""Local web server and SQLite REST API for AgriMeteo Pro."""

import argparse
import json
import sqlite3
import uuid
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit


ROOT = Path(__file__).resolve().parent
TABLES = {
    "cities",
    "plots",
    "journal",
    "alert_rules",
    "news",
    "videos",
    "custom_crops",
    "prefs",
}


class AppHandler(SimpleHTTPRequestHandler):
    database_path = ROOT / "data" / "agrimeteo.sqlite3"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        route = self._table_route()
        if route is None:
            return super().do_GET()
        table, record_id = route
        if not self._valid_table(table) or record_id is not None:
            return self._json(404, {"error": "Table ou route inconnue"})

        params = parse_qs(urlsplit(self.path).query)
        search = params.get("search", [""])[0].casefold()
        try:
            limit = max(1, min(int(params.get("limit", ["500"])[0]), 5000))
        except ValueError:
            return self._json(400, {"error": "Paramètre limit invalide"})

        with self._connect() as connection:
            rows = connection.execute(
                "SELECT payload FROM records WHERE table_name = ? ORDER BY rowid",
                (table,),
            ).fetchall()
        records = [json.loads(row[0]) for row in rows]
        if search:
            records = [
                row for row in records
                if search in json.dumps(row, ensure_ascii=False).casefold()
            ]
        return self._json(200, {"data": records[:limit]})

    def do_POST(self):
        route = self._table_route()
        if route is None:
            return self._json(404, {"error": "Route inconnue"})
        table, record_id = route
        if not self._valid_table(table) or record_id is not None:
            return self._json(404, {"error": "Table ou route inconnue"})
        row = self._read_json()
        if row is None:
            return
        row["id"] = str(row.get("id") or uuid.uuid4())
        try:
            with self._connect() as connection:
                connection.execute(
                    "INSERT INTO records (table_name, id, payload) VALUES (?, ?, ?)",
                    (table, row["id"], json.dumps(row, ensure_ascii=False)),
                )
        except sqlite3.IntegrityError:
            return self._json(409, {"error": "Cet identifiant existe déjà"})
        return self._json(201, {"data": row})

    def do_PUT(self):
        route = self._table_route()
        if route is None:
            return self._json(404, {"error": "Route inconnue"})
        table, record_id = route
        if not self._valid_table(table) or record_id is None:
            return self._json(404, {"error": "Table ou identifiant manquant"})
        changes = self._read_json()
        if changes is None:
            return
        with self._connect() as connection:
            existing = connection.execute(
                "SELECT payload FROM records WHERE table_name = ? AND id = ?",
                (table, record_id),
            ).fetchone()
            row = json.loads(existing[0]) if existing else {}
            row.update(changes)
            row["id"] = record_id
            connection.execute(
                "INSERT INTO records (table_name, id, payload) VALUES (?, ?, ?) "
                "ON CONFLICT (table_name, id) DO UPDATE SET payload = excluded.payload",
                (table, record_id, json.dumps(row, ensure_ascii=False)),
            )
        return self._json(200, {"data": row})

    def do_DELETE(self):
        route = self._table_route()
        if route is None:
            return self._json(404, {"error": "Route inconnue"})
        table, record_id = route
        if not self._valid_table(table) or record_id is None:
            return self._json(404, {"error": "Table ou identifiant manquant"})
        with self._connect() as connection:
            connection.execute(
                "DELETE FROM records WHERE table_name = ? AND id = ?",
                (table, record_id),
            )
        return self._json(200, {"ok": True})

    def _connect(self):
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.database_path, timeout=10)
        connection.execute(
            "CREATE TABLE IF NOT EXISTS records ("
            "table_name TEXT NOT NULL, id TEXT NOT NULL, payload TEXT NOT NULL, "
            "PRIMARY KEY (table_name, id))"
        )
        return connection

    def _table_route(self):
        parts = [unquote(part) for part in urlsplit(self.path).path.strip("/").split("/")]
        if len(parts) not in (2, 3) or parts[0] != "tables":
            return None
        return parts[1], parts[2] if len(parts) == 3 else None

    @staticmethod
    def _valid_table(table):
        return table in TABLES

    def _read_json(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > 1_000_000:
                raise ValueError("Taille JSON invalide")
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise ValueError("Un objet JSON est attendu")
            return payload
        except (ValueError, json.JSONDecodeError) as error:
            self._json(400, {"error": str(error)})
            return None

    def _json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


def import_sql_dump(dump_path):
    dump_path = Path(dump_path)
    source = sqlite3.connect(":memory:")
    try:
        source.executescript(dump_path.read_text(encoding="utf-8-sig"))
        destination = sqlite3.connect(AppHandler.database_path)
        try:
            destination.execute(
                "CREATE TABLE IF NOT EXISTS records ("
                "table_name TEXT NOT NULL, id TEXT NOT NULL, payload TEXT NOT NULL, "
                "PRIMARY KEY (table_name, id))"
            )
            imported = 0
            for table in sorted(TABLES):
                try:
                    cursor = source.execute(f'SELECT * FROM "{table}"')
                except sqlite3.OperationalError:
                    continue
                columns = [column[0] for column in cursor.description]
                for values in cursor.fetchall():
                    row = dict(zip(columns, values))
                    if row.get("id") is None:
                        continue
                    destination.execute(
                        "INSERT INTO records (table_name, id, payload) VALUES (?, ?, ?) "
                        "ON CONFLICT (table_name, id) DO UPDATE SET payload = excluded.payload",
                        (table, str(row["id"]), json.dumps(row, ensure_ascii=False)),
                    )
                    imported += 1
            destination.commit()
        finally:
            destination.close()
    finally:
        source.close()
    print(f"Enregistrements importés depuis {dump_path}: {imported}")


def main():
    parser = argparse.ArgumentParser(description="Serve AgriMeteo Pro with its local API")
    parser.add_argument("--host", default="0.0.0.0", help="Adresse d'écoute (défaut: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8000, help="Port HTTP (défaut: 8000)")
    parser.add_argument(
        "--database",
        type=Path,
        default=ROOT / "data" / "agrimeteo.sqlite3",
        help="Chemin vers la base SQLite",
    )
    parser.add_argument("--import-sql", type=Path, help="Importer un export SQLite avant de démarrer")
    args = parser.parse_args()
    AppHandler.database_path = args.database.resolve()
    if args.import_sql:
        import_sql_dump(args.import_sql)
    server = ThreadingHTTPServer((args.host, args.port), AppHandler)
    print(f"AgriMétéo Pro : http://{args.host}:{args.port}/")
    print(f"Base de données : {AppHandler.database_path}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nArrêt du serveur.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()