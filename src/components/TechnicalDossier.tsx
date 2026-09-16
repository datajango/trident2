import React, { useState } from 'react';
import { TECHNICAL_DOSSIER, TechFact } from '../data/dossierData';
import { soundFx } from '../audio/soundEngine';
import { 
  BookOpen, 
  Layers, 
  ChevronRight, 
  Radio, 
  Rocket, 
  Sparkles, 
  Compass, 
  FileText,
  ShieldAlert
} from 'lucide-react';

export const TechnicalDossier: React.FC = () => {
  const [selectedFactId, setSelectedFactId] = useState<string>(TECHNICAL_DOSSIER[0].id);

  const currentFact = TECHNICAL_DOSSIER.find((f) => f.id === selectedFactId) || TECHNICAL_DOSSIER[0];

  const handleSelectFact = (id: string) => {
    soundFx.playClick();
    setSelectedFactId(id);
  };

  const getCategoryIcon = (cat: TechFact['category']) => {
    switch (cat) {
      case 'SHIP':
        return <Radio className="w-4 h-4 text-sky-400" />;
      case 'MISSILE':
        return <Rocket className="w-4 h-4 text-amber-400" />;
      case 'GUIDANCE':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'APOLLO':
        return <Compass className="w-4 h-4 text-purple-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 p-4 text-slate-100 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-md font-mono">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-wider">
              STRATEGIC SYSTEMS &amp; APOLLO ARCHIVAL DOSSIER
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Declassified Historical Technical Logs • USNS Vanguard &amp; UGM-133A Guidance Systems
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
          <span className="text-slate-400">ARCHIVE CLASS:</span>
          <span className="text-amber-400 font-bold">UNCLASSIFIED / HISTORICAL RECORD</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="md:col-span-4 flex flex-col gap-2 font-mono">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
            DOCUMENT INDEX
          </span>

          {TECHNICAL_DOSSIER.map((fact) => {
            const isSelected = fact.id === selectedFactId;
            return (
              <button
                key={fact.id}
                onClick={() => handleSelectFact(fact.id)}
                className={`p-3 rounded-lg border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-amber-500 shadow-md text-white'
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {getCategoryIcon(fact.category)}
                  <div>
                    <div className="font-bold text-slate-200 leading-snug">{fact.title}</div>
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">{fact.category}</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-600'}`} />
              </button>
            );
          })}
        </div>

        {/* Document Content View */}
        <div className="md:col-span-8 bg-slate-950 p-6 rounded-lg border border-slate-800 shadow-xl flex flex-col gap-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold mb-1">
              {getCategoryIcon(currentFact.category)}
              <span>CATEGORY: {currentFact.category}</span>
            </div>
            <h3 className="text-xl font-bold text-white font-mono tracking-wide">{currentFact.title}</h3>
            <p className="text-xs text-slate-400 mt-1 font-sans">{currentFact.shortDesc}</p>
          </div>

          {/* Detailed Analysis Markdown-like text */}
          <div className="text-xs text-slate-300 font-sans leading-relaxed space-y-3 whitespace-pre-line bg-slate-900/50 p-4 rounded-lg border border-slate-850">
            {currentFact.fullAnalysis}
          </div>

          {/* Technical Specifications Table if available */}
          {currentFact.specTable && (
            <div className="font-mono">
              <span className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                ENGINEERING SPECIFICATIONS
              </span>
              <div className="border border-slate-850 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <tbody>
                    {currentFact.specTable.map((row, idx) => (
                      <tr 
                        key={idx} 
                        className={idx % 2 === 0 ? 'bg-slate-900/60' : 'bg-slate-950'}
                      >
                        <td className="p-2.5 text-slate-400 font-semibold border-b border-slate-850 w-1/3">
                          {row.label}
                        </td>
                        <td className="p-2.5 text-slate-200 border-b border-slate-850">
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
