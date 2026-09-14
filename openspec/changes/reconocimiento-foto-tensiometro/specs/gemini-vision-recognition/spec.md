## Purpose

Permite el reconocimiento automático de lecturas de tensión arterial mediante captura fotográfica con la API de Gemini Vision (BYOK), manteniendo la arquitectura 100% cliente-side.

## ADDED Requirements

### Requirement: Configuración y prueba de clave API de Gemini
El sistema SHALL permitir introducir, verificar mediante llamada de test y almacenar localmente la clave de API de Gemini del usuario.

#### Scenario: Guardado de clave válida
- **WHEN** el usuario introduce una clave de Gemini, pulsa "Probar clave" y la API responde correctamente
- **THEN** la clave se guarda en almacenamiento local (IndexedDB) y se muestra un indicador de éxito.

#### Scenario: Error con clave inválida o fallida
- **WHEN** la clave introducida es incorrecta o la llamada de test falla
- **THEN** se muestra un aviso claro de error y la clave no se almacena como válida.

### Requirement: Captura o selección de foto del tensiómetro
El sistema SHALL permitir tomar una foto con la cámara o seleccionar una imagen existente como alternativa a la entrada manual de lectura.

#### Scenario: Selección de imagen
- **WHEN** el usuario pulsa "Foto y listo" y selecciona o captura una imagen de la pantalla del tensiómetro
- **THEN** la imagen se carga para su procesamiento visual.

### Requirement: Procesamiento visual con Gemini Vision
El sistema SHALL enviar la imagen capturada directamente a la API de Gemini Vision usando la clave local con un prompt estructurado para extraer sistólica, diastólica y pulso.

#### Scenario: Extracción exitosa
- **WHEN** la API de Gemini analiza la imagen y devuelve valores estructurados válidos
- **THEN** se presentan los valores extraídos en la pantalla de confirmación.

#### Scenario: Fallo de análisis o interpretación
- **WHEN** la API falla, se agota la cuota o la respuesta no contiene valores legibles
- **THEN** se muestra un aviso claro y se ofrece continuar mediante entrada manual sin perder el flujo.

### Requirement: Aviso de privacidad de IA
El sistema SHALL mostrar un aviso de privacidad visible la primera vez que se activa la función de reconocimiento fotográfico.

#### Scenario: Primer uso de la función de foto
- **WHEN** el usuario pulsa "Foto y listo" por primera vez
- **THEN** se muestra un aviso explicando que la foto se envía a Google para su análisis y no se almacena localmente.
