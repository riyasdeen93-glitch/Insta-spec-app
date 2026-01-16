import React, { useState } from 'react';
import { MapPin, Plus, Trash2, Sparkles, Layers } from 'lucide-react';
import { useMasterKey } from '../../context/MasterKeyContext';

const Step3ZoneDefinition = ({ onNext, onBack, projectDoors = [], showNotice, showConfirm }) => {
  const {
    mkProject,
    zones,
    mkApproach,
    createZone,
    autoGenerateZones,
    deleteZone,
  } = useMasterKey();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    zoneName: '',
    color: '#3B82F6'
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const colorOptions = [
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Green', value: '#10B981' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Teal', value: '#14B8A6' },
  ];

  const handleAutoGenerate = async () => {
    if (projectDoors.length === 0) {
      if (showNotice) {
        await showNotice('No Doors Found', 'No doors found in project. Please add doors in Step 1 first.');
      }
      return;
    }

    // Ask for confirmation always (whether replacing or creating new)
    const confirmMessage = zones.length > 0
      ? 'This will replace existing zones. Continue?'
      : `Auto-generate ${projectDoors.length} zone${projectDoors.length !== 1 ? 's' : ''} based on your door data?`;

    const confirmTitle = zones.length > 0 ? 'Replace Zones' : 'Generate Zones';

    const confirmed = showConfirm
      ? await showConfirm(confirmTitle, confirmMessage, zones.length > 0 ? 'Yes, Replace' : 'Generate', 'Cancel')
      : confirm(confirmMessage);

    if (!confirmed) {
      return;
    }

    // Delete existing zones if any
    if (zones.length > 0) {
      for (const zone of zones) {
        await deleteZone(zone.zoneId);
      }
    }

    setIsGenerating(true);
    try {
      await autoGenerateZones(projectDoors, mkApproach);
      if (showNotice) {
        await showNotice('Success', 'Zones generated successfully!');
      }
    } catch (err) {
      if (showNotice) {
        await showNotice('Error', `Failed to generate zones: ${err.message}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddZone = async (e) => {
    e.preventDefault();
    try {
      await createZone({
        ...formData,
        doorCount: 0
      });
      setShowAddForm(false);
      setFormData({ zoneName: '', color: '#3B82F6' });
    } catch (err) {
      if (showNotice) {
        await showNotice('Error', `Failed to create zone: ${err.message}`);
      }
    }
  };

  const handleDeleteZone = async (zoneId) => {
    const confirmed = showConfirm
      ? await showConfirm('Delete Zone', 'Delete this zone?', 'Yes, Delete', 'Cancel')
      : confirm('Delete this zone?');

    if (confirmed) {
      try {
        await deleteZone(zoneId);
      } catch (err) {
        if (showNotice) {
          await showNotice('Error', `Failed to delete zone: ${err.message}`);
        }
      }
    }
  };

  const getApproachLabel = () => {
    switch (mkApproach) {
      case 'zone_based':
        return 'by Building Zones';
      case 'floor_based':
        return 'by Floor Levels';
      case 'functional':
        return 'by Functional Use';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pb-6 border-b border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <MapPin className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Zone Definition</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Create zones to organize your doors for master key assignment.
        </p>
      </div>

      {/* Auto-Generate Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <Sparkles className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">Auto-Generate Zones</h3>
            <p className="text-sm text-gray-600 mb-3">
              Automatically create zones {getApproachLabel()} from your project's {projectDoors.length} door{projectDoors.length !== 1 ? 's' : ''}.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleAutoGenerate}
                disabled={isGenerating || projectDoors.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate Zones
                  </>
                )}
              </button>
              {projectDoors.length === 0 && (
                <span className="text-sm text-gray-500 self-center">
                  No doors available in project
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Zone List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Defined Zones
          </h3>
          {zones.length > 0 && (
            <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
              <span className="text-sm font-semibold text-emerald-800">
                {zones.length} zone{zones.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {zones.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No zones defined yet.</p>
            <p className="text-sm text-gray-400">
              Auto-generate zones or add them manually to get started.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {zones.map(zone => (
              <div
                key={zone.zoneId}
                className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: zone.color + '20', border: `2px solid ${zone.color}` }}
                >
                  <MapPin size={20} style={{ color: zone.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{zone.zoneName}</div>
                  <div className="text-sm text-gray-500">
                    {zone.doorCount || 0} door{zone.doorCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteZone(zone.zoneId)}
                  className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete zone"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Zone Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add Custom Zone
        </button>
      )}

      {/* Add Zone Form */}
      {showAddForm && (
        <form onSubmit={handleAddZone} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-gray-900">Add Custom Zone</h4>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Zone Name</label>
            <input
              type="text"
              value={formData.zoneName}
              onChange={(e) => setFormData({...formData, zoneName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., East Wing, Admin Area, Building A"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Zone Color</label>
            <div className="grid grid-cols-8 gap-2">
              {colorOptions.map(colorOption => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setFormData({...formData, color: colorOption.value})}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    formData.color === colorOption.value
                      ? 'border-gray-900 scale-110 shadow-md'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: colorOption.value }}
                  title={colorOption.name}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Zone
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setFormData({ zoneName: '', color: '#3B82F6' });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Info Banner */}
      {zones.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Next Step:</strong> You'll assign doors to specific hierarchy levels within these zones.
          </p>
        </div>
      )}
    </div>
  );
};

export default Step3ZoneDefinition;
