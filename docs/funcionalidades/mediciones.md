# Mediciones e historial

## Flujo

- **Nueva Toma** en la cabecera (o **Registrar Toma** si el historial está vacío) abre un formulario con 120/80 mmHg, pulso 70 lpm y fecha y hora locales actuales. La nota es opcional.
- **Editar** abre el mismo formulario con la toma guardada. **Eliminar** pide confirmación antes de borrarla.
- **Guardar** valida los números, convierte la fecha introducida a ISO y actualiza el historial. Las notas se recortan; una nota vacía no se guarda.

## Reglas y datos

| Campo | Rango inclusivo |
| --- | --- |
| Sistólica | 40–250 mmHg |
| Diastólica | 20–160 mmHg |
| Pulso | 10–250 lpm |

El formulario convierte las cifras con `parseInt` en base 10. La franja se calcula según la hora local al guardar o cambiar la fecha: **Mañana** 06:00–11:59, **Tarde** 12:00–19:59 y **Noche** 20:00–05:59. El historial ordena de más reciente a más antiguo y agrupa por día local. En pantallas anchas separa mañana de tarde/noche; en pantallas estrechas muestra una lista por día.

El indicador de categoría aplica estas condiciones en orden; se usa la primera que coincide. Son etiquetas de la aplicación, no un diagnóstico.

| Categoría | Condición (sistólica / diastólica) |
| --- | --- |
| Óptima | < 120 **y** < 80 |
| Normal | ≤ 129 **y** ≤ 84 |
| Normal-Alta | ≤ 139 **o** ≤ 89 |
| Grado 1 | ≤ 159 **o** ≤ 99 |
| Grado 2 | ≤ 179 **o** ≤ 109 |
| Grado 3 | Ninguna de las anteriores |

Las tomas se guardan en [IndexedDB](../arquitectura/datos-locales-y-pwa.md). No hace falta una clave de Gemini para registrar manualmente.

## Código y verificación

- [Pantalla principal](../../src/App.tsx), [formulario](../../src/components/ReadingModal.tsx), [historial](../../src/components/ReadingsHistory.tsx) e [indicador](../../src/components/ReadingCategoryBadge.tsx).
- [Hook de lecturas](../../src/hooks/useReadings.ts) y [validación, categorías y persistencia](../../src/services/readingsService.ts).
- **Comprobación manual:** crear una toma con nota, recargar, editar la hora cruzando un límite de franja, rechazar una cifra fuera de rango y comprobar que cancelar el borrado no elimina la toma.
