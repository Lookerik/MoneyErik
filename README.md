# MONARCH — Master your money

Finanzas personales sencillas: ingresos, gastos, categorías, calendario y saldo acumulado. HTML + CSS + JavaScript puro, sin servidor ni dependencias.

## Archivos
`index.html` · `style.css` · `script.js` (interfaz) · `core.js` (cálculos en céntimos) · `crypto.js` (cifrado) · `tests.js` (pruebas, `node tests.js`)

## Publicar en GitHub Pages
1. Crea un repositorio (puede ser privado si tu plan lo permite) y sube estos archivos a la raíz.
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)`.
3. Abre `https://TU-USUARIO.github.io/NOMBRE-REPO/`. Las rutas son relativas.

## Datos y seguridad
- GitHub solo aloja el código. Tus datos nunca se envían a ningún sitio: se guardan en `localStorage` **cifrados** (AES-GCM 256, clave derivada con PBKDF2-SHA-256 y 600.000 iteraciones, salt aleatorio, IV nuevo en cada guardado).
- La contraseña no se guarda; la clave solo vive en memoria hasta que pulsas *Bloquear* o cierras la pestaña.
- **Si pierdes la contraseña, los datos no se pueden recuperar.**
- Borrar los datos del navegador puede eliminar tus registros. No hay sincronización: usa las copias de seguridad.
- El cifrado no protege frente a un dispositivo comprometido o código malicioso con la app desbloqueada.

## Copias de seguridad
Configuración → *Exportar copia cifrada* (JSON). Para pasar datos al móvil, envíate el archivo y usa *Importar copia…* con la misma contraseña. Importar **reemplaza** los datos de ese dispositivo.

## Cómo se calcula el saldo
Saldo del mes anterior = saldo inicial + ingresos − gastos de todos los meses anteriores. Saldo disponible = ese saldo + ingresos − gastos del mes. No existen movimientos ficticios: todo se recalcula desde el historial, así que editar uno antiguo actualiza los meses siguientes.

## Actualizar sin perder datos
Sustituye los archivos en el repositorio. Los datos están en el navegador y no se tocan.
