import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { Handler } from "@netlify/functions";

const schema = {
  type: Type.OBJECT,
  properties: {
    workplaces: {
      type: Type.ARRAY,
      description: "Elenco di tutti i luoghi di lavoro identificati.",
      items: {
        type: Type.OBJECT,
        properties: {
          locationName: { type: Type.STRING, description: "Nome del luogo di lavoro (es. Ufficio Amministrativo, Reparto Produzione)." }
        },
        required: ["locationName"],
      },
    },
    assets: {
      type: Type.ARRAY,
      description: "Elenco di tutti i macchinari, impianti, attrezzature e sostanze menzionati.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Nome dell'asset (es. Tornio CNC, Muletto, Acido Cloridrico)." },
          type: { type: Type.STRING, description: "Tipo di asset: 'Macchinario', 'Impianto', 'Attrezzatura', o 'Sostanza'." },
          notes: { type: Type.STRING, description: "Eventuali note aggiuntive sull'asset." }
        },
        required: ["name", "type"],
      },
    },
    workerGroups: {
      type: Type.ARRAY,
      description: "Elenco dei gruppi omogenei di lavoratori.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Nome del gruppo (es. Operai, Impiegati, Manutentori)." },
          tasks: { type: Type.STRING, description: "Breve descrizione delle mansioni principali." }
        },
        required: ["name", "tasks"],
      },
    },
    activities: {
      type: Type.ARRAY,
      description: "Elenco delle attività lavorative che collegano luoghi, asset e lavoratori, con le relative non conformità.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Nome o descrizione dell'attività (es. 'Utilizzo tornio', 'Archiviazione documenti')." },
          workplace: { type: Type.STRING, description: "Il nome del luogo di lavoro dove si svolge l'attività." },
          assets: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Nomi degli asset coinvolti." },
          workerGroups: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Nomi dei gruppi di lavoratori coinvolti." },
          nonConformities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING, description: "Descrizione della criticità/non conformità." },
                riskLevel: { type: Type.STRING, description: "Livello di rischio stimato: 'Basso', 'Medio', o 'Alto'." },
                violatedNorm: { type: Type.STRING, description: "La norma violata (es. 'Art. 71 D.Lgs. 81/2008', 'UNI EN ISO 12100')." }
              },
              required: ["description", "riskLevel"],
            },
          },
        },
        required: ["name", "workplace", "assets", "workerGroups", "nonConformities"],
      },
    },
  },
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { API_KEY } = process.env;
  if (!API_KEY) {
    return { statusCode: 500, body: "API_KEY non è configurata sul server." };
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const body = JSON.parse(event.body || '{}');
    const transcript = body.transcript;

    if (!transcript) {
      return { statusCode: 400, body: "Trascrizione mancante nel corpo della richiesta." };
    }
    
    const systemInstruction = `AGISCI COME UN ESPERTO CONSULENTE SULLA SICUREZZA SUL LAVORO ITALIANO, con profonda conoscenza del D.Lgs. 81/2008 e delle principali norme tecniche (UNI, ISO, CEI).
        Analizza la seguente trascrizione di un sopralluogo per la valutazione dei rischi. Il tuo compito è estrarre e strutturare le informazioni in formato JSON secondo lo schema fornito.
  
        ISTRUZIONI:
        1.  **Identifica le 4 Categorie**: Individua chiaramente:
            - Luoghi di Lavoro (es. ufficio, magazzino, produzione).
            - Macchinari, Impianti, Attrezzature, Sostanze (es. tornio, muletto, impianto elettrico, acido).
            - Gruppi Omogenei di Lavoratori (es. operai, impiegati, manutentori).
        2.  **Crea le Attività**: Collega le tre categorie precedenti per descrivere le attività svolte (es. 'L'operaio usa il tornio nel reparto produzione').
        3.  **Rileva Non Conformità**: Per ogni attività, identifica ogni criticità, rischio o non conformità descritta.
        4.  **Pesa il Rischio**: Per ogni non conformità, assegna un livello di rischio: 'Basso', 'Medio' o 'Alto', basandoti sulla tua conoscenza della normativa.
        5.  **Cita la Norma**: Se possibile, per ogni non conformità, cita la norma specifica violata (es. articolo del D.Lgs. 81/2008, norma tecnica, linea guida). Se non sei sicuro, lascia il campo vuoto.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: \`TRASCRIZIONE: "\${transcript}"\`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });
      
      const jsonText = response.text.trim();
      const structuredData = JSON.parse(jsonText);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(structuredData),
    };

  } catch (error) {
    console.error("Errore nella Netlify Function:", error);
    return { statusCode: 500, body: "Errore durante l'elaborazione della richiesta." };
  }
};