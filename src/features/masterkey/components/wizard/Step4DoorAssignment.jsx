import React, { useState, useMemo } from 'react';
import { DoorClosed, Search, Filter, CheckCircle2, Circle, Layers, Sparkles, TrendingUp, Network, X, Edit3, Key, Link2, Users } from 'lucide-react';
import { useMasterKey } from '../../context/MasterKeyContext';
import {
  generateAutoAssignmentPlan,
  formatAssignmentPreview,
  calculateAssignmentStats,
  generateChangeKeySymbol
} from '../../utils/doorAssignmentGenerator';

const Step4DoorAssignment = ({ onNext, onBack, projectDoors = [], showNotice, showConfirm }) => {
  const {
    hierarchies,
    zones,
    assignments,
    kaGroups,              // NEW
    standard,
    assignDoorToKey,
    bulkAssignDoors,
    unassignDoor,
    createKAGroup,         // NEW
    updateKeyQuantity,     // NEW
  } = useMasterKey();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterZone, setFilterZone] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [selectedDoors, setSelectedDoors] = useState([]);
  const [selectedHierarchy, setSelectedHierarchy] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);

  // KA Group modal state
  const [showKAModal, setShowKAModal] = useState(false);
  const [kaGroupName, setKaGroupName] = useState('');
  const [kaGroupQuantity, setKaGroupQuantity] = useState(5);
  const [selectedKADoors, setSelectedKADoors] = useState([]);

  // Calculate assignment statistics
  const stats = useMemo(() =>
    calculateAssignmentStats(assignments, hierarchies, projectDoors),
    [assignments, hierarchies, projectDoors]
  );

  // Get unique levels from doors
  const uniqueLevels = useMemo(() => {
    const levels = new Set(projectDoors.map(d => d.level).filter(Boolean));
    return Array.from(levels).sort();
  }, [projectDoors]);

  // Get unique zones from doors
  const uniqueZones = useMemo(() => {
    const doorZones = new Set(projectDoors.map(d => d.zone).filter(Boolean));
    return Array.from(doorZones).sort();
  }, [projectDoors]);

  // Check if door is assigned
  const isDoorAssigned = (doorId) => {
    return assignments.some(a => a.doorId === doorId);
  };

  // Get door assignment
  const getDoorAssignment = (doorId) => {
    return assignments.find(a => a.doorId === doorId);
  };

  // Filter doors
  const filteredDoors = useMemo(() => {
    return projectDoors.filter(door => {
      // Search filter
      const matchesSearch = !searchTerm ||
        door.mark?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        door.use?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        door.zone?.toLowerCase().includes(searchTerm.toLowerCase());

      // Zone filter
      const matchesZone = filterZone === 'all' || door.zone === filterZone;

      // Level filter
      const matchesLevel = filterLevel === 'all' || door.level === filterLevel;

      return matchesSearch && matchesZone && matchesLevel;
    });
  }, [projectDoors, searchTerm, filterZone, filterLevel]);

  // Calculate progress
  const assignedCount = projectDoors.filter(d => isDoorAssigned(d.id)).length;
  const totalCount = projectDoors.length;
  const progressPercent = totalCount > 0 ? Math.round((assignedCount / totalCount) * 100) : 0;

  // Toggle door selection
  const toggleDoorSelection = (doorId) => {
    setSelectedDoors(prev =>
      prev.includes(doorId)
        ? prev.filter(id => id !== doorId)
        : [...prev, doorId]
    );
  };

  // Select all filtered doors
  const selectAllFiltered = () => {
    const unassignedFiltered = filteredDoors.filter(d => !isDoorAssigned(d.id));
    setSelectedDoors(unassignedFiltered.map(d => d.id));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedDoors([]);
  };

  // Assign selected doors to hierarchy
  const handleBulkAssign = async () => {
    if (selectedDoors.length === 0 || !selectedHierarchy) {
      if (showNotice) {
        await showNotice('Selection Required', 'Please select doors and a hierarchy level');
      }
      return;
    }

    setIsAssigning(true);
    try {
      // Count how many doors are already assigned to this master
      let doorsAssignedToThisMaster = assignments.filter(a => a.hierarchyId === selectedHierarchy.hierarchyId).length;

      // Assign each door with its own unique change key
      for (const doorId of selectedDoors) {
        // Generate proper change key symbol for this door
        const changeKeySymbol = generateChangeKeySymbol(
          standard,
          selectedHierarchy.keySymbol,
          doorsAssignedToThisMaster,
          selectedHierarchy.hierarchyId
        );

        await assignDoorToKey(doorId, selectedHierarchy.hierarchyId, changeKeySymbol);

        // Increment counter for next door's change key
        doorsAssignedToThisMaster++;
      }

      if (showNotice) {
        await showNotice('Success', `Successfully assigned ${selectedDoors.length} door${selectedDoors.length !== 1 ? 's' : ''}`);
      }
      clearSelection();
    } catch (err) {
      if (showNotice) {
        await showNotice('Error', `Failed to assign doors: ${err.message}`);
      }
    } finally {
      setIsAssigning(false);
    }
  };

  // Assign single door
  const handleSingleAssign = async (doorId, hierarchy) => {
    setIsAssigning(true);
    try {
      // Count how many doors are already assigned to this master
      const doorsAssignedToThisMaster = assignments.filter(a => a.hierarchyId === hierarchy.hierarchyId).length;

      // Generate proper change key symbol (CK-101, CK-102, CK-201, CK-202, etc.)
      const changeKeySymbol = generateChangeKeySymbol(
        standard,
        hierarchy.keySymbol,
        doorsAssignedToThisMaster,
        hierarchy.hierarchyId
      );

      await assignDoorToKey(doorId, hierarchy.hierarchyId, changeKeySymbol);
    } catch (err) {
      if (showNotice) {
        await showNotice('Error', `Failed to assign door: ${err.message}`);
      }
    } finally {
      setIsAssigning(false);
    }
  };

  // Unassign single door
  const handleUnassign = async (doorId) => {
    setIsAssigning(true);
    try {
      await unassignDoor(doorId);
      if (showNotice) {
        await showNotice('Success', 'Door unassigned successfully');
      }
    } catch (err) {
      if (showNotice) {
        await showNotice('Error', `Failed to unassign door: ${err.message}`);
      }
    } finally {
      setIsAssigning(false);
    }
  };

  // Create KA Group
  const handleCreateKAGroup = async () => {
    if (!kaGroupName.trim()) {
      if (showNotice) {
        await showNotice('Name Required', 'Please enter a name for the KA group');
      }
      return;
    }

    if (selectedKADoors.length < 2) {
      if (showNotice) {
        await showNotice('Selection Required', 'KA group must have at least 2 doors');
      }
      return;
    }

    // Check if all selected doors have the same master key (they must for KA)
    const firstDoor = projectDoors.find(d => d.id === selectedKADoors[0]);
    if (!firstDoor) return;

    // For simplicity, use the first selected hierarchy or prompt user
    const selectedMaster = hierarchies.find(h => h.order > 0); // Get first master key
    if (!selectedMaster) {
      if (showNotice) {
        await showNotice('No Master Key', 'Please create master keys in Step 2 first');
      }
      return;
    }

    setIsAssigning(true);
    try {
      await createKAGroup(
        kaGroupName,
        selectedKADoors,
        selectedMaster.hierarchyId,
        selectedMaster.keySymbol,
        kaGroupQuantity
      );

      if (showNotice) {
        await showNotice('Success', `KA Group "${kaGroupName}" created with ${selectedKADoors.length} doors`);
      }

      // Reset modal state
      setShowKAModal(false);
      setKaGroupName('');
      setKaGroupQuantity(5);
      setSelectedKADoors([]);
      clearSelection();
    } catch (err) {
      if (showNotice) {
        await showNotice('Error', `Failed to create KA group: ${err.message}`);
      }
    } finally {
      setIsAssigning(false);
    }
  };

  // Auto-assign all doors intelligently
  const handleAutoAssign = async () => {
    if (projectDoors.length === 0) {
      if (showNotice) {
        await showNotice('No Doors', 'No doors found in project to assign.');
      }
      return;
    }

    if (hierarchies.length === 0) {
      if (showNotice) {
        await showNotice('No Hierarchy', 'Please create hierarchy levels in Step 2 first.');
      }
      return;
    }

    // Generate assignment plan
    const plan = generateAutoAssignmentPlan(projectDoors, zones, hierarchies, standard);

    if (plan.assignments.length === 0) {
      if (showNotice) {
        await showNotice('Cannot Auto-Assign', 'No zones could be matched to master keys. Please ensure your zones match your master key names.');
      }
      return;
    }

    // Format preview message
    const previewMessage = formatAssignmentPreview(plan, hierarchies, standard);

    // Show confirmation with preview
    const confirmed = showConfirm
      ? await showConfirm('Auto-Assign Doors', previewMessage, 'Confirm Assignment', 'Cancel')
      : confirm(previewMessage);

    if (!confirmed) {
      return;
    }

    // Execute assignments
    setIsAutoAssigning(true);
    try {
      // Assign each door to its master key
      for (const assignment of plan.assignments) {
        await assignDoorToKey(
          assignment.doorId,
          assignment.masterKeyId,
          assignment.changeKeySymbol
        );
      }

      if (showNotice) {
        await showNotice(
          'Success',
          `Auto-assigned ${plan.assignments.length} door${plan.assignments.length !== 1 ? 's' : ''} successfully!\n\n${plan.totalChangeKeys} change keys created.`
        );
      }
    } catch (err) {
      if (showNotice) {
        await showNotice('Error', `Failed to auto-assign doors: ${err.message}`);
      }
    } finally {
      setIsAutoAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pb-6 border-b border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <DoorClosed className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Door Assignment</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Assign doors to hierarchy levels to define which keys open which doors.
        </p>
      </div>

      {/* Progress Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="text-sm font-semibold text-indigo-900 mb-1">Assignment Progress</div>
            <div className="text-2xl font-bold text-indigo-600 mb-2">{assignedCount} / {totalCount} doors</div>
            {assignedCount > 0 && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-700">
                    <strong>{projectDoors.filter(d => isDoorAssigned(d.id)).reduce((sum, door) => sum + (door.qty || 1), 0)} cylinders</strong> assigned
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-600">
                    {projectDoors.reduce((sum, door) => sum + (door.qty || 1), 0)} total cylinders in schedule
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-600">{progressPercent}%</div>
            <div className="text-sm text-indigo-700">Complete</div>
          </div>
        </div>
        <div className="w-full bg-indigo-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Hierarchy Context Banner */}
      {hierarchies.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Network className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-blue-900">Master Key Hierarchy</h3>
          </div>

          <div className="space-y-3">
            {hierarchies.map((hierarchy, index) => {
              const assignedToThis = assignments.filter(a => a.hierarchyId === hierarchy.hierarchyId).length;
              const isTopLevel = hierarchy.order === 0;

              return (
                <div
                  key={hierarchy.hierarchyId}
                  className="flex items-center gap-3 bg-white bg-opacity-60 rounded-lg p-3"
                  style={{ marginLeft: `${hierarchy.order * 16}px` }}
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                    isTopLevel ? 'bg-blue-100' : 'bg-cyan-100'
                  }`}>
                    <span className={`font-bold text-sm ${
                      isTopLevel ? 'text-blue-700' : 'text-cyan-700'
                    }`}>
                      {hierarchy.keySymbol}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">
                      {hierarchy.levelName}
                    </div>
                    <div className="text-xs text-gray-600">
                      {isTopLevel ? `Opens all ${totalCount} doors` : `${assignedToThis} door${assignedToThis !== 1 ? 's' : ''} assigned`}
                    </div>
                  </div>

                  {!isTopLevel && assignedToThis > 0 && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        {assignedToThis}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Smart Auto-Assignment Button */}
      {projectDoors.length > 0 && assignedCount < totalCount && hierarchies.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-indigo-900">Smart Auto-Assignment</h3>
              </div>
              <p className="text-sm text-indigo-700 mb-2">
                Automatically assign all doors to master keys based on zones and hierarchy.
              </p>
              <div className="flex items-center gap-4 text-xs text-indigo-600">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{totalCount - assignedCount} unassigned doors</span>
                </div>
                <div className="flex items-center gap-1">
                  <Network className="w-4 h-4" />
                  <span>{hierarchies.filter(h => h.order > 0).length} master keys</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleAutoAssign}
              disabled={isAutoAssigning || isAssigning}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-semibold"
            >
              {isAutoAssigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Auto-Assign All Doors</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="grid md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search doors..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Zone Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
            >
              <option value="all">All Zones</option>
              {uniqueZones.map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
            >
              <option value="all">All Levels</option>
              {uniqueLevels.map(level => (
                <option key={level} value={level}>Floor {level}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedDoors.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-3">
            <div className="text-sm font-semibold text-gray-700">
              {selectedDoors.length} door{selectedDoors.length !== 1 ? 's' : ''} selected
            </div>
            <select
              value={selectedHierarchy?.hierarchyId || ''}
              onChange={(e) => {
                const hierarchy = hierarchies.find(h => h.hierarchyId === e.target.value);
                setSelectedHierarchy(hierarchy);
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select hierarchy level...</option>
              {hierarchies.map(h => (
                <option key={h.hierarchyId} value={h.hierarchyId}>
                  {h.keySymbol} - {h.levelName}
                </option>
              ))}
            </select>
            <button
              onClick={handleBulkAssign}
              disabled={!selectedHierarchy || isAssigning}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isAssigning ? 'Assigning...' : 'Assign Selected'}
            </button>
            <button
              onClick={() => {
                if (selectedDoors.length >= 2) {
                  setSelectedKADoors(selectedDoors);
                  setShowKAModal(true);
                } else {
                  showNotice?.('Selection Required', 'Please select at least 2 doors to create a KA group');
                }
              }}
              disabled={selectedDoors.length < 2}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Link2 size={16} />
              Create KA Group
            </button>
            <button
              onClick={clearSelection}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {filteredDoors.some(d => !isDoorAssigned(d.id)) && (
        <button
          onClick={selectAllFiltered}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
        >
          Select all unassigned ({filteredDoors.filter(d => !isDoorAssigned(d.id)).length})
        </button>
      )}

      {/* Door List */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          Doors ({filteredDoors.length})
        </h3>

        {filteredDoors.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
            <DoorClosed className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No doors match your filters.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredDoors.map(door => {
              const assigned = isDoorAssigned(door.id);
              const assignment = getDoorAssignment(door.id);
              const isSelected = selectedDoors.includes(door.id);
              const assignedHierarchy = assignment ? hierarchies.find(h => h.hierarchyId === assignment.hierarchyId) : null;

              return (
                <div
                  key={door.id}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                    assigned
                      ? 'bg-emerald-50 border-emerald-200'
                      : isSelected
                      ? 'bg-indigo-50 border-indigo-400'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Checkbox */}
                  {!assigned && (
                    <button
                      onClick={() => toggleDoorSelection(door.id)}
                      className="flex-shrink-0"
                    >
                      {isSelected ? (
                        <CheckCircle2 className="text-indigo-600" size={20} />
                      ) : (
                        <Circle className="text-gray-400" size={20} />
                      )}
                    </button>
                  )}

                  {/* Door Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    assigned ? 'bg-emerald-100' : 'bg-gray-100'
                  }`}>
                    <DoorClosed size={20} className={assigned ? 'text-emerald-600' : 'text-gray-600'} />
                  </div>

                  {/* Door Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-gray-900">{door.mark}</div>
                      {door.qty > 1 && (
                        <div className="px-2 py-0.5 bg-orange-100 border border-orange-300 rounded text-xs font-bold text-orange-700">
                          QTY {door.qty}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {door.use} • Floor {door.level} • {door.zone}
                    </div>
                  </div>

                  {/* Assignment Status */}
                  {assigned && assignedHierarchy ? (
                    <div className="flex items-center gap-2">
                      {/* KA/KD Indicator Icon */}
                      {assignment.keyType === 'KA' ? (
                        <div className="flex-shrink-0 p-1.5 bg-purple-100 rounded-lg" title="Keyed Alike - Shared key with other doors">
                          <Link2 size={16} className="text-purple-600" />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 p-1.5 bg-blue-100 rounded-lg" title="Keyed Differ - Unique key">
                          <Key size={16} className="text-blue-600" />
                        </div>
                      )}

                      {/* Change Key Badge */}
                      <div className="flex-shrink-0 px-3 py-1 bg-emerald-100 border border-emerald-300 rounded-full">
                        <span className="text-sm font-semibold text-emerald-800">
                          {assignment.keySymbol || assignedHierarchy.keySymbol}
                        </span>
                      </div>

                      {/* Master Key Badge (smaller, secondary) */}
                      <div className="flex-shrink-0 px-2 py-0.5 bg-cyan-50 border border-cyan-200 rounded text-xs text-cyan-700">
                        {assignedHierarchy.keySymbol}
                      </div>

                      {/* KA Group Name or Quantity */}
                      {assignment.keyType === 'KA' ? (
                        <div className="flex-shrink-0 px-2 py-1 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700 font-medium">
                          {assignment.kaGroupName || 'KA Group'}
                        </div>
                      ) : (
                        <div className="flex-shrink-0 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700">
                          {assignment.keyQuantity || 2} keys
                        </div>
                      )}

                      {/* Unassign Button */}
                      <button
                        onClick={() => handleUnassign(door.id)}
                        disabled={isAssigning}
                        className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Unassign door"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const hierarchy = hierarchies.find(h => h.hierarchyId === e.target.value);
                          if (hierarchy) {
                            handleSingleAssign(door.id, hierarchy);
                            e.target.value = '';
                          }
                        }
                      }}
                      className="flex-shrink-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      disabled={isAssigning}
                    >
                      <option value="">Assign to...</option>
                      {hierarchies.map(h => (
                        <option key={h.hierarchyId} value={h.hierarchyId}>
                          {h.keySymbol} - {h.levelName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {assignedCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Progress:</strong> {assignedCount} of {totalCount} doors assigned.
            {assignedCount === totalCount ? ' Ready for validation!' : ' Keep assigning to complete your design.'}
          </p>
        </div>
      )}

      {/* KA Group Creation Modal */}
      {showKAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Link2 className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold">Create Keyed Alike Group</h2>
              </div>
              <p className="text-purple-100 text-sm">
                Create a group of doors that share the same key - one key opens all doors in this group
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Group Name Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  KA Group Name *
                </label>
                <input
                  type="text"
                  value={kaGroupName}
                  onChange={(e) => setKaGroupName(e.target.value)}
                  placeholder="e.g., Conference Rooms, Bathrooms, Storage Closets"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">Give this group a descriptive name</p>
              </div>

              {/* Key Quantity Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Number of Physical Keys *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={kaGroupQuantity}
                  onChange={(e) => setKaGroupQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Total number of keys to manufacture for this group (one key opens all {selectedKADoors.length} doors)
                </p>
              </div>

              {/* Selected Doors List */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Selected Doors ({selectedKADoors.length})
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    {selectedKADoors.map(doorId => {
                      const door = projectDoors.find(d => d.id === doorId);
                      if (!door) return null;
                      return (
                        <div key={doorId} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                          <DoorClosed size={18} className="text-gray-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">{door.mark}</div>
                            <div className="text-xs text-gray-600 truncate">{door.use}</div>
                          </div>
                          <button
                            onClick={() => setSelectedKADoors(selectedKADoors.filter(id => id !== doorId))}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {selectedKADoors.length < 2 && (
                  <p className="text-xs text-red-600 mt-2">⚠️ KA group must have at least 2 doors</p>
                )}
              </div>

              {/* Summary Box */}
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Users size={18} />
                  Summary
                </h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>✓ <strong>{selectedKADoors.length} doors</strong> will share the same key</li>
                  <li>✓ <strong>{kaGroupQuantity} physical keys</strong> will be manufactured</li>
                  <li>✓ One key opens all {selectedKADoors.length} doors in this group</li>
                  <li>✓ Cost-effective: Fewer unique keys to manage</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowKAModal(false);
                  setKaGroupName('');
                  setKaGroupQuantity(5);
                }}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKAGroup}
                disabled={isAssigning || !kaGroupName.trim() || selectedKADoors.length < 2}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-semibold flex items-center gap-2"
              >
                {isAssigning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Link2 size={18} />
                    Create KA Group
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step4DoorAssignment;
