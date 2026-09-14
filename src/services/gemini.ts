export interface BloodPressureReading {
  systolic: number;
  diastolic: number;
  pulse: number;
}

/**
 * Resizes and compresses an image file or Blob (max 1024px on the longest side, JPEG quality ~0.8)
 * and returns its base64 string representation.
 */
export async function compressImage(fileOrBlob: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIMENSION = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas 2d context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            const reader2 = new FileReader();
            reader2.onload = () => {
              const dataUrl = reader2.result as string;
              const base64 = dataUrl.split(',')[1] || dataUrl;
              resolve(base64);
            };
            reader2.onerror = (err) => reject(err);
            reader2.readAsDataURL(blob);
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Tests the Gemini API key.
 */
export async function testGeminiApiKey(apiKey: string): Promise<boolean> {
  const trimmed = apiKey.trim();
  if (!trimmed) throw new Error('La clave de API no puede estar vacía');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${encodeURIComponent(trimmed)}`;
  
  const payload = {
    contents: [
      {
        parts: [
          { text: "Ping test. Respond with OK." }
        ]
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Error HTTP ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  return true;
}


/**
 * Analyzes a blood pressure monitor image using Gemini Vision API with structured JSON output.
 */
export async function analyzeBloodPressureImage(
  apiKey: string,
  base64Image: string
): Promise<BloodPressureReading> {
  const trimmed = apiKey.trim();
  if (!trimmed) throw new Error('Clave de API de Gemini no configurada');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${encodeURIComponent(trimmed)}`;

  const prompt = `Analiza esta imagen de un monitor de presión arterial (tensiómetro digital). Extrae los valores numéricos correspondientes a la presión sistólica (SYS o SYS/HIGH), presión diastólica (DIA o DIA/LOW) y pulso (PUL o PULSE / frecuencia cardíaca). Si hay varios números, prioriza la lectura principal actual en pantalla. Devuelve estrictamente un objeto JSON con las claves: "systolic" (número entero), "diastolic" (número entero), y "pulse" (número entero).`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }
    ],
    generationConfig: {
      response_mime_type: "application/json",
      response_schema: {
        type: "OBJECT",
        properties: {
          systolic: {
            type: "INTEGER",
            description: "Presión arterial sistólica (mmHg)"
          },
          diastolic: {
            type: "INTEGER",
            description: "Presión arterial diastólica (mmHg)"
          },
          pulse: {
            type: "INTEGER",
            description: "Pulso o frecuencia cardíaca (latidos por minuto)"
          }
        },
        required: ["systolic", "diastolic", "pulse"]
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Error en la API de Gemini (${response.status} ${response.statusText})`;
    throw new Error(message);
  }

  const data = await response.json();
  const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidateText) {
    throw new Error('La respuesta de Gemini no contiene contenido válido');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(candidateText);
  } catch (err) {
    throw new Error('No se pudo interpretar la respuesta JSON de Gemini');
  }

  const systolic = Number(parsed.systolic);
  const diastolic = Number(parsed.diastolic);
  const pulse = Number(parsed.pulse);

  if (isNaN(systolic) || isNaN(diastolic) || isNaN(pulse)) {
    throw new Error('Los valores extraídos por la IA no son números válidos');
  }

  return { systolic, diastolic, pulse };
}
