import React, { useCallback, useState } from 'react';
import type { ReportData, Activity } from '../types';
import { LocationCard } from './LocationCard';
import { CopyIcon, TrashIcon, CubeIcon, UsersIcon, ClipboardListIcon, MapPinIcon } from './Icons';

interface ReportDisplayProps {
  report: ReportData;
  hasData: boolean;
  onAddPhoto: (locationName: string, photoData: string) => void;
  onClearReport: () => void;
}

type Tab = 'activities' | 'workplaces' | 'assets' | 'workerGroups';

const reportToMarkdown = (report: ReportData): string => {
  let markdown = "# Report Sopralluogo DVR\n\n";

  markdown += "## 1. Luoghi di Lavoro\n";
  if(report.workplaces.length > 0) {
    report.workplaces.forEach(wp => markdown += `- \${wp.locationName}\n`);
  } else {
    markdown += "Nessuno\n";
  }

  markdown += "\n## 2. Macchinari, Impianti, Attrezzature, Sostanze\n";
    if(report.assets.length > 0) {
    report.assets.forEach(a => markdown += `- \${a.name} (\${a.type})\n`);
  } else {
    markdown += "Nessuno\n";
  }

  markdown += "\n## 3. Gruppi Omogenei di Lavoratori\n";
    if(report.workerGroups.length > 0) {
    report.workerGroups.forEach(wg => markdown += `- \${wg.name} (Mansioni: \${wg.tasks})\n`);
  } else {
    markdown += "Nessuno\n";
  }
  
  markdown += "\n## 4. Attività e Analisi Rischi\n";
  if(report.activities.length > 0) {
    report.activities.forEach(act => {
      markdown += \`### Attività: \${act.name}\n\`;
      markdown += \`- **Luogo:** \${act.workplace}\n\`;
      markdown += \`- **Lavoratori:** \${act.workerGroups.join(', ')}\n\`;
      markdown += \`- **Attrezzature:** \${act.assets.join(', ')}\n\`;
      markdown += "**Non Conformità Rilevate:**\n";
      act.nonConformities.forEach(nc => {
          markdown += \`  - **Descrizione:** \${nc.description}\n\`;
          markdown += \`    - **Livello Rischio:** \${nc.riskLevel}\n\`;
          if(nc.violatedNorm) markdown += \`    - **Norma Violata:** \${nc.violatedNorm}\n\`;
      });
      markdown += "\n";
    });
  } else {
    markdown += "Nessuna\n";
  }

  markdown += "\n---\n\n## Piano di Miglioramento\n";
  const allNonConformities = report.activities.flatMap(a => a.nonConformities.map(nc => ({ ...nc, workplace: a.workplace })));
  if (allNonConformities.length > 0) {
     const grouped = allNonConformities.reduce((acc, nc) => {
      (acc[nc.workplace] = acc[nc.workplace] || []).push(nc);
      return acc;
    }, {} as Record<string, typeof allNonConformities>);

    for (const workplace in grouped) {
      markdown += \`### Luogo: \${workplace}\n\`;
      grouped[workplace].forEach(nc => {
        markdown += \`- [ ] **[\${nc.riskLevel}]** \${nc.description} (Rif: \${nc.violatedNorm || 'N/A'})\n\`;
      });
    }
  } else {
    markdown += "Nessuna non conformità rilevata.\n";
  }

  return markdown;
};


const RiskBadge: React.FC<{ level: 'Basso' | 'Medio' | 'Alto' }> = ({ level }) => {
  const styles = {
    Basso: 'bg-green-800 text-green-300 border-green-600',
    Medio: 'bg-yellow-800 text-yellow-300 border-yellow-600',
    Alto: 'bg-red-800 text-red-300 border-red-600',
  };
  return <span className={\`px-2 py-1 text-xs font-bold rounded-full border \${styles[level]}\`}>{level.toUpperCase()}</span>;
};

const ActivityCard: React.FC<{ activity: Activity }> = ({ activity }) => (
  <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
    <div className="p-4 bg-slate-800/50 border-b border-slate-700">
      <h3 className="text-lg font-bold text-cyan-400">{activity.name}</h3>
      <div className="text-xs text-slate-400 mt-1 space-x-4">
        <span><MapPinIcon className="h-3 w-3 inline mr-1"/>{activity.workplace}</span>
        <span><UsersIcon className="h-3 w-3 inline mr-1"/>{activity.workerGroups.join(', ')}</span>
        <span><CubeIcon className="h-3 w-3 inline mr-1"/>{activity.assets.join(', ')}</span>
      </div>
    </div>
    <div className="p-4">
      <h4 className="font-semibold mb-2 text-slate-300">Non Conformità Rilevate:</h4>
      {activity.nonConformities.length > 0 ? (
        <ul className="space-y-3">
          {activity.nonConformities.map((nc, index) => (
            <li key={index} className="p-3 bg-slate-900/50 rounded-md border border-slate-600/50">
              <div className="flex justify-between items-start">
                  <p className="font-medium text-gray-200 flex-1 pr-4">{nc.description}</p>
                  <RiskBadge level={nc.riskLevel} />
              </div>
              {nc.violatedNorm && (
                  <p className="text-sm mt-2 text-amber-400 font-mono bg-amber-900/30 px-2 py-1 rounded inline-block">
                      <i className="fa-solid fa-book-open mr-2"></i>
                      Norma: {nc.violatedNorm}
                  </p>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-400">Nessuna non conformità specifica per questa attività.</p>}
    </div>
  </div>
);


const ImprovementPlan: React.FC<{ activities: Activity[] }> = ({ activities }) => {
  const allNonConformities = activities.flatMap(a => a.nonConformities.map(nc => ({ ...nc, workplace: a.workplace })));
  
  if (allNonConformities.length === 0) {
    return null;
  }

  const groupedByWorkplace = allNonConformities.reduce((acc, nc) => {
    (acc[nc.workplace] = acc[nc.workplace] || []).push(nc);
    return acc;
  }, {} as Record<string, typeof allNonConformities>);

  return (
    <div className="mt-8 p-6 bg-slate-900/50 rounded-xl border border-slate-700">
      <h2 className="text-2xl font-bold mb-4 text-amber-400">Piano di Miglioramento</h2>
      {Object.keys(groupedByWorkplace).map(workplace => (
        <div key={workplace} className="mb-6">
          <h3 className="text-lg font-semibold text-cyan-400 border-b border-slate-600 pb-2 mb-3">{workplace}</h3>
          <ul className="space-y-3">
            {groupedByWorkplace[workplace].map((nc, index) => (
              <li key={index} className="flex items-start gap-4">
                <RiskBadge level={nc.riskLevel} />
                <div>
                  <p className="text-gray-200">{nc.description}</p>
                  {nc.violatedNorm && <p className="text-xs text-slate-400 font-mono">Rif. Norma: {nc.violatedNorm}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};


export const ReportDisplay: React.FC<ReportDisplayProps> = ({ report, hasData, onAddPhoto, onClearReport }) => {
  const [activeTab, setActiveTab] = useState<Tab>('activities');

  const handleCopyReport = useCallback(() => {
    if(navigator.clipboard) {
      const markdown = reportToMarkdown(report);
      navigator.clipboard.writeText(markdown).then(() => {
        alert('Report completo copiato negli appunti in formato Markdown!');
      }, () => {
        alert('Errore durante la copia del report.');
      });
    }
  }, [report]);

  if (!hasData) {
    return (
        <div className="text-center py-16 px-6 bg-slate-800/50 mt-6 rounded-xl border border-dashed border-slate-700">
            <i className="fa-solid fa-file-lines text-5xl text-slate-600"></i>
            <h3 className="mt-4 text-xl font-semibold text-slate-300">Nessun dato nel report</h3>
            <p className="text-slate-400 mt-1">Avvia una dettatura per iniziare a compilare il tuo report di sopralluogo.</p>
        </div>
    );
  }
  
  const TabButton: React.FC<{tab: Tab, label: string, icon: React.ReactNode}> = ({tab, label, icon}) => (
     <button onClick={() => setActiveTab(tab)} className={\`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors \${activeTab === tab ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}\`}>
        {icon}
        {label}
    </button>
  );

  return (
    <div className="mt-8">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold">Report Sopralluogo</h2>
            <div className="flex gap-2">
                <button onClick={handleCopyReport} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm">
                    <CopyIcon className="h-4 w-4" />
                    Copia Report
                </button>
                 <button onClick={onClearReport} className="flex items-center gap-2 bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm">
                    <TrashIcon className="h-4 w-4" />
                    Svuota
                </button>
            </div>
        </div>
      
      <div className="mb-6 p-2 bg-slate-800 rounded-lg flex flex-wrap gap-2">
        <TabButton tab="activities" label="Attività e Rischi" icon={<ClipboardListIcon className="h-5 w-5"/>} />
        <TabButton tab="workplaces" label="Luoghi di Lavoro" icon={<MapPinIcon className="h-5 w-5"/>} />
        <TabButton tab="assets" label="Macchinari/Altro" icon={<CubeIcon className="h-5 w-5"/>} />
        <TabButton tab="workerGroups" label="Lavoratori" icon={<UsersIcon className="h-5 w-5"/>} />
      </div>

      <div className="space-y-6">
        {activeTab === 'activities' && report.activities.map((activity, index) => <ActivityCard key={index} activity={activity} />)}
        {activeTab === 'workplaces' && report.workplaces.map((location, index) => <LocationCard key={index} location={location} onAddPhoto={onAddPhoto} />)}
        {activeTab === 'assets' && report.assets.map((asset, index) => (
            <div key={index} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <h3 className="font-bold text-white">{asset.name}</h3>
                <p className="text-sm text-slate-400">{asset.type} {asset.notes ? \`- \${asset.notes}\` : ''}</p>
            </div>
        ))}
        {activeTab === 'workerGroups' && report.workerGroups.map((group, index) => (
            <div key={index} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <h3 className="font-bold text-white">{group.name}</h3>
                <p className="text-sm text-slate-400">Mansioni: {group.tasks}</p>
            </div>
        ))}
      </div>
      
      <ImprovementPlan activities={report.activities} />

    </div>
  );
};