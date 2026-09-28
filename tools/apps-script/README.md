# Confirmaciones en Google Sheets

1. Crea una Google Sheet nueva (con la cuenta que recibirá las respuestas).
2. En la hoja: **Extensiones → Apps Script**. Borra lo que haya en `Código.gs`
   y pega el contenido de `Code.gs`. Guarda.
3. **Implementar → Nueva implementación** → tipo **Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
4. Autoriza los permisos que pide Google (acceso a la hoja y a URLs externas).
5. Copia la **URL de la aplicación web** (termina en `/exec`) y pégala en
   `RSVP_ENDPOINT` al inicio de `js/script.js`.

Las respuestas llegan a la pestaña **Confirmaciones** (se crea sola con la
primera respuesta): una fila por persona con Fecha, Código, Tarjeta, Nombre y
Asiste (Sí/No). Si una familia vuelve a confirmar, sus filas se reemplazan.

Total de asistentes, en cualquier celda: `=COUNTIF(Confirmaciones!E:E; "Sí")`

**Si cambias `Code.gs`** después de publicarlo: Implementar → Gestionar
implementaciones → editar → Versión: **Nueva versión**. Así la URL no cambia.
