import React, { useState } from 'react';
import { Network, HelpCircle, Info, Building2, School, Hotel, Plane, Heart, Home } from 'lucide-react';
import { useMasterKey } from '../../context/MasterKeyContext';
import { STANDARDS } from '../../utils/standards';

const Step1_5HierarchyPlanning = ({ onNext, onBack, projectDoors = [], showNotice }) => {
  const { mkProject, standard, updateMKProject } = useMasterKey();
  const [selectedLevel, setSelectedLevel] = useState(mkProject?.hierarchyLevels || null);
  const [isSaving, setIsSaving] = useState(false);

  const standardConfig = STANDARDS[standard];
  const isANSI = standard === 'ANSI_BHMA';
  const totalDoors = projectDoors.length;

  // Calculate estimated key counts based on hierarchy level
  const calculateKeyCounts = (level) => {
    if (totalDoors === 0) return { total: 0, breakdown: [] };

    switch (level) {
      case 1: // SKD/KD
        return {
          total: 1,
          breakdown: [
            { label: 'Single Key', count: 1 }
          ]
        };
      case 2: // Simple Master
        const zones2 = Math.max(2, Math.ceil(totalDoors / 10));
        return {
          total: zones2 + 1,
          breakdown: [
            { label: 'Master Key', count: 1 },
            { label: 'Change Keys', count: zones2 }
          ]
        };
      case 3: // Grand Master (RECOMMENDED)
        const zones3 = Math.max(3, Math.ceil(totalDoors / 8));
        const masters3 = Math.max(2, Math.ceil(zones3 / 3));
        return {
          total: 1 + masters3 + zones3,
          breakdown: [
            { label: 'Grand Master Key', count: 1 },
            { label: 'Master Keys', count: masters3 },
            { label: 'Change Keys', count: zones3 }
          ]
        };
      case 4: // Great Grand Master
        const zones4 = Math.max(4, Math.ceil(totalDoors / 6));
        const masters4 = Math.max(3, Math.ceil(zones4 / 4));
        const grandMasters4 = Math.max(2, Math.ceil(masters4 / 2));
        return {
          total: 1 + grandMasters4 + masters4 + zones4,
          breakdown: [
            { label: 'Great Grand Master', count: 1 },
            { label: 'Grand Master Keys', count: grandMasters4 },
            { label: 'Master Keys', count: masters4 },
            { label: 'Change Keys', count: zones4 }
          ]
        };
      default:
        return { total: 0, breakdown: [] };
    }
  };

  // Get ASCII diagrams for each level
  const getANSIDiagram = (level) => {
    switch (level) {
      case 1:
        return `
  ┌──────────────┐
  │   SKD / KD   │  Single Key Opens All Doors
  │              │  (Keyed Alike or Keyed Different)
  └──────────────┘
        │
        ▼
    All Doors`;

      case 2:
        return `
       ┌─────┐
       │  A  │  Master Key (Opens All)
       └─────┘
          │
    ┌─────┼─────┐
    │     │     │
  ┌───┐ ┌───┐ ┌───┐
  │AA1│ │AA2│ │AA3│  Change Keys (Zone/Area Specific)
  └───┘ └───┘ └───┘
    │     │     │
  Zone1 Zone2 Zone3`;

      case 3:
        return `
         ┌─────┐
         │  A  │  Grand Master Key (Opens All)
         └─────┘
            │
      ┌─────┼─────┐
      │           │
   ┌─────┐     ┌─────┐
   │ AA  │     │ AB  │  Master Keys (Building/Floor)
   └─────┘     └─────┘
      │           │
   ┌──┼──┐     ┌──┼──┐
   │  │  │     │  │  │
 ┌───┐┌───┐ ┌───┐┌───┐
 │AA1││AA2│ │AB1││AB2│  Change Keys (Rooms/Doors)
 └───┘└───┘ └───┘└───┘`;

      case 4:
        return `
           ┌─────┐
           │  A  │  Great Grand Master (Opens All)
           └─────┘
              │
         ┌────┼────┐
         │         │
      ┌─────┐   ┌─────┐
      │ AA  │   │ AB  │  Grand Master Keys (Campus/Building)
      └─────┘   └─────┘
         │         │
      ┌──┼──┐   ┌──┼──┐
   ┌────┐ ┌────┐ │   │
   │AAA │ │AAB │ ... ...  Master Keys (Floors/Wings)
   └────┘ └────┘
      │      │
   ┌──┼──┐ ┌─┼─┐
 ┌────┐┌────┐ ... ...
 │AAA1││AAA2│           Change Keys (Individual Rooms)
 └────┘└────┘`;

      default:
        return '';
    }
  };

  const getENDiagram = (level) => {
    switch (level) {
      case 1:
        return `
  ┌──────────────┐
  │   SKD / KD   │  Single Key Opens All Doors
  │              │  (Keyed Alike or Keyed Different)
  └──────────────┘
        │
        ▼
    All Doors`;

      case 2:
        return `
       ┌──────┐
       │  MK  │  Master Key (Opens All)
       └──────┘
          │
    ┌─────┼─────┐
    │     │     │
  ┌────┐┌────┐┌────┐
  │CK-1││CK-2││CK-3│  User Keys (Zone/Area Specific)
  └────┘└────┘└────┘
    │     │     │
  Zone1 Zone2 Zone3`;

      case 3:
        return `
         ┌──────┐
         │ GMK  │  General Master Key (Opens All)
         └──────┘
            │
      ┌─────┼─────┐
      │           │
   ┌──────┐   ┌──────┐
   │ MK-1 │   │ MK-2 │  Master Keys (Building/Floor)
   └──────┘   └──────┘
      │           │
   ┌──┼──┐     ┌──┼──┐
   │  │  │     │  │  │
 ┌────┐┌────┐┌────┐┌────┐
 │CK-1││CK-2││CK-3││CK-4│  User Keys (Rooms/Doors)
 └────┘└────┘└────┘└────┘`;

      case 4:
        return `
           ┌──────┐
           │ GGMK │  Great General Master (Opens All)
           └──────┘
              │
         ┌────┼────┐
         │         │
      ┌──────┐ ┌──────┐
      │GMK-1 │ │GMK-2 │  General Master Keys (Campus/Building)
      └──────┘ └──────┘
         │         │
      ┌──┼──┐   ┌──┼──┐
   ┌─────┐┌─────┐ │   │
   │MK-1 ││MK-2 │ ... ...  Master Keys (Floors/Wings)
   └─────┘└─────┘
      │      │
   ┌──┼──┐ ┌─┼─┐
 ┌────┐┌────┐ ... ...
 │CK-1││CK-2│             User Keys (Individual Rooms)
 └────┘└────┘`;

      default:
        return '';
    }
  };

  // Get use case descriptions
  const getUseCases = (level) => {
    const cases = {
      1: ['Small residential', 'Storage units', 'Single-tenant facilities'],
      2: ['Small offices', 'Retail stores', 'Apartment buildings', 'Small schools'],
      3: ['Commercial offices', 'Hospitals', 'Universities', 'Hotels', 'Large schools'],
      4: ['Multi-building campuses', 'Airport terminals', 'Hospital systems', 'Corporate headquarters']
    };
    return cases[level] || [];
  };

  const handleSelectLevel = async (level) => {
    setSelectedLevel(level);
    setIsSaving(true);

    try {
      await updateMKProject({
        hierarchyLevels: level
      });
    } catch (err) {
      console.error('Failed to save hierarchy level:', err);
      if (showNotice) {
        await showNotice('Error', `Failed to save selection: ${err.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const showNomenclatureHelp = async () => {
    const helpContent = isANSI
      ? `ANSI/BHMA Nomenclature:

• A = Great Grand Master Key (GGMK)
• AA = Grand Master Key (GMK)
• AAA = Master Key (MK)
• AAAA = Sub-Master Key (SMK)
• AAAAA = Change Key (CK)

Pattern: Each level adds one letter "A"

Example System:
  A → AA → AAA → AAA1

Keys are numbered sequentially:
  AA1, AA2, AA3...
  AAA1, AAA2, AAA3...`
      : `EN 1303 Nomenclature:

• GGMK = Great General Master Key
• GMK = General Master Key
• MK = Master Key
• SK = Sub-Key
• UK / CK = User Key / Change Key

Pattern: Descriptive abbreviations

Example System:
  GMK → MK-1 → CK-101

Keys use zone/building codes:
  MK-1, MK-2, MK-3...
  CK-101, CK-102, CK-103...`;

    await showNotice(
      isANSI ? 'ANSI/BHMA Key Symbols' : 'EN 1303 Key Symbols',
      helpContent
    );
  };

  // Hierarchy level options
  const hierarchyOptions = [
    {
      level: 1,
      title: 'Single Key (SKD/KD)',
      subtitle: 'All doors keyed alike or different',
      recommended: false,
      icon: Home
    },
    {
      level: 2,
      title: isANSI ? '2-Level System' : '2-Level System',
      subtitle: isANSI ? 'Master → Change Keys' : 'Master → User Keys',
      recommended: false,
      icon: Building2
    },
    {
      level: 3,
      title: isANSI ? '3-Level System' : '3-Level System',
      subtitle: isANSI ? 'Grand Master → Master → Change' : 'General Master → Master → User',
      recommended: true,
      icon: School
    },
    {
      level: 4,
      title: isANSI ? '4-Level System' : '4-Level System',
      subtitle: isANSI ? 'Great GM → GM → Master → Change' : 'Great GM → GM → Master → User',
      recommended: false,
      icon: Plane
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pb-6 border-b border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <Network className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Hierarchy Planning</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Choose the hierarchy depth for your master key system based on {standardConfig.name}.
        </p>
      </div>

      {/* Standard Info Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-indigo-900">Current Standard: {standardConfig.name}</h3>
            </div>
            <p className="text-sm text-indigo-700 mb-2">
              {isANSI ? 'North American' : 'European'} standard • {standardConfig.pinConfig.pins} pins, {standardConfig.pinConfig.depths} depths
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={showNomenclatureHelp}
                className="text-xs text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
              >
                <HelpCircle size={14} />
                View key naming conventions
              </button>
            </div>
          </div>
          {totalDoors > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">{totalDoors}</div>
              <div className="text-xs text-indigo-700">Total Doors</div>
            </div>
          )}
        </div>
      </div>

      {/* Hierarchy Level Selection Cards */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Select Hierarchy Level</h3>

        {hierarchyOptions.map((option) => {
          const IconComponent = option.icon;
          const keyCounts = calculateKeyCounts(option.level);
          const isSelected = selectedLevel === option.level;
          const useCases = getUseCases(option.level);

          return (
            <button
              key={option.level}
              onClick={() => handleSelectLevel(option.level)}
              disabled={isSaving}
              className={`w-full text-left transition-all ${
                isSelected
                  ? 'bg-indigo-50 border-2 border-indigo-600 shadow-lg scale-[1.02]'
                  : 'bg-white border-2 border-gray-200 hover:border-indigo-300 hover:shadow-md'
              } rounded-xl p-6 relative`}
            >
              {/* Recommended Badge */}
              {option.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <span>⭐</span> RECOMMENDED
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Side: Info and Diagram */}
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-indigo-100' : 'bg-gray-100'
                    }`}>
                      <IconComponent className={`w-7 h-7 ${isSelected ? 'text-indigo-600' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-lg font-bold mb-1 ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                        {option.title}
                      </h4>
                      <p className={`text-sm ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
                        {option.subtitle}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* ASCII Diagram */}
                  <div className={`rounded-lg p-4 mb-4 ${
                    isSelected ? 'bg-white border border-indigo-200' : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <pre className={`text-xs font-mono leading-relaxed overflow-x-auto ${
                      isSelected ? 'text-indigo-900' : 'text-gray-700'
                    }`}>
                      {isANSI ? getANSIDiagram(option.level) : getENDiagram(option.level)}
                    </pre>
                  </div>
                </div>

                {/* Right Side: Use Cases and Key Counts */}
                <div className="space-y-4">
                  {/* Use Cases */}
                  <div>
                    <h5 className={`text-sm font-bold mb-2 ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                      Typical Use Cases:
                    </h5>
                    <ul className="space-y-1">
                      {useCases.map((useCase, idx) => (
                        <li key={idx} className={`text-sm flex items-start gap-2 ${
                          isSelected ? 'text-indigo-700' : 'text-gray-600'
                        }`}>
                          <span className={isSelected ? 'text-indigo-500' : 'text-gray-400'}>•</span>
                          <span>{useCase}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Estimated Key Counts */}
                  {totalDoors > 0 && (
                    <div className={`rounded-lg p-4 ${
                      isSelected ? 'bg-white border border-indigo-200' : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <h5 className={`text-sm font-bold mb-3 ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                        Estimated Key Count for {totalDoors} doors:
                      </h5>
                      <div className="space-y-2">
                        {keyCounts.breakdown.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className={`text-xs ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
                              {item.label}
                            </span>
                            <span className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                              {item.count}
                            </span>
                          </div>
                        ))}
                        <div className={`pt-2 mt-2 border-t ${
                          isSelected ? 'border-indigo-200' : 'border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                              Total Keys:
                            </span>
                            <span className={`text-xl font-bold ${isSelected ? 'text-indigo-600' : 'text-gray-900'}`}>
                              {keyCounts.total}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Next Step Info */}
      {selectedLevel && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Next Step:</strong> You'll define the specific hierarchy levels and key symbols based on your {selectedLevel}-level system selection.
          </p>
        </div>
      )}
    </div>
  );
};

export default Step1_5HierarchyPlanning;
