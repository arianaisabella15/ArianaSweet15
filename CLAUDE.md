# Proyecto: Invitación 15 Años — Ariana

## Objetivo del proyecto

Este proyecto **NO es un diseño libre**. El objetivo es **copiar lo más exacto posible**
una página de invitación de 15 años a partir de las capturas de pantalla que el usuario
va enviando (referencia: sitio construido con InvitiApp).

Cada sección de la página se construye o ajusta contra una captura de referencia
específica. La meta es una réplica fiel, no una interpretación o versión "inspirada".

## Reglas al implementar una captura de referencia

1. **Copia estilos y tamaños exactos**: colores, tipografía, tamaños de fuente,
   espaciados, bordes, sombras, blur, proporciones de los elementos entre sí. Si el
   usuario da valores CSS concretos (ej. un `background`/`box-shadow` exacto),
   impleméntalos tal cual, sin "mejorarlos" ni simplificarlos.
2. **TEXTO = COPIA EXACTA, LETRA POR LETRA. SIN EXCEPCIONES.** Todo texto fijo/de
   plantilla que aparece en la captura (etiquetas, subtítulos, texto de botones,
   mensajes) se transcribe **carácter por carácter**, tal cual está en la imagen:
   mismas palabras, mismos acentos (o su ausencia), mismas mayúsculas/minúsculas,
   misma puntuación. Nada de "correcciones" ortográficas, nada de agregar acentos
   que no se ven, nada de sufijos de lenguaje inclusivo (`@`, `/a`) que no estén en
   la captura, nada de sinónimos ni reordenar palabras. Si la captura dice
   "Estas Invitado", se escribe **"Estas Invitado"**, no "Estás Invitado" ni
   "Estás Invitad@".
3. **TODO se copia igual, incluido lo que parece "dato del evento"** (nombre,
   fecha, lugar, etc.) **mientras se está clonando/ajustando una sección contra
   una captura**. No asumas por tu cuenta que un texto es "dato personalizable"
   y lo cambies por el dato real de Ariana — eso NO es tu decisión. El reemplazo por
   los datos reales de Ariana solo se hace cuando el usuario lo pide explícitamente
   como un paso aparte. Si no te ha dicho "ahora reemplaza X por el dato real",
   dejas el texto de la captura tal cual está, letra por letra, aunque sea un
   nombre, fecha o lugar distinto al del evento real.
4. **Antes de dar por buena una implementación, compara proporciones contra la
   imagen de referencia** (tamaño relativo de textos entre sí, ancho de tarjetas,
   relación texto/contenedor) en vez de asumir que "se ve parecido".
5. **Si tienes dudas sobre qué copiar o cómo interpretar la captura, pregunta** antes
   de improvisar una solución.

## Estructura del proyecto

- `index.html` — única página HTML del sitio (single source of truth, se sirve vía
  GitHub Pages). No crear archivos HTML alternativos/variantes.
- `css/style.css` — estilos custom que complementan Tailwind (CDN).
- `js/script.js` — JS del sitio (countdown, RSVP, popup de entrada, etc).
- `assets/` — imágenes reales del evento.
