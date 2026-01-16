import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMasterKey } from '../../context/MasterKeyContext';

const MasterKeyToggleWithContext = ({ facilityType }) => {
  const [showDetails, setShowDetails] = useState(false);
  const { mkSystemEnabled, mkApproach, toggleMKSystem, updateMKApproach, loading } = useMasterKey();

  const recommendations = {
    'Commercial Office': 'Standard 4-level hierarchy recommended',
    'Hospital / Healthcare': 'Departmental isolation with 4-5 levels',
    'Education / School': 'Complex 5-level hierarchy with wing separation',
    'Airport / Transport': 'Zone-based security with 3-4 levels',
    'Hospitality / Hotel': 'Floor-based hierarchy with 4 levels',
    'Residential': 'Simple 3-level hierarchy'
  };

  const handleToggleChange = async () => {
    try {
      await toggleMKSystem(!mkSystemEnabled);
    } catch (err) {
      console.error('Failed to toggle MK system:', err);
    }
  };

  const handleApproachChange = async (approach) => {
    try {
      await updateMKApproach(approach);
    } catch (err) {
      console.error('Failed to update approach:', err);
    }
  };

  return (
    <div>
      {/* Question Prompt */}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Would you like to design a Master Key System?
        </h3>
        <p className="text-sm text-gray-600">
          Design a professional master keying system for doors in this project with hierarchy levels, security zones, and key symbols.
        </p>
      </div>

      <div className="flex flex-col gap-1 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Master Key System (Optional)</h3>
            <p className="text-xs text-gray-500">Enable to start designing your master keying system.</p>
          </div>
          <div className="flex items-center gap-3 self-start">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
              {mkSystemEnabled ? "Master key ON" : "Master key OFF"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={mkSystemEnabled}
              onClick={handleToggleChange}
              disabled={loading}
              className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full transition-colors ${
                mkSystemEnabled ? "bg-indigo-600" : "bg-gray-300"
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                  mkSystemEnabled ? "translate-x-[22px]" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`col-span-full text-xs font-bold uppercase tracking-wide rounded px-3 py-2 border ${
          mkSystemEnabled ? "text-indigo-700 bg-indigo-50 border-indigo-100" : "text-gray-500 bg-gray-50 border-gray-200"
        }`}>
          {mkSystemEnabled ? `FACILITY: ${facilityType.toUpperCase()}` : 'MASTER KEY SYSTEM'}
        </div>

        {mkSystemEnabled ? (
          <div className="col-span-full space-y-3">
            {facilityType && (
              <p className="text-xs text-indigo-700 font-medium">
                ✓ {recommendations[facilityType] || 'Standard 4-level hierarchy recommended'}
              </p>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700">
                Quick Setup Options:
              </p>
              <div className="space-y-2 text-xs text-gray-600">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mkApproach"
                    value="zone_based"
                    checked={mkApproach === 'zone_based'}
                    onChange={(e) => handleApproachChange(e.target.value)}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Use building zones (automatic from doors)</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mkApproach"
                    value="custom_hierarchy"
                    checked={mkApproach === 'custom_hierarchy'}
                    onChange={(e) => handleApproachChange(e.target.value)}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Custom hierarchy design (step-by-step wizard)</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mkApproach"
                    value="imported"
                    checked={mkApproach === 'imported'}
                    onChange={(e) => handleApproachChange(e.target.value)}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Import existing keying schedule</span>
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 mt-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">What you'll be able to do:</p>
              <ul className="space-y-1 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-0.5">•</span>
                  <span>Define access hierarchy and security zones</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-0.5">•</span>
                  <span>Generate professional keying schedules</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-0.5">•</span>
                  <span>Export key symbols and bitting lists</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="col-span-full text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg px-3 py-4 bg-gray-50">
            Master Key System is currently turned off. Flip the toggle above if you want to design a professional
            keying system for your doors with hierarchy levels, security zones, and key symbols.

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-indigo-600 hover:text-indigo-700 mt-3 flex items-center gap-1"
            >
              Learn more about Master Key Systems
              <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
            </button>

            {showDetails && (
              <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-2">
                <p className="font-semibold">What is a Master Key System?</p>
                <p>
                  A master key system allows different keys to open different sets of locks,
                  while "master" keys can open multiple locks in the hierarchy.
                </p>
                <p>
                  For example, a floor manager's key opens all rooms on their floor,
                  while a building master key opens all floors.
                </p>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="font-semibold mb-2">Common Use Cases:</p>
                  <ul className="space-y-1 text-[11px]">
                    <li><span className="font-semibold">Commercial Offices:</span> Floor-based access with department suites</li>
                    <li><span className="font-semibold">Healthcare:</span> Department isolation with staff hierarchies</li>
                    <li><span className="font-semibold">Education:</span> Building and wing-based access control</li>
                    <li><span className="font-semibold">Hotels:</span> Guest rooms with floor master keys</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterKeyToggleWithContext;
