## MODIFIED Requirements

### Requirement: Registro rápido de lecturas
El sistema SHALL permitir registrar sistólica, diastólica y pulso, mediante entrada manual o reconocimiento automático por fotografía de la pantalla del tensiómetro, con fecha/hora actual editable y validaciones de rango.

#### Scenario: Registro válido manual o por foto
- **WHEN** el usuario introduce o confirma valores dentro de rango (sistólica > diastólica, rangos válidos) y guarda
- **THEN** la medición se almacena en IndexedDB y aparece en el histórico.

#### Scenario: Valores fuera de rango en confirmación de foto
- **WHEN** los valores extraídos por la IA están fuera de rango o son inválidos
- **THEN** se muestran en campos editables marcando el error y exigiendo corrección antes de guardar.
