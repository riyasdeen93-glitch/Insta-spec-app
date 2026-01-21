import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import {
  DoorOpen,
  Wrench,
  Key,
  FileSpreadsheet,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

const DoorsOverview = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      id: 'schedule',
      title: 'Door Schedule',
      description: 'Add and manage doors with specifications',
      icon: DoorOpen,
      path: '/', // Links to main app
      color: 'bg-blue-500',
      status: 'available',
    },
    {
      id: 'hardware',
      title: 'Hardware Sets',
      description: 'Configure hardware packages for door types',
      icon: Wrench,
      path: '/',
      color: 'bg-emerald-500',
      status: 'available',
    },
    {
      id: 'masterkey',
      title: 'Master Key Design',
      description: 'Create hierarchical keying systems',
      icon: Key,
      path: '/',
      color: 'bg-purple-500',
      status: 'available',
    },
    {
      id: 'export',
      title: 'Export & Reports',
      description: 'Generate PDF, Excel, and CSV deliverables',
      icon: FileSpreadsheet,
      path: '/',
      color: 'bg-orange-500',
      status: 'available',
    },
  ];

  const recentActivity = [
    { action: 'Project created', project: 'Office Tower A', time: '2 hours ago', status: 'success' },
    { action: 'Hardware sets configured', project: 'Medical Center', time: '1 day ago', status: 'success' },
    { action: 'Master key exported', project: 'Hotel Complex', time: '3 days ago', status: 'success' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Door Hardware Module</h1>
        <p className="text-slate-600">
          Manage door schedules, hardware specifications, and master key systems.
        </p>
      </div>

      {/* Auth Warning */}
      {!user && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Beta Access Required</p>
            <p className="text-sm text-amber-700">
              Please log in with your beta credentials to access all features.
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.id}
            to={action.path}
            className="group p-5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center flex-shrink-0`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-slate-500">{action.description}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Recent Activity</h2>
          {user ? (
            <div className="space-y-3">
              {recentActivity.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{item.action}</p>
                    <p className="text-xs text-slate-500">{item.project}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {item.time}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-4 text-center">
              Log in to see your recent activity
            </p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Module Statistics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Standards Supported</span>
              <span className="text-sm font-semibold text-slate-900">2</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Hardware Categories</span>
              <span className="text-sm font-semibold text-slate-900">10</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Facility Types</span>
              <span className="text-sm font-semibold text-slate-900">6</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-600">Export Formats</span>
              <span className="text-sm font-semibold text-slate-900">3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 p-5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1">Need the Full Experience?</h3>
            <p className="text-indigo-100 text-sm">
              Access the complete application with all features including project management,
              door scheduling, hardware configuration, and master key design.
            </p>
          </div>
          <Link
            to="/"
            className="flex-shrink-0 px-5 py-2.5 rounded-lg bg-white text-indigo-600 font-medium text-sm hover:bg-indigo-50 transition-colors"
          >
            Open Full App
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoorsOverview;
