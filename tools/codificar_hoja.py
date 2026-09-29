#!/usr/bin/env python3
"""
Codifica el ID de la hoja de Google para pegarlo en HOJA_ID_CODIFICADO de
js/script.js, de modo que no aparezca como texto en el código publicado.

No es seguridad real: solo evita que se encuentre buscando el texto.

Uso:
    python3 tools/codificar_hoja.py <ID o URL de la hoja>
"""
import base64
import json
import re
import sys


def main(entrada: str) -> None:
    # Acepta la URL completa de la hoja o solo el ID
    m = re.search(r"/spreadsheets/d/([\w-]+)", entrada)
    hoja_id = m.group(1) if m else entrada.strip()

    # Invertido, en 3 partes, cada una en base64 (js/script.js hace lo inverso)
    invertido = hoja_id[::-1]
    n = -(-len(invertido) // 3)
    partes = [invertido[i : i + n] for i in range(0, len(invertido), n)]
    codificado = [base64.b64encode(p.encode()).decode() for p in partes]

    print(f"const HOJA_ID_CODIFICADO = {json.dumps(codificado)};")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python3 tools/codificar_hoja.py <ID o URL de la hoja>")
        sys.exit(1)
    main(sys.argv[1])
