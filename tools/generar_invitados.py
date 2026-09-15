#!/usr/bin/env python3
"""
Genera data/invitados.json y la lista de links personalizados a partir del
CSV de invitados (columnas: "Nombre en la tarjeta", "Número de pases").

Uso:
    python3 tools/generar_invitados.py data/invitados-prueba.csv
"""
import csv
import hashlib
import json
import sys
from pathlib import Path

BASE_URL = "https://gabriel045.github.io/15-Isa/"

ROOT = Path(__file__).resolve().parent.parent
JSON_OUT = ROOT / "data" / "invitados.json"
LINKS_OUT = ROOT / "data" / "links-generados.csv"


def generar_token(nombre: str) -> str:
    # Determinístico: el mismo nombre siempre genera el mismo token,
    # así se puede volver a correr el script sin invalidar links ya enviados.
    return hashlib.sha256(nombre.strip().encode("utf-8")).hexdigest()[:10]


def main(csv_path: str) -> None:
    invitados = {}
    links = []

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            nombre = row["Nombre en la tarjeta"].strip()
            pases = int(row["Número de pases"])
            token = generar_token(nombre)

            invitados[token] = {"nombre": nombre, "pases": pases}
            links.append((nombre, pases, f"{BASE_URL}?i={token}"))

    JSON_OUT.write_text(
        json.dumps(invitados, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    with open(LINKS_OUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Nombre en la tarjeta", "Número de pases", "Link"])
        writer.writerows(links)

    print(f"OK: {len(invitados)} invitados -> {JSON_OUT}")
    print(f"OK: links listos para copiar/pegar -> {LINKS_OUT}\n")
    for nombre, pases, link in links:
        print(f"{nombre} ({pases} pases): {link}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python3 tools/generar_invitados.py <ruta-al-csv>")
        sys.exit(1)
    main(sys.argv[1])
