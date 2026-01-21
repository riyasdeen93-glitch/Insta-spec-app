import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import BetaAuthModal from '../../components/BetaAuthModal';
import {
  Building,
  DoorOpen,
  Key,
  FileSpreadsheet,
  ArrowRight,
  Globe,
  ShieldCheck,
  Layers,
  Home
} from 'lucide-react';

const IndustryHub = () => {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = React.useState(false);

  const modules = [
    {
      id: 'doors',
      title: 'Door Hardware',
      description: 'Complete door hardware specification with ANSI/BHMA and EN compliance',
      icon: DoorOpen,
      path: '/doors',
      features: ['Door Scheduling', 'Hardware Sets', 'Fire Rating Compliance'],
      color: 'from-blue-500 to-indigo-600',
      available: true,
    },
    {
      id: 'masterkey',
      title: 'Master Key Systems',
      description: 'Hierarchical keying design with zone-based or custom approaches',
      icon: Key,
      path: '/', // Links back to main app for now
      features: ['ANSI/BHMA A156.28', 'EN 1303 Support', 'Auto-Assignment'],
      color: 'from-emerald-500 to-teal-600',
      available: true,
    },
    {
      id: 'access',
      title: 'Access Control',
      description: 'Electronic access control system design and specification',
      icon: ShieldCheck,
      path: '#',
      features: ['Card Readers', 'Biometrics', 'Integration Points'],
      color: 'from-purple-500 to-violet-600',
      available: false,
    },
    {
      id: 'exports',
      title: 'Project Exports',
      description: 'Generate professional deliverables in multiple formats',
      icon: FileSpreadsheet,
      path: '#',
      features: ['PDF Schedules', 'Excel Workbooks', 'BIM Integration'],
      color: 'from-orange-500 to-amber-600',
      available: false,
    },
  ];

  const stats = [
    { label: 'Standards Supported', value: '2+', icon: Globe },
    { label: 'Hardware Categories', value: '10', icon: Layers },
    { label: 'Facility Types', value: '6', icon: Building },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Beta Auth Modal */}
      {showLogin && (
        <BetaAuthModal onClose={() => setShowLogin(false)} />
      )}

      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">InstaSpec</h1>
                <p className="text-xs text-slate-400">Industry Hub</p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
              {user ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-sm text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {user.email}
                </div>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                >
                  Beta Login
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Architectural Hardware
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Specification Platform
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            Streamline your door hardware specification workflow with intelligent automation,
            compliance checking, and professional exports.
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <stat.icon className="w-5 h-5 text-indigo-400" />
                  <span className="text-3xl font-bold text-white">{stat.value}</span>
                </div>
                <span className="text-sm text-slate-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-8">Platform Modules</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module) => (
              <div
                key={module.id}
                className={`relative rounded-2xl border ${
                  module.available
                    ? 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    : 'border-slate-800 bg-slate-900/50 opacity-60'
                } p-6 transition-all duration-200`}
              >
                {!module.available && (
                  <span className="absolute top-4 right-4 px-2 py-1 rounded-full bg-slate-700 text-xs text-slate-400">
                    Coming Soon
                  </span>
                )}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-4`}>
                  <module.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-white mb-2">{module.title}</h4>
                <p className="text-slate-400 text-sm mb-4">{module.description}</p>
                <ul className="space-y-2 mb-6">
                  {module.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                {module.available && (
                  <Link
                    to={module.path}
                    className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                  >
                    Open Module
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-500 text-sm">
            InstaSpec by Techarix &middot; Door Hardware Specification Platform
          </p>
        </div>
      </footer>
    </div>
  );
};

export default IndustryHub;
