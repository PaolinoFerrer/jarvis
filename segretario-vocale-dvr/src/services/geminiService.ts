import type { ReportData } from '../types';

export const processTranscript = async (transcript: string): Promise<ReportData> => {
  try {
    const response = await fetch('/.netlify/functions/process-transcript', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      // FIX: Removed invalid escape character before the template literal's opening backtick.
      throw new Error(`Errore dal server: ${response.status} ${errorBody}`);
    }

    const structuredData: ReportData = await response.json();
    return structuredData;
    
  } catch (error) {
    console.error("Error calling the processing function:", error);
    throw new Error("Impossibile contattare il servizio di elaborazione.");
  }
};
