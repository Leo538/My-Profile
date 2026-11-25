# Portafolio de Leonel Barros

Portafolio Angular con un recorrido nocturno en Three.js. Sus nueve proyectos se pueden abrir desde el mapa o desde el menú, incluso cuando WebGL no está disponible.

## Ejecutar

```bash
npm install
npm start
```

Abrir `http://localhost:4200/`. El mapa se carga bajo demanda y admite WASD, flechas y visitas táctiles. El teclado responde al tener el mapa visible, sin un clic previo en el escenario. `E` abre el proyecto cercano; «Volver a la plaza» devuelve al robot al inicio.

El recorrido se organiza en **3 + 3 + 2 + 1**: FinanSmart, SICOP y ChatQuality en la plaza; Sistema de Riego, AgroPay y Vinculación de Riego en la primera terraza; Laboratorio RGB y Novacore en la segunda; Pantufladas, el proyecto estrella, en la cima. Las tres rampas tienen altura real y la cámara acompaña la subida y el regreso. Los botones de nivel recorren el mismo terreno; en móvil, tocar el nombre de un proyecto lleva al robot y abre su ficha.

Visitar las ocho paradas anteriores completa los indicadores de nivel e ilumina la estrella de Pantufladas. Este progreso es opcional: todas las fichas y la cima están disponibles desde el inicio. «Volver a la plaza» permite regresar desde cualquier terraza.

La cabecera permite cambiar toda la interfaz entre Español y English. La preferencia se conserva en el navegador; los nombres oficiales, las capturas originales y las credenciales mantienen su contenido de origen.

El texto bajo el nombre alterna tres frases con escritura progresiva, traducidas según el idioma. Reserva el espacio de la frase más larga para mantener estables la descripción y los botones. Con movimiento reducido, muestra la primera frase completa y las visitas automáticas al mapa son inmediatas.

## Actividades

- FinanSmart compara amortización francesa y alemana con el mismo capital, interés y plazo de ejemplo.
- SICOP recorre las etapas de una póliza ficticia y refleja su avance en las luces del archivo.
- ChatQuality simula seis mensajes desde la misma IP en diez segundos. El sexto supera el límite de cinco envíos y queda bloqueado.
- Sistema de Riego permite variar humedad del suelo y temperatura. Reproduce el modelo base Mamdani del repositorio con HR 60 % y PAR 1000; la optimización genética queda en la aplicación completa.
- AgroPay permite preparar un pedido ficticio, cambiar su cantidad y recorrer pago y entrega.
- Laboratorio RGB ajusta los canales reales de una imagen de ejemplo en canvas y permite restaurarlos.
- Novacore permite elegir un servicio y avanzar un encargo ilustrativo por sus etapas.
- Vinculación combina humedad del suelo y probabilidad de lluvia con las reglas originales del dashboard IoT.
- Pantufladas recorre un lote ficticio de 12 pares: bodega, traslado, llegada al local y venta. Conserva las cantidades y permite reiniciar.

El avance de SICOP y ChatQuality se conserva al cerrar sus fichas durante la visita. Cada actividad permite reiniciar. Estos ejemplos se ejecutan localmente y no modifican los sistemas originales.

Las nueve fichas separan Proyecto, Información y Actividad; FinanSmart incluye también Cuotas. Proyecto prioriza la galería y un resumen. Información conserva la descripción completa, aporte documentado, módulos y tecnologías: en escritorio se ven en tres columnas y en pantallas pequeñas se consultan mediante tres botones. Así se evita un desplazamiento interior para leer las fichas. La tabla de amortización se pagina de cuatro en cuatro. La página conserva el desplazamiento por rueda/tacto con las barras ocultas y bloquea el fondo al abrir una ficha.

## Verificar

El formulario llama a EmailJS con los identificadores públicos de `src/environments/`. En la plantilla de EmailJS, fija `To Email` al correo del portafolio y usa `{{email}}` en `Reply-To`. Si la cuenta limita los orígenes, incluye el dominio publicado. La prueba de navegador intercepta la solicitud para comprobar el formulario sin enviar correo real.

```bash
npm run build
npm test -- --watch=false
npm run test:e2e
```

Para usar Edge con Playwright en PowerShell:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm run test:e2e
node e2e/record-journey.mjs
node e2e/record-terraces.mjs
```

Las capturas y la grabación se guardan en `artifacts/`. El CV original está integrado en `public/assets/documents/Leonel-Barros-CV.pdf`; la descarga conserva exactamente el archivo proporcionado.

La portada ofrece «Descargar CV» y «Ver CV en el navegador». La vista abre el PDF por HTTP en una pestaña nueva. La descarga usa el nombre `Barros_Leonel_CV.pdf`; la URL respeta el base href e incluye la versión del documento para evitar copias antiguas en caché.

La tipografía Inter se sirve desde `public/assets/fonts/` con su licencia, sin una petición externa a Google Fonts. El mapa adapta su resolución y detiene el dibujo cuando no es necesario.

Las fichas de Sistema de Riego, AgroPay, Laboratorio RGB y Novacore incluyen capturas de sus aplicaciones originales. Se ejecutó el código público de sus repositorios porque no publicaban capturas de interfaz. Cada imagen se sirve localmente y puede abrirse completa desde la ficha. Las fuentes exactas, versiones, datos de ejemplo y hashes están en [project-image-sources.json](artifacts/project-image-sources.json).

Los siete proyectos tienen un carrusel dentro de su ficha: **20 imágenes reales**, tres por proyecto y dos en SICOP, cuyo frontend público solo contiene la pantalla de acceso. La foto ocupa la mayor parte de la ficha y se recorre con flechas laterales discretas, selectores, teclado o un gesto horizontal en móvil. Cada imagen tiene una descripción ES/EN y su enlace para abrirla completa. Solo se solicita la foto seleccionada; la portada no descarga las galerías. La procedencia de las veinte imágenes está en [project-gallery-sources.json](artifacts/project-gallery-sources.json).

Las fichas incluyen descripción general, módulos, aporte personal, tecnologías implementadas y acceso destacado al repositorio. Cada aporte enlaza a un commit verificado de Leo538. Los datos completos y sus fuentes están en [project-details-audit.json](artifacts/project-details-audit.json); las URLs de repositorios y aportes están comprobadas en [project-link-validation.json](artifacts/project-link-validation.json). El contenido se mantiene centralizado en `project-details.data.ts`, con versiones ES/EN. Los enlaces de video o demo se muestran cuando existen y se han verificado; la revisión actual no encontró recursos públicos funcionales de ese tipo.

## Código principal

Las fuentes y capturas nuevas se documentan en [vinculacion-project-source.json](artifacts/vinculacion-project-source.json) y [pantufladas-project-source.json](artifacts/pantufladas-project-source.json). Las siete imágenes nuevas se capturaron desde las interfaces originales con datos ficticios locales. Pantufladas se verificó contra el clon local cuyo remoto coincide con el enlace suministrado; su URL pública responde 404 y la ficha indica que requiere acceso. No se inventan enlaces de demo ni de video.

- `src/app/features/portfolio`: presentación, navegación y secciones profesionales.
- `src/app/features/journey-map`: escena, movimiento, destinos y estado de las actividades.
- `src/app/features/journey-map/journey-world.ts`: alturas, rutas y colisiones compartidas por el movimiento manual y las visitas automáticas.
- `src/app/features/project-sheet`: fichas e interacciones opcionales.
- `src/app/core/data`: proyectos, contribuciones, enlaces y credenciales reales.
