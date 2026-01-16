import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useMasterKey } from '../../context/MasterKeyContext';
import Step1Introduction from './Step1Introduction';
import Step1_5HierarchyPlanning from './Step1_5HierarchyPlanning';
import Step2HierarchySetup from './Step2HierarchySetup';
import Step3ZoneDefinition from './Step3ZoneDefinition';
import Step4DoorAssignment from './Step4DoorAssignment';
import Step5Validation from './Step5Validation';
import Step6Export from './Step6Export';

const MasterKeyWizard = ({ projectDoors = [], projectName = 'Untitled Project', projectStandard = 'ANSI_BHMA', showNotice, showConfirm, onBackToSetup }) => {
  const [wizardStep, setWizardStep] = useState(0); // 0-6 for 7 steps
  const [exportCompleted, setExportCompleted] = useState(false); // Track if export is done
  const { mkProject, mkApproach, loading, updateStandard, autoGenerateZones } = useMasterKey();

  // Auto-select standard based on project setup (only on first render if not already set)
  React.useEffect(() => {
    if (mkProject && projectStandard && mkProject.standard !== projectStandard) {
      updateStandard(projectStandard);
    }
  }, [projectStandard]);

  // Auto-generate zones for zone_based approach when moving to door assignment
  React.useEffect(() => {
    const generateZonesIfNeeded = async () => {
      if (mkApproach === 'zone_based' && wizardStep === 3 && projectDoors.length > 0) {
        try {
          await autoGenerateZones(projectDoors, 'zone_based');
          console.log('✅ Auto-generated zones for zone_based approach');
        } catch (err) {
          console.error('Failed to auto-generate zones:', err);
        }
      }
    };

    generateZonesIfNeeded();
  }, [wizardStep, mkApproach, projectDoors]);

  // Determine which steps to show based on approach
  const getWizardSteps = () => {
    const baseSteps = [
      { id: 0, title: 'Introduction', shortLabel: 'INTRO', component: Step1Introduction },
    ];

    if (mkApproach === 'zone_based') {
      // Zone-based: Skip Zone Definition step (auto-generated), simplified workflow
      return [
        ...baseSteps,
        { id: 1, title: 'Hierarchy Planning', shortLabel: 'PLAN', component: Step1_5HierarchyPlanning },
        { id: 2, title: 'Hierarchy Setup', shortLabel: 'SETUP', component: Step2HierarchySetup },
        { id: 4, title: 'Door Assignment', shortLabel: 'ASSIGN', component: Step4DoorAssignment },
        { id: 5, title: 'Validation', shortLabel: 'VALIDATE', component: Step5Validation },
        { id: 6, title: 'Export', shortLabel: 'EXPORT', component: Step6Export },
      ];
    } else if (mkApproach === 'custom_hierarchy') {
      // Custom: Full wizard with all steps
      return [
        ...baseSteps,
        { id: 1, title: 'Hierarchy Planning', shortLabel: 'PLAN', component: Step1_5HierarchyPlanning },
        { id: 2, title: 'Hierarchy Setup', shortLabel: 'SETUP', component: Step2HierarchySetup },
        { id: 3, title: 'Zone Definition', shortLabel: 'ZONES', component: Step3ZoneDefinition },
        { id: 4, title: 'Door Assignment', shortLabel: 'ASSIGN', component: Step4DoorAssignment },
        { id: 5, title: 'Validation', shortLabel: 'VALIDATE', component: Step5Validation },
        { id: 6, title: 'Export', shortLabel: 'EXPORT', component: Step6Export },
      ];
    } else if (mkApproach === 'imported') {
      // Imported: Skip to import/validation/export only
      return [
        ...baseSteps,
        { id: 5, title: 'Validation', shortLabel: 'VALIDATE', component: Step5Validation },
        { id: 6, title: 'Export', shortLabel: 'EXPORT', component: Step6Export },
      ];
    }

    // Default: Full wizard
    return [
      ...baseSteps,
      { id: 1, title: 'Hierarchy Planning', shortLabel: 'PLAN', component: Step1_5HierarchyPlanning },
      { id: 2, title: 'Hierarchy Setup', shortLabel: 'SETUP', component: Step2HierarchySetup },
      { id: 3, title: 'Zone Definition', shortLabel: 'ZONES', component: Step3ZoneDefinition },
      { id: 4, title: 'Door Assignment', shortLabel: 'ASSIGN', component: Step4DoorAssignment },
      { id: 5, title: 'Validation', shortLabel: 'VALIDATE', component: Step5Validation },
      { id: 6, title: 'Export', shortLabel: 'EXPORT', component: Step6Export },
    ];
  };

  const wizardSteps = getWizardSteps();
  const currentStepConfig = wizardSteps[wizardStep];
  const CurrentStepComponent = currentStepConfig.component;

  const handleNext = () => {
    if (wizardStep < wizardSteps.length - 1) {
      setWizardStep(wizardStep + 1);
    }
  };

  const handleBack = () => {
    if (wizardStep > 0) {
      setWizardStep(wizardStep - 1);
    } else if (wizardStep === 0 && onBackToSetup) {
      // When on first wizard step, go back to Project Setup (Step 0)
      onBackToSetup();
    }
  };

  const handleStepClick = (stepIndex) => {
    setWizardStep(stepIndex);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!mkProject) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Master Key System Not Enabled</h3>
        <p className="text-sm text-gray-600 mb-4">
          Please enable the Master Key System in Step 0 (Project Setup) to access this wizard.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="animate-slideUp">
      {/* Wizard Progress Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Master Key System Design</h2>
            <p className="text-sm text-gray-600">
              Step {wizardStep + 1} of {wizardSteps.length}: {currentStepConfig.title}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Project: <span className="font-semibold text-gray-900">{projectName}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="max-w-5xl mx-auto">
            {/* Step Labels */}
            <div className={`grid gap-2 mb-4`} style={{ gridTemplateColumns: `repeat(${wizardSteps.length}, 1fr)` }}>
              {wizardSteps.map((step, index) => {
                const isActive = wizardStep === index && !exportCompleted;
                const isComplete = wizardStep > index || (wizardStep === wizardSteps.length - 1 && exportCompleted);

                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <button
                      onClick={() => handleStepClick(index)}
                      className={`text-xs font-bold uppercase tracking-wide transition-colors mb-2 ${
                        isActive ? 'text-purple-700' : isComplete ? 'text-emerald-700' : 'text-gray-400'
                      }`}
                    >
                      {step.shortLabel}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-gray-300 rounded-full overflow-hidden mb-3">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-700 ease-out"
                style={{
                  width: `${exportCompleted ? 100 : (wizardStep * 100 / (wizardSteps.length - 1))}%`
                }}
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-25"
                  style={{
                    animation: 'shimmer 2s infinite',
                    transform: 'translateX(-100%)'
                  }}
                />
              </div>
            </div>

            {/* Step Markers */}
            <div className="relative -mt-7 mb-4">
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${wizardSteps.length}, 1fr)` }}>
                {wizardSteps.map((step, index) => {
                  const isActive = wizardStep === index && !exportCompleted;
                  const isComplete = wizardStep > index || (wizardStep === wizardSteps.length - 1 && exportCompleted);

                  return (
                    <div key={step.id} className="flex justify-center">
                      <button
                        onClick={() => handleStepClick(index)}
                        className="focus:outline-none"
                      >
                        <div
                          className={`w-8 h-8 rounded-full border-3 flex items-center justify-center transition-all duration-300 ${
                            isActive
                              ? 'bg-purple-600 border-white shadow-lg scale-110'
                              : isComplete
                              ? 'bg-emerald-500 border-white shadow-md'
                              : 'bg-white border-gray-300 hover:border-purple-400 hover:scale-105'
                          }`}
                        >
                          {isComplete && (
                            <Check size={16} strokeWidth={3} className="text-white" />
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress Percentage */}
            <div className="text-center">
              <span className="inline-block px-4 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-md">
                {exportCompleted ? 100 : Math.round((wizardStep * 100 / (wizardSteps.length - 1)))}% Complete
              </span>
            </div>
          </div>
        </div>

        {/* Add custom animations */}
        <style>{`
          @keyframes progress-animation {
            0% {
              background-position: 0 0;
            }
            100% {
              background-position: 40px 0;
            }
          }

          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(200%);
            }
          }

          @keyframes bounce-slow {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-4px);
            }
          }

          @keyframes pulse-slow {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.8;
            }
          }

          .animate-bounce-slow {
            animation: bounce-slow 2s infinite;
          }

          .animate-pulse-slow {
            animation: pulse-slow 2s infinite;
          }
        `}</style>
      </div>

      {/* Current Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <CurrentStepComponent
          onNext={handleNext}
          onBack={handleBack}
          projectDoors={projectDoors}
          projectName={projectName}
          showNotice={showNotice}
          showConfirm={showConfirm}
          onExportComplete={() => setExportCompleted(true)}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={wizardStep === 0 && !onBackToSetup}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            wizardStep === 0 && !onBackToSetup
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <ChevronLeft size={20} />
          {wizardStep === 0 ? 'Back to Setup' : 'Back'}
        </button>

        <div className="text-sm text-gray-500">
          Step {wizardStep + 1} / {wizardSteps.length}
        </div>

        <button
          onClick={handleNext}
          disabled={wizardStep === wizardSteps.length - 1}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            wizardStep === wizardSteps.length - 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
          }`}
        >
          {wizardStep === wizardSteps.length - 1 ? 'Finish' : 'Continue'}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default MasterKeyWizard;
