# Victor Coach

App personal de entrenamiento y nutrición. Corre 100% en el navegador, sin servidor: los datos se guardan en `localStorage` de tu dispositivo y, si quieres, puedes sincronizarlos manualmente con una hoja de Google Sheets propia.

## Estructura

```
index.html
css/styles.css
js/store.js     → modelo de datos y localStorage
js/ui.js        → renderizado de cada sección
js/sheets.js    → autenticación y sincronización con Google Sheets
js/app.js       → navegación y formularios
manifest.json, sw.js → soporte offline / PWA
```

## Secciones

- **Inicio**: peso, % grasa, objetivo, próxima revisión, semana tipo y resumen de la semana.
- **Running**: registro de las sesiones de Lunes/Miércoles/Viernes/Domingo (lo que indique Garmin Coach, ritmo, FC, RPE, molestias, recuperación).
- **Fuerza A** (martes) y **Fuerza B** (jueves): ejercicios fijos, sin carga en el brazo izquierdo, con series/reps/carga por sesión.
- **Movilidad**: checklist de tobillo/cadera/cadena posterior/columna, para el sábado suave o después de cualquier sesión.
- **Dieta**: las 5 comidas con cantidades, alternativas de carbohidrato y un registro diario de adherencia.
- **Progreso**: medidas cada 1–2 semanas, con botón para copiar un resumen listo para pegar en tu IA de referencia.
- **Ajustes**: conexión con Google Sheets, exportar/importar copia de seguridad en JSON, borrar datos.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo (puede ser privado) y sube todos estos archivos a la raíz.
2. En **Settings → Pages**, selecciona la rama `main` y la carpeta `/ (root)`.
3. Tu app quedará disponible en `https://TU-USUARIO.github.io/TU-REPO/`.

## Configurar la sincronización con Google Sheets

La sincronización usa Google Identity Services (OAuth en el propio navegador) — no hay backend ni claves secretas guardadas en ningún sitio salvo tu Google Cloud.

1. Ve a [Google Cloud Console](https://console.cloud.google.com/) y crea un proyecto (o usa uno existente).
2. En **APIs y servicios → Biblioteca**, activa **Google Sheets API**.
3. En **APIs y servicios → Pantalla de consentimiento OAuth**, configúrala como "Externa" y añade tu propio correo como usuario de prueba (con eso basta, no hace falta publicarla).
4. En **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**:
   - Tipo: **Aplicación web**.
   - En **Orígenes de JavaScript autorizados**, añade la URL de tu GitHub Pages, ej. `https://TU-USUARIO.github.io`.
   - Copia el **Client ID** generado (termina en `.apps.googleusercontent.com`).
5. Crea una Google Sheet nueva y copia su ID (el fragmento largo en la URL, entre `/d/` y `/edit`).
6. En la app, ve a **Ajustes**, pega el Client ID y el ID de la hoja, y pulsa **Guardar ajustes**.
7. Pulsa **Conectar con Google** (te pedirá iniciar sesión y dar permiso) y luego **Sincronizar todo ahora**.

Cada sincronización sobrescribe las pestañas `Running`, `FuerzaA`, `FuerzaB`, `Movilidad`, `Dieta` y `Progreso` de esa hoja con tus datos locales actuales. Se crean automáticamente si no existen. La sesión de Google se pierde al recargar la página; simplemente vuelve a pulsar "Conectar con Google" cuando quieras sincronizar de nuevo.

## Copia de seguridad local

En Ajustes puedes exportar todo a un `.json` (recomendado antes de borrar datos o cambiar de dispositivo) y volver a importarlo cuando quieras.

## Próximas ideas (no implementadas todavía)

- Gráficas de evolución de peso/medidas en Progreso.
- Importar automáticamente el resumen de sesión desde el export de Garmin Connect.
- Recordatorio local (notificación) el día de revisión quincenal.
