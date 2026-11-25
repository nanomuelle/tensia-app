# Tensia

Tensia es una aplicación web en español para registrar y consultar mediciones de presión arterial y pulso. Guarda el historial en el navegador, permite exportarlo y puede rellenar el formulario a partir de una foto con Gemini si se configura una clave.

## Arranque local

Con Node.js 24 y npm:

```sh
npm ci
npm run dev
```

Abre la dirección que muestra Vite (normalmente http://localhost:5173/). No se necesita una clave de Gemini para registrar tomas manualmente.

Consulta el [índice de documentación](docs/README.md) para encontrar los flujos, su implementación y las instrucciones de desarrollo.
