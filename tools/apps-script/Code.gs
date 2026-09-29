/**
 * Recibe las confirmaciones de asistencia de la invitación y las guarda en
 * la hoja "Confirmaciones": una fila por persona.
 *
 * Instalación: ver tools/apps-script/README.md
 */

// Lista oficial de invitados publicada con el sitio; se usa para validar
// que el código y los nombres recibidos existan de verdad.
const INVITADOS_URL = 'https://arianaisabella15.github.io/ArianaSweet15/data/invitados.json';
const HOJA = 'Confirmaciones';
const ENCABEZADOS = ['Fecha', 'Código', 'Tarjeta', 'Nombre', 'Asiste'];

function doPost(e) {
  try {
    const { token, asistentes } = JSON.parse(e.postData.contents);

    const invitado = buscarInvitado(token);
    if (!invitado) return responder({ ok: false, error: 'Código de invitación no válido' });

    // Solo se aceptan los nombres de esa tarjeta; los que no vienen marcados
    // quedan como "No"
    const confirmados = new Set(asistentes || []);
    const fecha = new Date();
    const filas = invitado.invitados.map((nombre) => [
      fecha,
      token,
      invitado.nombre,
      nombre,
      confirmados.has(nombre) ? 'Sí' : 'No',
    ]);

    // El lock evita que dos confirmaciones simultáneas se pisen al reescribir
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      guardar(token, filas);
    } finally {
      lock.releaseLock();
    }

    return responder({ ok: true });
  } catch (err) {
    return responder({ ok: false, error: String(err) });
  }
}

// Devuelve lo que ya confirmó un código (?token=...), para que la página
// marque los checks al cargar. confirmado=false si aún no ha respondido.
function doGet(e) {
  try {
    const token = e.parameter.token;
    const filas = obtenerHoja()
      .getDataRange()
      .getValues()
      .slice(1)
      .filter((fila) => fila[1] === token);

    return responder({
      ok: true,
      confirmado: filas.length > 0,
      asistentes: filas.filter((fila) => fila[4] === 'Sí').map((fila) => fila[3]),
    });
  } catch (err) {
    return responder({ ok: false, error: String(err) });
  }
}

// Reemplaza la confirmación anterior de ese código, si existía, para que
// volver a confirmar no duplique personas. Se reescribe la tabla completa
// en una sola operación: borrar fila por fila con deleteRow es muy lento.
function guardar(token, filas) {
  const sheet = obtenerHoja();
  const anteriores = sheet.getLastRow() - 1;
  const resto =
    anteriores > 0
      ? sheet
          .getRange(2, 1, anteriores, ENCABEZADOS.length)
          .getValues()
          .filter((fila) => fila[1] !== token)
      : [];
  const tabla = resto.concat(filas);

  if (anteriores > 0) sheet.getRange(2, 1, anteriores, ENCABEZADOS.length).clearContent();
  sheet.getRange(2, 1, tabla.length, ENCABEZADOS.length).setValues(tabla);
}

function obtenerHoja() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(HOJA);
  if (!sheet) {
    sheet = ss.insertSheet(HOJA);
    sheet.appendRow(ENCABEZADOS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, ENCABEZADOS.length).setFontWeight('bold');
  }
  return sheet;
}

// Cachea la lista 10 minutos para no descargarla en cada confirmación. Si
// el código no está en la copia cacheada, se vuelve a descargar: puede que
// la lista se haya regenerado y publicado después de cachearla.
function buscarInvitado(token) {
  const cache = CacheService.getScriptCache();
  const guardado = cache.get('invitados');
  if (guardado) {
    const invitado = JSON.parse(guardado)[token];
    if (invitado) return invitado;
  }

  const json = UrlFetchApp.fetch(INVITADOS_URL).getContentText();
  cache.put('invitados', json, 600);
  return JSON.parse(json)[token];
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
