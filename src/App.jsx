import React, { useState } from 'react';
import { 
  LayoutDashboard, ClipboardList, Users, Package, FileText, 
  CheckCircle, Search, Bell, ShieldCheck, Hammer, Truck, FileCheck, BarChart3, 
  Plus, ArrowLeft, LogOut
} from 'lucide-react';

// --- CONFIGURATION & DUMMY DATA ---

const ROLES = {
  ADMIN: 'Super Admin',
  CUSTOMER: 'Customer',
  MANUFACTURER: 'Manufacturer',
  MAINTENANCE: 'Maintenance Provider'
};

const SAMPLE_CREDENTIALS = [
  { role: ROLES.ADMIN, name: 'Super Admin', email: 'admin@test.com', pass: '123' },
  { role: ROLES.CUSTOMER, name: 'Builder Inc.', email: 'builder@test.com', pass: '123' },
  { role: ROLES.MANUFACTURER, name: 'Alpha Lifts (Mfr A)', email: 'alpha@test.com', pass: '123', id: 'mfr-a' },
  { role: ROLES.MANUFACTURER, name: 'Beta Elevators (Mfr B)', email: 'beta@test.com', pass: '123', id: 'mfr-b' },
  { role: ROLES.MANUFACTURER, name: 'Gamma Corp (Mfr C)', email: 'gamma@test.com', pass: '123', id: 'mfr-c' },
  { role: ROLES.MANUFACTURER, name: 'Delta Lifts (Mfr D)', email: 'delta@test.com', pass: '123', id: 'mfr-d' },
  { role: ROLES.MAINTENANCE, name: 'Service Pro', email: 'service@test.com', pass: '123' },
];

const CORE_STAGES = [
  { id: 1, title: 'Need Discovery', icon: <Search size={16} /> },
  { id: 2, title: 'Measurements', icon: <ClipboardList size={16} /> },
  { id: 3, title: 'Feasibility', icon: <FileCheck size={16} /> },
  { id: 4, title: 'Bidding', icon: <Users size={16} /> },
  { id: 5, title: 'Selection', icon: <BarChart3 size={16} /> },
  { id: 6, title: 'Contract', icon: <FileText size={16} /> },
  { id: 7, title: 'Design (GAD)', icon: <CheckCircle size={16} /> },
  { id: 8, title: 'Production', icon: <Hammer size={16} /> },
  { id: 9, title: 'Installation', icon: <Truck size={16} /> },
  { id: 10, title: 'Handover', icon: <ShieldCheck size={16} /> },
];

// Seed Products for Dummy Manufacturers
const INITIAL_PRODUCTS = [
  { id: 'p1', mfrId: 'mfr-a', name: 'Alpha Glide 3000', type: 'Passenger', capacity: '6 Persons', price: 1200000 },
  { id: 'p2', mfrId: 'mfr-b', name: 'Beta Max Load', type: 'Freight', capacity: '2000 kg', price: 1800000 },
  { id: 'p3', mfrId: 'mfr-c', name: 'Gamma Eco Home', type: 'Home Lift', capacity: '4 Persons', price: 950000 },
  { id: 'p4', mfrId: 'mfr-d', name: 'Delta High Speed', type: 'Passenger', capacity: '10 Persons', price: 2200000 },
];

// Helper for Currency
const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);

// --- SHARED UI COMPONENTS ---

const StatusBadge = ({ status }) => {
  const styles = {
    Active: 'bg-emerald-100 text-emerald-800',
    Pending: 'bg-amber-100 text-amber-800',
    Bidding: 'bg-blue-100 text-blue-800',
    Quoted: 'bg-purple-100 text-purple-800',
    'Action Required': 'bg-red-100 text-red-800',
    Completed: 'bg-slate-100 text-slate-800',
    Accepted: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-50 text-red-400',
    Submitted: 'bg-blue-50 text-blue-600',
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold ${
        styles[status] || styles['Pending']
      }`}
    >
      {status}
    </span>
  );
};

const Timeline = ({ activeStage }) => (
  <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm overflow-x-auto mb-6">
    <h3 className="font-bold text-sm text-slate-500 uppercase mb-6 tracking-wider">
      Live Project Status
    </h3>
    <div className="flex items-center min-w-[800px]">
      {CORE_STAGES.map((stage, idx) => {
        const isActive = stage.id === activeStage;
        const isCompleted = stage.id < activeStage;
        return (
          <div key={stage.id} className="relative flex-1 group">
            <div className="flex flex-col items-center z-10 relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  isActive
                    ? 'bg-emerald-600 border-emerald-600 text-white scale-110 shadow-lg'
                    : isCompleted
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                    : 'bg-white border-slate-200 text-slate-300'
                }`}
              >
                {isCompleted ? <CheckCircle size={14} /> : stage.id}
              </div>
              <span
                className={`text-[10px] mt-2 font-medium text-center absolute top-8 w-24 ${
                  isActive
                    ? 'text-emerald-700 font-bold'
                    : isCompleted
                    ? 'text-emerald-600'
                    : 'text-slate-400'
                }`}
              >
                {stage.title}
              </span>
            </div>
            {idx !== CORE_STAGES.length - 1 && (
              <div
                className={`absolute top-4 left-1/2 w-full h-1 -translate-y-1/2 -z-0 ${
                  isCompleted ? 'bg-emerald-500' : 'bg-slate-100'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  </div>
);

// --- AUTH PAGE ---

const LoginPage = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row min-h-[600px]">
        <div className="md:w-1/2 bg-slate-900 text-white p-12 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="bg-emerald-500 p-2 rounded">
                <Package size={28} />
              </div>
              <span className="text-3xl font-bold tracking-tight">Lift4M</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Marketplace &amp; Project Mgmt
            </h1>
            <p className="text-slate-400">
              Platform for Builders, Manufacturers &amp; Service Teams.
            </p>
          </div>
        </div>
        <div className="md:w-1/2 p-8 md:p-12 overflow-y-auto">
          <h2 className="text-xl font-bold mb-6">Select a Role to Simulate</h2>
          <div className="space-y-3">
            {SAMPLE_CREDENTIALS.map((cred, idx) => (
              <button
                key={idx}
                onClick={() => onLogin(cred)}
                className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition group"
              >
                <div className="text-left">
                  <p className="font-bold text-slate-800">{cred.name}</p>
                  <p className="text-xs text-slate-500">{cred.role}</p>
                </div>
                <div className="text-emerald-600 opacity-0 group-hover:opacity-100 font-bold text-sm">
                  Login &rarr;
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUPER ADMIN DASHBOARD ---

const SuperAdminDashboard = ({ projects, quotes }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedProject, setSelectedProject] = useState(null);

  const totalValue = quotes
    .filter((q) => q.status === 'Accepted')
    .reduce((acc, curr) => acc + curr.price, 0);
  const potentialValue = quotes
    .filter((q) => q.status === 'Submitted')
    .reduce((acc, curr) => acc + curr.price, 0);
  const activeBids = quotes.filter((q) => q.status === 'Submitted').length;

  const allLogs = projects
    .flatMap((p) =>
      (p.auditLogs || []).map((log) => ({
        ...log,
        projectName: p.name,
        projectId: p.id,
      }))
    )
    .sort((a, b) => b.id - a.id);

  if (selectedProject) {
    const projectQuotes = quotes.filter(
      (q) => q.projectId === selectedProject.id
    );
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedProject(null)}
          className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Back to Admin Dashboard
        </button>
        <div className="bg-slate-900 text-white p-4 rounded-lg flex justify-between items-center">
          <h2 className="text-xl font-bold">
            Admin Audit: {selectedProject.name}
          </h2>
          <span className="text-xs bg-slate-700 px-2 py-1 rounded">
            ID: {selectedProject.id}
          </span>
        </div>
        <Timeline activeStage={selectedProject.stage} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="font-bold mb-4">Quotes Received</h3>
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="pb-2">Mfr</th>
                  <th className="pb-2">Price</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {projectQuotes.map((q) => (
                  <tr key={q.id} className="border-t">
                    <td className="py-2">{q.mfrName}</td>
                    <td className="py-2 font-mono">{formatINR(q.price)}</td>
                    <td className="py-2">
                      <StatusBadge status={q.status} />
                    </td>
                  </tr>
                ))}
                {projectQuotes.length === 0 && (
                  <tr>
                    <td
                      colSpan="3"
                      className="py-4 text-center text-slate-400"
                    >
                      No quotes yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="font-bold mb-4">Detailed Audit Log</h3>
            <div className="max-h-60 overflow-y-auto space-y-3">
              {(selectedProject.auditLogs || []).map((log) => (
                <div
                  key={log.id}
                  className="text-sm border-l-2 border-slate-200 pl-3"
                >
                  <p className="font-medium text-slate-800">{log.action}</p>
                  <div className="flex justify-between mt-1 text-xs text-slate-500">
                    <span>By: {log.user}</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              ))}
              {(!selectedProject.auditLogs ||
                selectedProject.auditLogs.length === 0) && (
                <p className="text-xs text-slate-400">
                  No audit entries yet for this project.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-slate-200">
        {['Overview', 'Projects', 'Transactions'].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
              activeTab === t
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-700">
            Macro Platform View
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">
                Total Platform Value
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatINR(totalValue)}
              </p>
              <p className="text-xs text-slate-400 mt-2">Realized Revenue</p>
            </div>
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">
                Pipeline Value
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {formatINR(potentialValue)}
              </p>
              <p className="text-xs text-slate-400 mt-2">Open Bids</p>
            </div>
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">
                Active Projects
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {projects.length}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Across all stages
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">
                Bidding Activity
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {activeBids}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Quotes Submitted
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800">
                  Recent Transactions (Micro View)
                </h3>
              </div>
              <div className="space-y-4">
                {allLogs.slice(0, 5).map((log, i) => (
                  <div
                    key={i}
                    className="flex gap-3 text-sm border-b border-slate-50 last:border-0 pb-2"
                  >
                    <div className="mt-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">
                        {log.action}
                      </p>
                      <p className="text-xs text-slate-500">
                        Project: {log.projectName} • User: {log.user}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {log.timestamp.split(',')[1]}
                    </span>
                  </div>
                ))}
                {allLogs.length === 0 && (
                  <p className="text-slate-400 text-center py-4">
                    No transactions recorded yet.
                  </p>
                )}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">
                Manufacturer Leaderboard
              </h3>
              <div className="space-y-3">
                {['Alpha Lifts', 'Beta Elevators', 'Gamma Corp', 'Delta Lifts'].map(
                  (mfr, i) => {
                    const mfrQuotes = quotes.filter((q) =>
                      q.mfrName.includes(mfr)
                    );
                    const wins = mfrQuotes.filter(
                      (q) => q.status === 'Accepted'
                    ).length;
                    return (
                      <div
                        key={i}
                        className="flex justify-between items-center p-3 bg-slate-50 rounded"
                      >
                        <span className="font-medium text-sm">{mfr}</span>
                        <div className="text-xs flex gap-3">
                          <span className="text-slate-500">
                            {mfrQuotes.length} Quotes
                          </span>
                          <span className="font-bold text-emerald-600">
                            {wins} Wins
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Projects' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="p-4">Project ID</th>
                <th className="p-4">Project Name</th>
                <th className="p-4">Client</th>
                <th className="p-4">Stage</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono text-slate-500">{p.id}</td>
                  <td className="p-4 font-medium text-slate-800">{p.name}</td>
                  <td className="p-4">{p.client}</td>
                  <td className="p-4">Stage {p.stage}</td>
                  <td className="p-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedProject(p)}
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="p-8 text-center text-slate-400"
                  >
                    No projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Transactions' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold mb-4">Complete Transaction Log</h3>
          <div className="space-y-0 divide-y divide-slate-100">
            {allLogs.map((log, i) => (
              <div
                key={i}
                className="py-3 flex justify-between items-center hover:bg-slate-50 px-2 rounded transition"
              >
                <div className="flex gap-4 items-center">
                  <div className="text-xs font-mono text-slate-400 w-32">
                    {log.timestamp}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {log.action}
                    </p>
                    <p className="text-xs text-slate-500">
                      User: {log.user} • Project: {log.projectName} (
                      {log.projectId})
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {log.action.includes('Quote Received') && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                      Bid
                    </span>
                  )}
                  {log.action.includes('Created') && (
                    <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded">
                      New
                    </span>
                  )}
                </div>
              </div>
            ))}
            {allLogs.length === 0 && (
              <p className="text-center text-slate-400">
                No transactions recorded.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- CUSTOMER COMPONENTS ---

const CustomerWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    type: '',
    location: '',
    floors: '',
    capacity: '',
    shaftAvailable: '',
    machineRoom: '',
    width: '',
    depth: '',
  });

  const update = (k, v) => setData({ ...data, [k]: v });
  const next = () => setStep((s) => s + 1);

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 p-8 my-8">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="font-bold text-lg">New Lift Requirement</h2>
        <span className="text-xs bg-slate-100 px-2 py-1 rounded">
          Step {step}/5
        </span>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3>Building Type?</h3>
          <div className="grid grid-cols-2 gap-4">
            {['Residential', 'Commercial', 'Industrial', 'Hospital'].map(
              (t) => (
                <button
                  key={t}
                  onClick={() => {
                    update('type', t);
                    next();
                  }}
                  className="p-4 border rounded hover:border-emerald-500"
                >
                  {t}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3>Configuration</h3>
          <input
            placeholder="Location (City)"
            className="w-full border p-2 rounded"
            onChange={(e) => update('location', e.target.value)}
          />
          <input
            placeholder="Floors"
            type="number"
            className="w-full border p-2 rounded"
            onChange={(e) => update('floors', e.target.value)}
          />
          <button
            onClick={next}
            className="bg-emerald-600 text-white px-4 py-2 rounded"
          >
            Next
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3>Shaft Ready?</h3>
          <div className="flex gap-4">
            <button
              onClick={() => {
                update('shaftAvailable', 'Yes');
                next();
              }}
              className="flex-1 border p-4"
            >
              Yes
            </button>
            <button
              onClick={() => {
                update('shaftAvailable', 'No');
                next();
              }}
              className="flex-1 border p-4"
            >
              No
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3>Dimensions</h3>
          <input
            placeholder="Width (mm)"
            className="w-full border p-2 rounded"
            onChange={(e) => update('width', e.target.value)}
          />
          <input
            placeholder="Depth (mm)"
            className="w-full border p-2 rounded"
            onChange={(e) => update('depth', e.target.value)}
          />
          <button
            onClick={next}
            className="bg-emerald-600 text-white px-4 py-2 rounded"
          >
            Next
          </button>
        </div>
      )}

      {step === 5 && (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">Submit Enquiry?</h3>
          <button
            onClick={() => onComplete(data)}
            className="bg-emerald-600 text-white px-8 py-3 rounded"
          >
            Post to Marketplace
          </button>
        </div>
      )}
    </div>
  );
};

const CustomerProjectView = ({
  project,
  quotes,
  onBack,
  onSelectQuote,
}) => {
  const [tab, setTab] = useState('Overview');
  const projectQuotes = quotes.filter((q) => q.projectId === project.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-200 rounded-full"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold">{project.name}</h2>
          <p className="text-sm text-slate-500">
            ID: {project.id} • {project.location}
          </p>
        </div>
      </div>
      <Timeline activeStage={project.stage} />

      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
        {['Overview', 'Review Proposals', 'Financials', 'Files'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition ${
              tab === t
                ? 'border-b-2 border-emerald-500 text-emerald-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t}
            {t === 'Review Proposals' && projectQuotes.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                {projectQuotes.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Project Specs</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Type</p>
              <b>{project.type}</b>
            </div>
            <div>
              <p className="text-slate-500">Floors</p>
              <b>{project.floors}</b>
            </div>
            <div>
              <p className="text-slate-500">Shaft</p>
              <b>
                {project.width} x {project.depth} mm
              </b>
            </div>
            <div>
              <p className="text-slate-500">Status</p>
              <StatusBadge status={project.status} />
            </div>
          </div>
          {project.stage === 4 && projectQuotes.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-bold text-blue-800">
                  Action Required: {projectQuotes.length} Quotes Received
                </p>
                <p className="text-xs text-blue-600">
                  Please review proposals and select a manufacturer to proceed
                  to Stage 5.
                </p>
              </div>
              <button
                onClick={() => setTab('Review Proposals')}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold"
              >
                Review Now
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'Review Proposals' && (
        <div className="space-y-6">
          <h3 className="font-bold text-lg text-slate-800">
            Received Quotations
          </h3>
          {projectQuotes.length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed rounded text-slate-400">
              Waiting for manufacturers to submit bids...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectQuotes.map((q) => (
                <div
                  key={q.id}
                  className="bg-white border-2 border-slate-100 rounded-xl p-5 hover:border-emerald-500 transition shadow-sm relative overflow-hidden"
                >
                  {q.status === 'Accepted' && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs px-3 py-1 rounded-bl-lg font-bold">
                      SELECTED
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                      {q.mfrName[0]}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-800">
                        {formatINR(q.price)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Total Project Cost
                      </p>
                    </div>
                  </div>
                  <h4 className="font-bold text-lg mb-1">{q.mfrName}</h4>
                  <div className="text-sm text-slate-600 mb-4 bg-slate-50 p-2 rounded">
                    <p>
                      <b>Product:</b> {q.productName}
                    </p>
                    <p>
                      <b>Capacity:</b> {q.specs}
                    </p>
                    <p>
                      <b>Lead Time:</b> {q.leadTime} Weeks
                    </p>
                  </div>
                  {project.stage === 4 ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button className="border border-slate-300 text-slate-600 py-2 rounded text-sm font-bold">
                        Ask Question
                      </button>
                      <button
                        onClick={() =>
                          onSelectQuote(project.id, q.id)
                        }
                        className="bg-slate-900 text-white py-2 rounded text-sm font-bold hover:bg-emerald-600 transition"
                      >
                        Select &amp; Close
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-sm text-slate-400 italic">
                      Bidding Closed
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- MANUFACTURER COMPONENTS ---

const LeadsMarketplace = ({ projects, user, onSubmitQuote, products }) => {
  const [selectedLead, setSelectedLead] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    price: '',
    leadTime: '',
    productId: '',
  });

  const leads = projects.filter((p) => p.stage <= 4);

  const submit = () => {
    const selectedProduct = products.find(
      (p) => p.id === quoteForm.productId
    );
    onSubmitQuote({
      projectId: selectedLead.id,
      mfrId: user.id,
      mfrName: user.name,
      price: parseInt(quoteForm.price, 10),
      leadTime: quoteForm.leadTime,
      productId: quoteForm.productId,
      productName: selectedProduct?.name || 'Custom',
      specs: selectedProduct?.capacity || 'N/A',
    });
    setSelectedLead(null);
    setQuoteForm({ price: '', leadTime: '', productId: '' });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Users size={24} /> Opportunity Marketplace
      </h2>

      {selectedLead ? (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-lg max-w-2xl mx-auto">
          <button
            onClick={() => setSelectedLead(null)}
            className="text-sm text-slate-500 mb-4 hover:underline"
          >
            ← Back to Leads
          </button>
          <h3 className="text-xl font-bold mb-4">
            Quote for: {selectedLead.name}
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm bg-slate-50 p-4 rounded">
            <div>
              <span className="text-slate-500 block">Floors</span>
              <b>{selectedLead.floors}</b>
            </div>
            <div>
              <span className="text-slate-500 block">Dims</span>
              <b>
                {selectedLead.width}x{selectedLead.depth}
              </b>
            </div>
            <div>
              <span className="text-slate-500 block">Type</span>
              <b>{selectedLead.type}</b>
            </div>
            <div>
              <span className="text-slate-500 block">Location</span>
              <b>{selectedLead.location}</b>
            </div>
          </div>

          <h4 className="font-bold mb-3 border-b pb-2">Prepare Quotation</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">
                Select Product from Inventory
              </label>
              <select
                className="w-full border p-2 rounded"
                value={quoteForm.productId}
                onChange={(e) =>
                  setQuoteForm({ ...quoteForm, productId: e.target.value })
                }
              >
                <option value="">-- Choose Product --</option>
                {products
                  .filter((p) => p.mfrId === user.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.type})
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">
                  Your Price (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    className="w-full border p-2 pl-6 rounded"
                    value={quoteForm.price}
                    onChange={(e) =>
                      setQuoteForm({ ...quoteForm, price: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">
                  Lead Time (Weeks)
                </label>
                <input
                  type="number"
                  className="w-full border p-2 rounded"
                  value={quoteForm.leadTime}
                  onChange={(e) =>
                    setQuoteForm({
                      ...quoteForm,
                      leadTime: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <button
              onClick={submit}
              disabled={!quoteForm.productId || !quoteForm.price}
              className="w-full bg-emerald-600 text-white py-3 rounded font-bold hover:bg-emerald-700 disabled:bg-slate-300"
            >
              Submit Quote
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.length === 0 && (
            <div className="col-span-3 text-center py-12 text-slate-400">
              No active leads currently available.
            </div>
          )}
          {leads.map((p) => (
            <div
              key={p.id}
              className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between mb-2">
                <StatusBadge status={p.status} />
                <span className="text-xs text-slate-400">#{p.id}</span>
              </div>
              <h3 className="font-bold text-lg mb-1">{p.name}</h3>
              <p className="text-sm text-slate-500 mb-4">
                {p.location} • {p.floors} Floors
              </p>
              <button
                onClick={() => setSelectedLead(p)}
                className="w-full bg-slate-900 text-white py-2 rounded text-sm font-bold hover:bg-slate-800"
              >
                View &amp; Quote
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ManufacturerDashboard = ({ quotes, user, setView }) => {
  const myQuotes = quotes.filter((q) => q.mfrId === user.id);
  const pending = myQuotes.filter((q) => q.status === 'Submitted').length;
  const won = myQuotes.filter((q) => q.status === 'Accepted').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          onClick={() => setView('leads')}
          className="bg-white p-6 rounded border shadow-sm cursor-pointer hover:border-emerald-500 group"
        >
          <h3 className="font-bold text-lg mb-2 text-slate-700 group-hover:text-emerald-600">
            Deal Pipeline
          </h3>
          <div className="text-4xl font-bold text-slate-800">
            {pending}{' '}
            <span className="text-sm font-normal text-slate-500">
              Active Quotes
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Click to view Leads Marketplace
          </p>
        </div>
        <div className="bg-white p-6 rounded border shadow-sm">
          <h3 className="font-bold text-lg mb-2 text-slate-700">
            Success Rate
          </h3>
          <div className="text-4xl font-bold text-slate-800">
            {won}{' '}
            <span className="text-sm font-normal text-slate-500">
              Deals Won
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="font-bold text-lg mb-4">My Quote History</h3>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3">Project ID</th>
              <th className="p-3">Product Offered</th>
              <th className="p-3">Price Quoted</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {myQuotes.map((q) => (
              <tr key={q.id} className="border-t">
                <td className="p-3 font-mono">{q.projectId}</td>
                <td className="p-3 font-bold">{q.productName}</td>
                <td className="p-3">{formatINR(q.price)}</td>
                <td className="p-3">
                  <StatusBadge status={q.status} />
                </td>
              </tr>
            ))}
            {myQuotes.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="p-4 text-center text-slate-400"
                >
                  No quotes submitted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [activeProject, setActiveProject] = useState(null);

  const [projects, setProjects] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [products] = useState(INITIAL_PRODUCTS);

  const handleLogin = (cred) => {
    setUser(cred);
    setView('dashboard');
    setActiveProject(null);
  };

  const handleCreateProject = (data) => {
    if (!user) return;
    const newProject = {
      id: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
      name: `${data.type} Project`,
      stage: 4,
      status: 'Bidding',
      type: data.type,
      client: user.name,
      floors: data.floors,
      location: data.location,
      width: data.width,
      depth: data.depth,
      auditLogs: [
        {
          id: Date.now(),
          action: 'Project Created & Posted to Marketplace',
          user: user.name,
          timestamp: new Date().toLocaleString(),
        },
      ],
    };
    setProjects((prev) => [newProject, ...prev]);
    setView('dashboard');
  };

  const handleQuoteSubmit = (quoteData) => {
    const newQuote = {
      id: `QT-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Submitted',
      submittedAt: new Date(),
      ...quoteData,
    };
    setQuotes((prev) => [newQuote, ...prev]);

    setProjects((prev) =>
      prev.map((p) =>
        p.id === quoteData.projectId
          ? {
              ...p,
              status: 'Action Required',
              auditLogs: [
                {
                  id: Date.now(),
                  action: `Quote Received from ${quoteData.mfrName}`,
                  user: 'System',
                  timestamp: new Date().toLocaleString(),
                },
                ...(p.auditLogs || []),
              ],
            }
          : p
      )
    );

    setView('dashboard');
  };

  const handleSelectQuote = (projectId, quoteId) => {
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === quoteId
          ? { ...q, status: 'Accepted' }
          : q.projectId === projectId
          ? { ...q, status: 'Rejected' }
          : q
      )
    );

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              stage: 5,
              status: 'Selection',
              auditLogs: [
                {
                  id: Date.now(),
                  action:
                    'Manufacturer Selected. Moving to Contracting.',
                  user: user?.name || 'Customer',
                  timestamp: new Date().toLocaleString(),
                },
                ...(p.auditLogs || []),
              ],
            }
          : p
      )
    );

    setActiveProject(null);
  };

  const renderContent = () => {
    if (view === 'wizard') {
      return <CustomerWizard onComplete={handleCreateProject} />;
    }

    if (!user) return null;

    if (user.role === ROLES.ADMIN) {
      return (
        <SuperAdminDashboard
          projects={projects}
          quotes={quotes}
        />
      );
    }

    if (user.role === ROLES.CUSTOMER) {
      if (activeProject) {
        return (
          <CustomerProjectView
            project={activeProject}
            quotes={quotes}
            onBack={() => setActiveProject(null)}
            onSelectQuote={handleSelectQuote}
          />
        );
      }
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-lg border shadow-sm">
            <div>
              <h2 className="text-2xl font-bold">
                Welcome, {user.name}
              </h2>
              <p className="text-slate-500">
                Manage your lift installations.
              </p>
            </div>
            <button
              onClick={() => setView('wizard')}
              className="bg-emerald-600 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Plus size={18} /> New Project
            </button>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h3 className="font-bold text-lg mb-4">My Projects</h3>
            {projects.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                No active projects. Create one to start bidding.
              </p>
            ) : (
              <div className="space-y-3">
                {projects.map((p) => {
                  const count = quotes.filter(
                    (q) => q.projectId === p.id
                  ).length;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setActiveProject(p)}
                      className="p-4 border rounded hover:border-emerald-500 cursor-pointer flex justify-between items-center group transition"
                    >
                      <div>
                        <p className="font-bold text-lg group-hover:text-emerald-700">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {p.id} •{' '}
                          {p.stage === 4
                            ? 'Bidding Phase'
                            : 'Processing'}
                        </p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={p.status} />
                        {p.stage === 4 && count > 0 && (
                          <p className="text-xs text-blue-600 font-bold mt-1">
                            {count} Quotes Received
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (user.role === ROLES.MANUFACTURER) {
      if (view === 'leads') {
        return (
          <LeadsMarketplace
            projects={projects}
            user={user}
            products={products}
            onSubmitQuote={handleQuoteSubmit}
          />
        );
      }
      return (
        <ManufacturerDashboard
          quotes={quotes}
          user={user}
          setView={setView}
        />
      );
    }

    // Maintenance view can be plugged in here later
    return <div>Dashboard Placeholder</div>;
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      <div className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col h-screen fixed left-0 top-0 z-20">
        <div className="p-6 flex items-center gap-2 text-white">
          <div className="bg-emerald-500 p-1 rounded">
            <Package size={24} />
          </div>
          <span className="text-xl font-bold">Lift4M</span>
        </div>
        <div className="px-6 py-2">
          <nav className="space-y-1">
            <button
              onClick={() => {
                setView('dashboard');
                setActiveProject(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded transition ${
                view === 'dashboard'
                  ? 'bg-slate-800 text-white'
                  : 'hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard size={18} /> Dashboard
            </button>
            {user.role === ROLES.MANUFACTURER && (
              <button
                onClick={() => setView('leads')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded transition ${
                  view === 'leads'
                    ? 'bg-slate-800 text-white'
                    : 'hover:bg-slate-800'
                }`}
              >
                <Users size={18} /> Leads Marketplace
              </button>
            )}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-slate-800">
          <div className="mb-4 text-xs text-slate-500 font-mono">
            Logged in as:
            <br />
            <span className="text-white font-bold">{user.name}</span>
          </div>
          <button
            onClick={() => setUser(null)}
            className="flex items-center gap-2 text-xs text-red-400"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="bg-white h-16 border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between px-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">
            Lift4M Workspace
          </h2>
          <div className="bg-slate-100 p-2 rounded-full">
            <Bell size={20} />
          </div>
        </header>
        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
