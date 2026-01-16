import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, RefreshCw, Layers, Key, Lock } from 'lucide-react';
import { useMasterKey } from '../../context/MasterKeyContext';

const Step5Validation = ({ onNext, onBack, projectDoors = [], showNotice }) => {
  const {
    mkProject,
    hierarchies,
    assignments,
    standard,
    validateDesign,
  } = useMasterKey();

  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  // Get facility type from mkProject
  const facilityType = mkProject?.facilityType || 'Commercial Office';

  // Auto-validate on mount
  useEffect(() => {
    handleValidate();
  }, []);

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const result = await validateDesign(projectDoors, facilityType);
      setValidationResult(result);
    } catch (err) {
      console.error('Validation error:', err);
      if (showNotice) {
        await showNotice('Validation Failed', `Validation failed: ${err.message}`);
      }
    } finally {
      setIsValidating(false);
    }
  };

  // Calculate statistics
  const totalDoors = projectDoors.length;
  const assignedDoors = projectDoors.filter(d => assignments.some(a => a.doorId === d.id)).length;
  const unassignedDoors = totalDoors - assignedDoors;
  const hierarchyCount = hierarchies.length;
  const usedDiffers = mkProject?.differsUsed || 0;
  const maxDiffers = mkProject?.maxDiffersAvailable || 0;
  const differsRemaining = maxDiffers - usedDiffers;
  const totalPhysicalKeys = mkProject?.totalPhysicalKeys || 0;
  const totalCylinders = mkProject?.totalCylinders || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pb-6 border-b border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Design Validation</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Review your master key system design for errors and standards compliance.
        </p>
      </div>

      {/* Validation Status Banner */}
      {validationResult && (
        <div className={`border-2 rounded-xl p-6 ${
          validationResult.isValid
            ? 'bg-emerald-50 border-emerald-300'
            : 'bg-amber-50 border-amber-300'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center ${
              validationResult.isValid ? 'bg-emerald-100' : 'bg-amber-100'
            }`}>
              {validationResult.isValid ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-amber-600" />
              )}
            </div>
            <div className="flex-1">
              <div className={`text-2xl font-bold mb-1 ${
                validationResult.isValid ? 'text-emerald-900' : 'text-amber-900'
              }`}>
                {validationResult.isValid ? 'Design Ready!' : 'Action Required'}
              </div>
              <div className={`text-sm ${
                validationResult.isValid ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {validationResult.isValid
                  ? 'Your master key system is complete and ready to export.'
                  : 'Please address the items below before proceeding.'
                }
              </div>
            </div>
            <button
              onClick={handleValidate}
              disabled={isValidating}
              className="flex-shrink-0 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-semibold"
            >
              <RefreshCw size={16} className={isValidating ? 'animate-spin' : ''} />
              Re-validate
            </button>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Layers size={20} className="text-blue-600" />
            </div>
            <div className="text-sm font-semibold text-gray-600">Total Doors</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalDoors}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={20} className="text-emerald-600" />
            </div>
            <div className="text-sm font-semibold text-gray-600">Assigned</div>
          </div>
          <div className="text-3xl font-bold text-emerald-600">{assignedDoors}</div>
          <div className="text-xs text-gray-500 mt-1">{totalDoors > 0 ? Math.round((assignedDoors / totalDoors) * 100) : 0}% Complete</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Key size={20} className="text-purple-600" />
            </div>
            <div className="text-sm font-semibold text-gray-600">Unique Keys</div>
          </div>
          <div className="text-3xl font-bold text-purple-600">{usedDiffers}</div>
          <div className="text-xs text-gray-500 mt-1">of {maxDiffers.toLocaleString()} available</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Lock size={20} className="text-orange-600" />
            </div>
            <div className="text-sm font-semibold text-gray-600">Cylinders</div>
          </div>
          <div className="text-3xl font-bold text-orange-600">{totalCylinders}</div>
          <div className="text-xs text-gray-500 mt-1">{totalPhysicalKeys} keys to cut</div>
        </div>
      </div>

      {/* System Status - Simplified */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="text-center">
          <div className="font-semibold text-gray-900 mb-4 text-lg">System Capacity</div>

          {/* Traffic Light Status */}
          <div className="mb-4">
            {usedDiffers <= 100 && (
              <>
                <div className="text-6xl mb-2">🟢</div>
                <div className="text-2xl font-bold text-emerald-600 mb-2">Excellent</div>
                <div className="text-lg text-gray-700 mb-4">
                  Very High Capacity • {differsRemaining.toLocaleString()} keys available
                </div>
                <div className="max-w-md mx-auto bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="text-sm text-emerald-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Unique Keys:</span>
                      <strong>{usedDiffers} of {maxDiffers.toLocaleString()}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Physical Keys:</span>
                      <strong>{totalPhysicalKeys} to manufacture</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Cylinders:</span>
                      <strong>{totalCylinders} in system</strong>
                    </div>
                  </div>
                </div>
              </>
            )}
            {usedDiffers > 100 && usedDiffers <= 500 && (
              <>
                <div className="text-6xl mb-2">🟡</div>
                <div className="text-2xl font-bold text-yellow-600 mb-1">Good</div>
                <div className="text-lg text-gray-700 mb-2">
                  {usedDiffers} unique keys | Capacity: High
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>{totalPhysicalKeys} physical keys</strong> to manufacture</div>
                  <div><strong>{totalCylinders} cylinders</strong> in system</div>
                  <div className="mt-2 text-gray-500">System is performing well with room for expansion</div>
                </div>
              </>
            )}
            {usedDiffers > 500 && usedDiffers <= 1000 && (
              <>
                <div className="text-6xl mb-2">🟠</div>
                <div className="text-2xl font-bold text-orange-600 mb-1">Consult Locksmith</div>
                <div className="text-lg text-gray-700 mb-2">
                  {usedDiffers} unique keys | Capacity: Moderate
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>{totalPhysicalKeys} physical keys</strong> to manufacture</div>
                  <div><strong>{totalCylinders} cylinders</strong> in system</div>
                  <div className="mt-2 text-orange-600">Consider reviewing system design with a professional locksmith</div>
                </div>
              </>
            )}
            {usedDiffers > 1000 && (
              <>
                <div className="text-6xl mb-2">🔴</div>
                <div className="text-2xl font-bold text-red-600 mb-1">At Capacity</div>
                <div className="text-lg text-gray-700 mb-2">
                  {usedDiffers} unique keys | Capacity: Critical
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>{totalPhysicalKeys} physical keys</strong> to manufacture</div>
                  <div><strong>{totalCylinders} cylinders</strong> in system</div>
                  <div className="mt-2 text-red-600 font-semibold">System approaching maximum capacity - professional review required</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Critical Issues Only */}
      {validationResult && validationResult.errors.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-900 text-lg mb-1">
                Issues to Resolve ({validationResult.errors.length})
              </h3>
              <p className="text-sm text-red-700">
                Please address these issues before exporting your design.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {validationResult.errors.map((error, index) => (
              <div key={index} className="bg-white border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-red-900 mb-1">{error.message}</div>
                    {error.details && (
                      <div className="text-sm text-red-700">{error.details}</div>
                    )}
                    {error.count && (
                      <div className="text-sm text-red-700 mt-1">
                        Affected items: <strong>{error.count}</strong>
                      </div>
                    )}
                    {error.type === 'unassigned_doors' && (
                      <div className="mt-2">
                        <button
                          onClick={onBack}
                          className="text-sm text-red-700 hover:text-red-900 font-semibold underline"
                        >
                          ← Go to Step 4 to assign remaining doors
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations (Warnings) */}
      {validationResult && validationResult.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-lg mb-1">
                Recommendations ({validationResult.warnings.length})
              </h3>
              <p className="text-sm text-amber-700">
                These are suggestions to improve your design (optional).
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {validationResult.warnings.map((warning, index) => (
              <div key={index} className="bg-white border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="flex-shrink-0 text-amber-600 mt-0.5" size={20} />
                  <div className="flex-1">
                    <div className="font-medium text-amber-900">{warning.message}</div>
                    {warning.current !== undefined && (
                      <div className="text-sm text-amber-700 mt-1">
                        Current: {warning.current}
                        {warning.recommended && ` • Recommended: ${warning.recommended}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success State */}
      {validationResult && validationResult.isValid && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="flex-shrink-0 text-emerald-600 mt-0.5" size={28} />
            <div>
              <div className="font-bold text-emerald-900 text-xl mb-2">
                ✓ All Systems Go!
              </div>
              <div className="text-emerald-800 mb-4">
                Your master key system design is complete and meets all requirements.
                You're ready to export your keying schedule.
              </div>
              <ul className="text-sm text-emerald-800 space-y-1.5">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                  All {totalDoors} doors have been assigned
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                  {hierarchyCount} hierarchy levels configured
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                  {usedDiffers} unique keys within capacity limits
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                  {totalCylinders} cylinders ready for installation
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-emerald-300">
                <button
                  onClick={onNext}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-md"
                >
                  Proceed to Export →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step5Validation;
