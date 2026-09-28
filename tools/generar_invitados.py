#!/usr/bin/env python3
"""
Genera data/invitados.json y la lista de links personalizados a partir del
CSV de invitados, organizado por bloques separados por una fila vacía:

    FAMILIA CABRERA CASTILLO,GABRIEL CABRERA,2  <- nombre en la tarjeta, invitado, pases
    ,MARIA JOSE CASTILLO,                        <- resto de invitados del grupo
    ,,

Uso:
    python3 tools/generar_invitados.py data/Book1.csv
"""
import csv
import hashlib
import json
import sys
from pathlib import Path

BASE_URL = "https://arianaisabella15.github.io/ArianaSweet15/"

ROOT = Path(__file__).resolve().parent.parent
JSON_OUT = ROOT / "data" / "invitados.json"
# Mismos datos como script, para que la página funcione también abierta
# con file:// (donde el navegador bloquea fetch del JSON)
JS_OUT = ROOT / "data" / "invitados.js"
LINKS_OUT = ROOT / "data" / "links-generados.csv"


def generar_token(nombre: str) -> str:
    # Determinístico: el mismo nombre siempre genera el mismo token,
    # así se puede volver a correr el script sin invalidar links ya enviados.
    return hashlib.sha256(nombre.strip().encode("utf-8")).hexdigest()[:10]


def main(csv_path: str) -> None:
    invitados = {}
    links = []

    # utf-8-sig descarta el BOM que agrega Excel al exportar
    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        grupo = None
        for row in csv.reader(f):
            row = [c.strip() for c in row] + ["", "", ""]
            tarjeta, persona, pases = row[:3]

            if tarjeta:
                token = generar_token(tarjeta)
                if token in invitados:
                    sys.exit(f"Error: nombre de tarjeta repetido: {tarjeta}")
                grupo = {"nombre": tarjeta, "pases": int(pases), "invitados": []}
                invitados[token] = grupo
                links.append((tarjeta, grupo["pases"], f"{BASE_URL}?i={token}"))
            elif not persona:
                grupo = None
                continue

            if persona and grupo is not None:
                grupo["invitados"].append(persona)

    # Cada tarjeta debe listar exactamente tantos nombres como pases tiene,
    # porque en la confirmación se muestra un check por persona
    errores = [
        f"  {g['nombre']}: {g['pases']} pases, {len(g['invitados'])} nombres"
        for g in invitados.values()
        if len(g["invitados"]) != g["pases"]
    ]
    if errores:
        sys.exit("Error: pases y nombres no coinciden:\n" + "\n".join(errores))

    datos = json.dumps(invitados, ensure_ascii=False, indent=2)
    JSON_OUT.write_text(datos, encoding="utf-8")
    JS_OUT.write_text(f"window.INVITADOS = {datos};\n", encoding="utf-8")

    with open(LINKS_OUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Nombre en la tarjeta", "Número de pases", "Link"])
        writer.writerows(links)

    print(f"OK: {len(invitados)} invitados -> {JSON_OUT} y {JS_OUT}")
    print(f"OK: links listos para copiar/pegar -> {LINKS_OUT}\n")
    for nombre, pases, link in links:
        print(f"{nombre} ({pases} pases): {link}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python3 tools/generar_invitados.py <ruta-al-csv>")
        sys.exit(1)
    main(sys.argv[1])
