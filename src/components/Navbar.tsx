import React from 'react';
import { Sparkles, FileText, Share2, Clock, Settings, LogIn, CheckCircle2, RefreshCw } from 'lucide-react';
import { UserAuthStatus } from '../types';

interface NavbarProps {
  activeTab: 'spark' | 'queue' | 'accounts' | 'automation';
  setActiveTab: (tab: 'spark' | 'queue' | 'accounts' | 'automation') => void;
  userAuth: UserAuthStatus;
  onConnectGoogle: () => void;
  connectedAccountCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userAuth,
  onConnectGoogle,
  connectedAccountCount
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('spark')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">Social Spark</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">Google Docs to Social Auto-Publisher</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav id="nav-tabs" className="hidden md:flex items-center space-x-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60">
            <button
              id="tab-btn-spark"
              onClick={() => setActiveTab('spark')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'spark'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Spark Studio</span>
            </button>

            <button
              id="tab-btn-queue"
              onClick={() => setActiveTab('queue')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'queue'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Queue & History</span>
            </button>

            <button
              id="tab-btn-accounts"
              onClick={() => setActiveTab('accounts')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'accounts'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Channels</span>
              <span className="ml-1 px-1.5 py-0.2 text-xs rounded-full bg-slate-900/80 text-amber-300 font-bold">
                {connectedAccountCount}
              </span>
            </button>

            <button
              id="tab-btn-automation"
              onClick={() => setActiveTab('automation')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'automation'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Auto-Sync</span>
            </button>
          </nav>

          {/* User & Workspace Authentication */}
          <div className="flex items-center space-x-3">
            {userAuth.authenticated ? (
              <div id="google-auth-badge" className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800/80 rounded-xl border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">{userAuth.email}</span>
                <span className="sm:hidden">Google Docs</span>
              </div>
            ) : (
              <button
                id="connect-google-btn"
                onClick={onConnectGoogle}
                className="flex items-center space-x-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-blue-500/20"
              >
                <FileText className="w-4 h-4" />
                <span>Connect Google Docs</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bar */}
      <div className="md:hidden flex border-t border-slate-800 bg-slate-900/95 px-2 py-1 justify-around text-xs font-medium text-slate-300">
        <button
          onClick={() => setActiveTab('spark')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-lg ${activeTab === 'spark' ? 'text-amber-400 font-bold' : ''}`}
        >
          <Sparkles className="w-4 h-4 mb-0.5" />
          <span>Studio</span>
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-lg ${activeTab === 'queue' ? 'text-amber-400 font-bold' : ''}`}
        >
          <Clock className="w-4 h-4 mb-0.5" />
          <span>Queue</span>
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-lg ${activeTab === 'accounts' ? 'text-amber-400 font-bold' : ''}`}
        >
          <Share2 className="w-4 h-4 mb-0.5" />
          <span>Channels</span>
        </button>
        <button
          onClick={() => setActiveTab('automation')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-lg ${activeTab === 'automation' ? 'text-amber-400 font-bold' : ''}`}
        >
          <Settings className="w-4 h-4 mb-0.5" />
          <span>Auto-Sync</span>
        </button>
      </div>
    </header>
  );
};
