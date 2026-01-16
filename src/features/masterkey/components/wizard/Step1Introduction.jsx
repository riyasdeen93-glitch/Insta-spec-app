import React from 'react';
import { Key, Building2, Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import { useMasterKey } from '../../context/MasterKeyContext';
import { STANDARDS } from '../../utils/standards';

const Step1Introduction = ({ onNext, projectName = 'Untitled Project' }) => {
  const { mkProject, mkApproach, standard, updateMKApproach, updateStandard } = useMasterKey();

  const keyingApproaches = [
    {
      id: 'zone_based',
      title: 'Zone-Based Keying',
      description: 'Organize keys by functional zones (Admin, Classrooms, Labs)',
      icon: Building2,
      recommended: ['Education / School', 'Office Building', 'Healthcare'],
      features: ['Easy to understand', 'Simple administration', 'Best for smaller buildings'],
    },
    {
      id: 'floor_based',
      title: 'Floor-Based Keying',
      description: 'Organize keys by building floors (Floor 1, Floor 2, etc.)',
      icon: Shield,
      recommended: ['Office Building', 'Apartment / Residential', 'Hotel / Lodging'],
      features: ['Clear hierarchy', 'Vertical organization', 'Best for multi-story buildings'],
    },
    {
      id: 'functional',
      title: 'Functional Keying',
      description: 'Organize keys by department or function (HR, IT, Maintenance)',
      icon: Key,
      recommended: ['Office Building', 'Healthcare', 'Industrial / Warehouse'],
      features: ['Role-based access', 'Flexible management', 'Best for complex organizations'],
    },
  ];

  const handleApproachChange = async (approachId) => {
    await updateMKApproach(approachId);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center pb-6 border-b border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <Key className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Master Key System Design
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          This wizard will guide you through creating a complete master key system for your project.
          You'll define key levels, organize doors, and generate professional keying schedules.
        </p>
      </div>

      {/* Project Summary */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-100">
        <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-3">
          Project Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-1">
              Project Name
            </div>
            <div className="text-sm font-bold text-indigo-900">{projectName}</div>
          </div>
          <div>
            <div className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-1">
              Keying Approach
            </div>
            <div className="text-sm font-bold text-indigo-900 capitalize">
              {mkProject?.keyingApproach?.replace('_', ' ') || 'Not Set'}
            </div>
          </div>
          <div>
            <div className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-1">
              System Capacity
            </div>
            <div className="text-sm font-bold text-indigo-900">
              Professional
            </div>
          </div>
          <div>
            <div className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-1">
              Status
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
              {mkProject?.mkSystemStatus || 'Not Started'}
            </div>
          </div>
        </div>
      </div>

      {/* Standard Selection */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" />
          Select Industry Standard
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose the standard that applies to your region and requirements. This determines pin configuration, key hierarchy levels, and compliance rules.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {Object.values(STANDARDS).map(std => {
            const isSelected = standard === std.id;

            return (
              <button
                key={std.id}
                onClick={() => updateStandard(std.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 shadow-md'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-bold text-gray-900">{std.name}</div>
                  {isSelected && (
                    <CheckCircle2 className="text-indigo-600 flex-shrink-0" size={20} />
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-2">{std.region} • Version {std.version}</div>
                <div className="text-xs text-gray-500 mb-2">
                  {std.pinConfig.pins}-pin system, {std.pinConfig.depths} depths, MACS {std.pinConfig.macs}
                </div>
                <div className="text-xs font-semibold text-indigo-600">
                  Professional grade master key system
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Keying Approach Selection */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Choose Your Keying Approach</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select the organizational strategy that best fits your building and security needs.
          You can change this later if needed.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          {keyingApproaches.map((approach) => {
            const Icon = approach.icon;
            const isSelected = mkApproach === approach.id;

            return (
              <button
                key={approach.id}
                onClick={() => handleApproachChange(approach.id)}
                className={`text-left p-5 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-indigo-600' : 'bg-gray-100'
                    }`}
                  >
                    <Icon className={isSelected ? 'text-white' : 'text-gray-600'} size={24} />
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="text-indigo-600" size={24} />
                  )}
                </div>

                <h4 className={`text-base font-bold mb-2 ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                  {approach.title}
                </h4>
                <p className="text-sm text-gray-600 mb-4">{approach.description}</p>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Best For:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {approach.recommended.map((type) => (
                      <span
                        key={type}
                        className="text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium"
                      >
                        {type}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-1 mt-3">
                    {approach.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Approach-Specific Workflow */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-indigo-200">
        <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2">
          Your Selected Workflow
        </h3>

        {mkApproach === 'zone_based' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-indigo-900">Zone-Based Keying</span>
            </div>
            <p className="text-sm text-indigo-800 mb-4">
              Zones will be <strong>automatically generated</strong> from your door data.
              You'll skip the Zone Definition step and go straight to assigning doors.
            </p>
            <div className="space-y-2">
              {[
                { step: 1, title: 'Hierarchy Planning', desc: 'Plan your key hierarchy structure' },
                { step: 2, title: 'Hierarchy Setup', desc: 'Define master key levels' },
                { step: 3, title: 'Door Assignment', desc: 'Assign doors (zones auto-created)' },
                { step: 4, title: 'Validation', desc: 'Review and validate design' },
                { step: 5, title: 'Export', desc: 'Generate keying schedules' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-2 text-xs">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                    {item.step}
                  </div>
                  <div>
                    <span className="font-semibold text-indigo-900">{item.title}</span>
                    <span className="text-indigo-700"> - {item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mkApproach === 'custom_hierarchy' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-indigo-900">Custom Hierarchy Design</span>
            </div>
            <p className="text-sm text-indigo-800 mb-4">
              You'll go through the <strong>complete wizard</strong> with full control over hierarchy levels,
              zone creation, and door assignments.
            </p>
            <div className="space-y-2">
              {[
                { step: 1, title: 'Hierarchy Planning', desc: 'Plan your key hierarchy structure' },
                { step: 2, title: 'Hierarchy Setup', desc: 'Define master key levels' },
                { step: 3, title: 'Zone Definition', desc: 'Create custom security zones' },
                { step: 4, title: 'Door Assignment', desc: 'Assign doors to keys and zones' },
                { step: 5, title: 'Validation', desc: 'Review and validate design' },
                { step: 6, title: 'Export', desc: 'Generate keying schedules' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-2 text-xs">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                    {item.step}
                  </div>
                  <div>
                    <span className="font-semibold text-indigo-900">{item.title}</span>
                    <span className="text-indigo-700"> - {item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mkApproach === 'imported' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-indigo-900">Import Existing Schedule</span>
            </div>
            <p className="text-sm text-indigo-800 mb-4">
              You'll <strong>skip design steps</strong> and import an existing keying schedule.
              Then validate and export as needed.
            </p>
            <div className="space-y-2">
              {[
                { step: 1, title: 'Validation', desc: 'Validate imported keying schedule' },
                { step: 2, title: 'Export', desc: 'Generate updated schedules' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-2 text-xs">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                    {item.step}
                  </div>
                  <div>
                    <span className="font-semibold text-indigo-900">{item.title}</span>
                    <span className="text-indigo-700"> - {item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!mkApproach && (
          <p className="text-sm text-gray-600">
            Please select a keying approach above to see your workflow.
          </p>
        )}
      </div>

    </div>
  );
};

export default Step1Introduction;
