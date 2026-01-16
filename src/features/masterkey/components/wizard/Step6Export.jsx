import React, { useState } from 'react';
import { Download, FileText, Table, FileSpreadsheet, CheckCircle2, Sparkles } from 'lucide-react';
import { useMasterKey } from '../../context/MasterKeyContext';
import { exportMasterKeySchedule } from '../../utils/exportGenerator';

const Step6Export = ({ onNext, onBack, projectDoors = [], onExportComplete, showNotice }) => {
  const {
    mkProject,
    hierarchies,
    zones,
    assignments,
    generateExport,
  } = useMasterKey();

  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const exportFormats = [
    {
      id: 'pdf',
      name: 'PDF Document',
      description: 'Professional keying schedule with visual hierarchy tree',
      icon: FileText,
      color: 'red',
      features: ['Complete keying schedule', 'Visual hierarchy tree', 'Door assignments table', 'Standards compliance report']
    },
    {
      id: 'excel',
      name: 'Excel Workbook',
      description: 'Spreadsheet with multiple sheets for analysis',
      icon: FileSpreadsheet,
      color: 'green',
      features: ['Keying schedule sheet', 'Cutting list sheet', 'Statistics sheet', 'Sortable and filterable']
    },
    {
      id: 'csv',
      name: 'CSV Files',
      description: 'Simple text files for custom processing',
      icon: Table,
      color: 'blue',
      features: ['Keying schedule CSV', 'Door assignments CSV', 'Hierarchy levels CSV', 'Compatible with all systems']
    }
  ];

  const selectedFormatConfig = exportFormats.find(f => f.id === selectedFormat);

  const handleExport = async () => {
    setIsExporting(true);
    setExportComplete(false);

    try {
      // Generate export data from context
      const exportData = await generateExport(selectedFormat, {
        includeHierarchy: true,
        includeZones: true,
        includeCuttingList: true
      }, projectDoors);

      console.log('Export data generated:', exportData);

      // Use the export generator to create and download the file
      const result = exportMasterKeySchedule(selectedFormat, exportData);

      if (result.success) {
        setExportComplete(true);
        // Notify parent component that export is complete
        if (onExportComplete) {
          onExportComplete();
        }
        // Show success message after a brief delay to ensure file download starts
        setTimeout(async () => {
          if (showNotice) {
            await showNotice(
              'Export Successful',
              `${selectedFormatConfig.name} generated successfully!\n\nFile: ${result.filename}\n\nYour keying schedule has been downloaded and is ready to share with locksmiths and facility managers.`
            );
          }
        }, 500);
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (err) {
      console.error('Export error:', err);
      if (showNotice) {
        await showNotice(
          'Export Failed',
          `Export failed: ${err.message}\n\nPlease ensure all required packages are installed:\nnpm install jspdf jspdf-autotable xlsx file-saver`
        );
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pb-6 border-b border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
          <Download className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Export & Download</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Generate professional keying schedules and cutting lists in your preferred format.
        </p>
      </div>

      {/* Congratulations Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-emerald-900 mb-1">
              Master Key System Complete!
            </h3>
            <p className="text-sm text-emerald-700">
              You've successfully designed a professional master key system. Download your keying schedule below.
            </p>
          </div>
        </div>
      </div>

      {/* Project Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Project Summary</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Total Doors</div>
            <div className="text-2xl font-bold text-gray-900">{projectDoors.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Hierarchy Levels</div>
            <div className="text-2xl font-bold text-indigo-600">{hierarchies.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Zones Defined</div>
            <div className="text-2xl font-bold text-purple-600">{zones.length}</div>
          </div>
        </div>
      </div>

      {/* Export Format Selection */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Select Export Format</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {exportFormats.map(format => {
            const Icon = format.icon;
            const isSelected = selectedFormat === format.id;

            return (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`p-6 border-2 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 shadow-md'
                    : 'border-gray-200 hover:border-indigo-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-indigo-100' : 'bg-gray-100'
                  }`}>
                    <Icon size={24} className={isSelected ? 'text-indigo-600' : 'text-gray-600'} />
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="text-indigo-600" size={20} />
                  )}
                </div>
                <div className="font-bold text-gray-900 mb-1">{format.name}</div>
                <div className="text-sm text-gray-600 mb-3">{format.description}</div>
                <ul className="text-xs text-gray-500 space-y-1">
                  {format.features.map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Format Details */}
      {selectedFormatConfig && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {React.createElement(selectedFormatConfig.icon, {
                size: 24,
                className: 'text-indigo-600'
              })}
            </div>
            <div>
              <div className="font-semibold text-indigo-900 mb-1">
                Ready to export as {selectedFormatConfig.name}
              </div>
              <div className="text-sm text-indigo-700">
                Your export will include: {selectedFormatConfig.features.join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-8 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-3 shadow-lg text-lg font-semibold"
        >
          {isExporting ? (
            <>
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <Download size={24} />
              Generate & Download
            </>
          )}
        </button>
      </div>

      {/* Export Complete Message */}
      {exportComplete && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="flex-shrink-0 text-emerald-600 mt-0.5" size={24} />
            <div>
              <div className="font-semibold text-emerald-900 mb-2">
                Export Generated Successfully!
              </div>
              <div className="text-sm text-emerald-700 mb-3">
                Your {selectedFormatConfig.name.toLowerCase()} has been downloaded and is ready to share.
              </div>
              <div className="text-xs text-emerald-600">
                Check your Downloads folder for the exported file.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>What's Next:</strong> Share your keying schedule with locksmiths and facility managers. You can always return to edit your master key system design.
        </p>
      </div>
    </div>
  );
};

export default Step6Export;
