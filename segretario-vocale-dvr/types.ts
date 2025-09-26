export interface NonConformity {
  description: string;
  riskLevel: 'Basso' | 'Medio' | 'Alto';
  violatedNorm?: string;
}

export interface LocationData {
  locationName: string;
  photos: string[]; // Array of base64 encoded image strings
}

export interface Asset {
  name: string;
  type: 'Macchinario' | 'Impianto' | 'Attrezzatura' | 'Sostanza';
  notes?: string;
}

export interface WorkerGroup {
  name: string;
  tasks: string;
}

export interface Activity {
  name: string;
  workplace: string;
  assets: string[];
  workerGroups: string[];
  nonConformities: NonConformity[];
}

export interface ReportData {
  workplaces: LocationData[];
  assets: Asset[];
  workerGroups: WorkerGroup[];
  activities: Activity[];
}