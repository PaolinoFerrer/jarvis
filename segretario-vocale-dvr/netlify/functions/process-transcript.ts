import { GoogleGenAI, Type } from "@google/genai";
import type { Handler } from "@netlify/functions";
import type { ReportData } from "../../src/types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const schema = {
  type: Type.OBJECT,
  properties: {
    workplaces: {
      type: Type.ARRAY,
      description: "List of distinct workplaces or locations identified in the transcript.",
      items: {
        type: Type.OBJECT,
        properties: {
          locationName: {
            type: Type.STRING,
            description: "The name of the workplace or location.",
          },
        },
        required: ["locationName"],
      },
    },
    assets: {
      type: Type.ARRAY,
      description: "List of machinery, plants, equipment, or substances mentioned.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the asset." },
          type: { 
            type: Type.STRING, 
            description: "Type of asset.",
            enum: ['Macchinario', 'Impianto', 'Attrezzatura', 'Sostanza'],
          },
          notes: { type: Type.STRING, description: "Any additional notes about the asset." },
        },
        required: ["name", "type"],
      },
    },
    workerGroups: {
      type: Type.ARRAY,
      description: "List of homogeneous worker groups identified.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the worker group (e.g., 'carpentieri', 'elettricisti')." },
          tasks: { type: Type.STRING, description: "Description of the tasks performed by this group." },
        },
        required: ["name", "tasks"],
      },
    },
    activities: {
      type: Type.ARRAY,
      description: "List of activities performed, including risk analysis.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the activity." },
          workplace: { type: Type.STRING, description: "The workplace where the activity is performed. Must be one of the identified workplaces." },
          assets: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of asset names used in this activity. Must be from the identified assets."
          },
          workerGroups: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of worker group names involved in this activity. Must be from the identified worker groups."
          },
          nonConformities: {
            type: Type.ARRAY,
            description: "List of non-conformities or risks identified for this activity.",
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING, description: "Detailed description of the non-conformity or risk." },
                riskLevel: { 
                  type: Type.STRING, 
                  description: "The assessed risk level.",
                  enum: ['Basso', 'Medio', 'Alto'],
                },
                violatedNorm: { type: Type.STRING, description: "The specific law or regulation violated (e.g., 'Art. 71 D.Lgs. 81/2008')." },
              },
              required: ["description", "riskLevel"],
            },
          },
        },
        required: ["name", "workplace", "assets", "workerGroups", "nonConformities"],
      },
    },
  },
  required: ["workplaces", "assets", "workerGroups", "activities"],
};


const systemInstruction = `Sei un assistente specializzato in sicurezza sul lavoro (D.Lgs. 81/2008) in Italia.
Il tuo compito è analizzare la trascrizione di un sopralluogo in un cantiere o luogo di lavoro e strutturare le informazioni in un formato JSON ben definito.
Estrai e categorizza le seguenti entità:
1.  **Luoghi di Lavoro**: Identifica i nomi specifici delle aree, stanze o zone menzionate (es. "Area di scavo", "Ufficio cantiere", "Piano primo").
2.  **Macchinari, Impianti, Attrezzature, Sostanze**: Estrai i nomi di tutti gli asset (es. "betoniera", "ponteggio", "quadro elettrico", "vernice").
3.  **Gruppi Omogenei di Lavoratori**: Identifica i gruppi di lavoratori in base alla loro mansione (es. "muratori", "carpentieri", "elettricisti").
4.  **Attività e Rischi**: Descrivi le attività lavorative osservate (es. "Posa del ponteggio", "Scavo manuale"). Per ogni attività, associa:
    - Il luogo di lavoro.
    - I gruppi di lavoratori coinvolti.
    - Gli asset utilizzati.
    - Una lista di **Non Conformità**: Per ogni non conformità, descrivi il problema, assegna un livello di rischio ('Basso', 'Medio', 'Alto'), e se possibile, cita la norma violata.

Fornisci la risposta esclusivamente in formato JSON, seguendo lo schema fornito.
Non includere entità che non sono esplicitamente menzionate nella trascrizione. Sii accurato e conciso. Assicura che i nomi di luoghi, asset e gruppi di lavoratori usati nelle attività corrispondano esattamente a quelli definiti nelle rispettive liste principali.`;

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if(!process.env.API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured.'}) };
  }

  try {
    const { transcript } = JSON.parse(event.body || '{}');
    if (!transcript) {
      return { statusCode: 400, body: 'Transcript is required' };
    }
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: transcript,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    const jsonText = response.text;
    const reportData: Omit<ReportData, 'workplaces'> & { workplaces: { locationName: string }[] } = JSON.parse(jsonText);
    
    const finalReportData: ReportData = {
        ...reportData,
        workplaces: reportData.workplaces.map(wp => ({...wp, photos: []}))
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(finalReportData),
    };

  } catch (error) {
    console.error("Error processing transcript with Gemini:", error);
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process transcript.", details: errorMessage }),
    };
  }
};
