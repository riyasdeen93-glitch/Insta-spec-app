import React, { useState } from 'react';
import { Network, Plus, Trash2, ChevronRight, Sparkles, Info, CheckCircle2 } from 'lucide-react';
import { useMasterKey } from '../../context/MasterKeyContext';
import { STANDARDS } from '../../utils/standards';
import {
  generateHierarchyPreview,
  generateHierarchyLevels,
  getHierarchyDescription
} from '../../utils/hierarchyGenerator';

const Step2HierarchySetup = ({ onNext, onBack, projectDoors = [], showNotice, showConfirm }) => {
  const {
    mkProject,
    hierarchies,
    hierarchyTree,
    standard,
    mkApproach,
    addHierarchyLevel,
    deleteHierarchyLevel,
    applyHierarchyTemplate,
  } = useMasterKey();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    levelName: '',
    keySymbol: '',
    parentHierarchyId: null
  });
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);

  const standardConfig = STANDARDS[standard];
  const facilityType = mkProject?.facilityType || 'Commercial Office';
  const hierarchyLevels = mkProject?.hierarchyLevels || 3;
  const hierarchyDescription = getHierarchyDescription(standard, hierarchyLevels);

  const handleAutoGenerate = async () => {
    // Generate preview
    const preview = generateHierarchyPreview(standard, hierarchyLevels, mkApproach, projectDoors, facilityType);

    // Build preview message
    let previewMessage = `This will create:\n\n`;

    preview.levels.forEach((level, idx) => {
      previewMessage += `**Level ${level.level}: ${level.name}**\n`;

      if (level.keys && level.keys.length > 0 && level.keys.length <= 10) {
        level.keys.forEach(key => {
          const doorInfo = key.doorCount ? ` (${key.doorCount} doors)` : '';
          previewMessage += `  • ${key.symbol} - ${key.name}${doorInfo}\n`;
        });
      } else if (level.count) {
        previewMessage += `  • ${level.count} key${level.count !== 1 ? 's' : ''} - ${level.description}\n`;
      }

      previewMessage += '\n';
    });

    previewMessage += `**Total Estimated Keys:** ${preview.estimatedTotalKeys}\n\n`;
    previewMessage += `Change keys will be created automatically when you assign doors in Step 4.`;

    // Show confirmation with preview
    const confirmed = showConfirm
      ? await showConfirm('Auto-Generate Hierarchy', previewMessage, 'Generate Hierarchy', 'Cancel')
      : confirm(previewMessage);

    if (!confirmed) {
      return;
    }

    // Delete existing hierarchies if any
    if (hierarchies.length > 0) {
      const replaceConfirmed = showConfirm
        ? await showConfirm('Replace Existing', 'This will replace your existing hierarchy levels. Continue?', 'Yes, Replace', 'Cancel')
        : confirm('This will replace your existing hierarchy levels. Continue?');

      if (!replaceConfirmed) {
        return;
      }

      for (const hierarchy of hierarchies) {
        await deleteHierarchyLevel(hierarchy.hierarchyId);
      }
    }

    setIsAutoGenerating(true);
    try {
      // Generate hierarchy levels
      const levels = generateHierarchyLevels(standard, hierarchyLevels, mkApproach, projectDoors, facilityType);

      // Create levels in Firestore
      let previousLevelId = null;

      for (const level of levels) {
        // Set parent ID for child levels
        const levelData = {
          ...level,
          parentHierarchyId: level.order === 0 ? null : previousLevelId
        };

        // Create level
        await addHierarchyLevel(levelData);

        // Store first level ID for parenting
        if (level.order === 0) {
          // Wait a bit for Firestore to sync
          await new Promise(resolve => setTimeout(resolve, 300));

          // Get the created level ID
          const createdLevels = hierarchies;
          if (createdLevels.length > 0) {
            previousLevelId = createdLevels[0].hierarchyId;
          }
        }
      }

      if (showNotice) {
        await showNotice('Success', `Hierarchy generated successfully!\n\n${levels.length} levels created based on your ${hierarchyLevels}-level plan.`);
      }
    } catch (err) {
      if (showNotice) {
        await showNotice('Error', `Failed to generate hierarchy: ${err.message}`);
      }
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const handleApplyTemplate = async () => {
    const confirmed = showConfirm
      ? await showConfirm('Replace Hierarchy', 'This will replace your current hierarchy. Continue?', 'Yes, Replace', 'Cancel')
      : confirm('This will replace your current hierarchy. Continue?');

    if (confirmed) {
      setIsApplyingTemplate(true);
      try {
        await applyHierarchyTemplate(facilityType);
        if (showNotice) {
          await showNotice('Success', 'Template applied successfully!');
        }
      } catch (err) {
        if (showNotice) {
          await showNotice('Error', `Failed to apply template: ${err.message}`);
        }
      } finally {
        setIsApplyingTemplate(false);
      }
    }
  };

  const handleAddLevel = async (e) => {
    e.preventDefault();
    try {
      await addHierarchyLevel({
        ...formData,
        order: hierarchies.length,
        levelType: 'custom'
      });
      setShowAddForm(false);
      setFormData({ levelName: '', keySymbol: '', parentHierarchyId: null });
    } catch (err) {
      if (showNotice) {
        await showNotice('Error', `Failed to add level: ${err.message}`);
      }
    }
  };

  const handleDeleteLevel = async (hierarchyId) => {
    const confirmed = showConfirm
      ? await showConfirm('Delete Level', 'Delete this hierarchy level?', 'Yes, Delete', 'Cancel')
      : confirm('Delete this hierarchy level?');

    if (confirmed) {
      try {
        await deleteHierarchyLevel(hierarchyId);
      } catch (err) {
        if (showNotice) {
          await showNotice('Error', `Failed to delete: ${err.message}`);
        }
      }
    }
  };

  const renderHierarchyTree = (levels, depth = 0) => {
    return levels.map(level => (
      <div key={level.hierarchyId} style={{ marginLeft: depth * 24 }}>
        <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg mb-2 hover:shadow-sm transition-shadow">
          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <span className="font-bold text-indigo-600">{level.keySymbol}</span>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{level.levelName}</div>
            <div className="text-sm text-gray-500">{level.description || level.levelType}</div>
          </div>
          {depth < 2 && level.children && level.children.length > 0 && (
            <div className="flex-shrink-0 text-xs text-gray-500">
              {level.children.length} child{level.children.length !== 1 ? 'ren' : ''}
            </div>
          )}
          <button
            onClick={() => handleDeleteLevel(level.hierarchyId)}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete level"
          >
            <Trash2 size={16} />
          </button>
        </div>
        {level.children && level.children.length > 0 && renderHierarchyTree(level.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pb-6 border-b border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <Network className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Hierarchy Setup</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Define your master key hierarchy levels based on {standardConfig.name}.
        </p>
      </div>

      {/* Selection Summary Banner (from Step 1.5) */}
      {hierarchyLevels && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-emerald-900">Your Hierarchy Plan</h3>
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs font-bold rounded-full">
                  FROM STEP 1.5
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-emerald-700 font-semibold mb-1">Standard</div>
                  <div className="text-sm font-bold text-emerald-900">{standardConfig.name}</div>
                </div>
                <div>
                  <div className="text-xs text-emerald-700 font-semibold mb-1">Hierarchy System</div>
                  <div className="text-sm font-bold text-emerald-900">{hierarchyDescription}</div>
                </div>
              </div>

              <div className="bg-white/60 rounded-lg p-3 border border-emerald-200">
                <div className="text-xs font-semibold text-emerald-800 mb-2">Structure:</div>
                <div className="grid gap-1 text-sm text-emerald-700">
                  {hierarchyLevels >= 1 && (
                    <div>• Level 1: {standard === 'ANSI_BHMA' ? 'Grand Master' : 'General Master'} (1 key)</div>
                  )}
                  {hierarchyLevels >= 2 && (
                    <div>• Level 2: {standard === 'ANSI_BHMA' ? 'Master Keys' : 'Master Keys'} (estimated: {Math.ceil(projectDoors.length / 30) || 3}-{Math.ceil(projectDoors.length / 20) || 6} keys)</div>
                  )}
                  {hierarchyLevels >= 3 && (
                    <div>• Level 3: {standard === 'ANSI_BHMA' ? 'Change Keys' : 'User Keys'} (created per door assignment)</div>
                  )}
                  {hierarchyLevels >= 4 && (
                    <div>• Level 4: Individual Room Keys (created per door assignment)</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Generate and Template Buttons */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Auto-Generate from Plan */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-indigo-900 mb-1">Auto-Generate from Plan</h3>
              <p className="text-sm text-indigo-700">
                Automatically create {hierarchyLevels}-level hierarchy based on your Step 1.5 selection.
              </p>
            </div>
          </div>
          <button
            onClick={handleAutoGenerate}
            disabled={isAutoGenerating || !hierarchyLevels}
            className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2 shadow-md"
          >
            {isAutoGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Hierarchy
              </>
            )}
          </button>
        </div>

        {/* Traditional Template */}
        <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Info className="w-6 h-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">Apply Template</h3>
              <p className="text-sm text-gray-600">
                Use facility-based template for {facilityType} ({standardConfig.recommendations[facilityType]?.depth || 3} levels).
              </p>
            </div>
          </div>
          <button
            onClick={handleApplyTemplate}
            disabled={isApplyingTemplate}
            className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {isApplyingTemplate ? 'Applying...' : 'Apply Template'}
          </button>
        </div>
      </div>

      {/* Hierarchy Tree */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">Current Hierarchy</h3>
        {hierarchies.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
            <Network className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No hierarchy levels defined yet.</p>
            <p className="text-sm text-gray-400">Apply a template or add levels manually to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {renderHierarchyTree(hierarchyTree)}
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="text-sm text-emerald-800">
                <strong>{hierarchies.length}</strong> hierarchy level{hierarchies.length !== 1 ? 's' : ''} defined
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Level Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add Custom Level
        </button>
      )}

      {/* Add Level Form */}
      {showAddForm && (
        <form onSubmit={handleAddLevel} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-gray-900">Add Custom Hierarchy Level</h4>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Level Name</label>
            <input
              type="text"
              value={formData.levelName}
              onChange={(e) => setFormData({...formData, levelName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Master Key"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Key Symbol</label>
            <input
              type="text"
              value={formData.keySymbol}
              onChange={(e) => setFormData({...formData, keySymbol: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., AA"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              For ANSI: Use A, AA, AAA pattern. For EN: Use GM, M, S pattern.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Parent Level</label>
            <select
              value={formData.parentHierarchyId || ''}
              onChange={(e) => setFormData({...formData, parentHierarchyId: e.target.value || null})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">None (Top Level)</option>
              {hierarchies.map(h => (
                <option key={h.hierarchyId} value={h.hierarchyId}>{h.levelName}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Level
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setFormData({ levelName: '', keySymbol: '', parentHierarchyId: null });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Step2HierarchySetup;
