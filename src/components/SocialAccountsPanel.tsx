import React, { useState } from 'react';
import { Share2, CheckCircle2, AlertCircle, RefreshCw, Key, ShieldCheck, Zap, ToggleLeft, ToggleRight } from 'lucide-react';
import { SocialAccountConfig, SocialPlatform } from '../types';

interface SocialAccountsPanelProps {
  accounts: SocialAccountConfig[];
  onUpdateAccount: (updatedAccount: SocialAccountConfig) => void;
}

const PLATFORM_ICONS: Record<SocialPlatform, { name: string; color: string; badgeBg: string }> = {
  twitter: { name: 'Twitter / X', color: 'text-sky-400', badgeBg: 'bg-sky-500/10 border-sky-500/20 text-sky-300' },
  linkedin: { name: 'LinkedIn', color: 'text-blue-500', badgeBg: 'bg-blue-500/10 border-blue-500/20 text-blue-300' },
  threads: { name: 'Threads', color: 'text-pink-400', badgeBg: 'bg-pink-500/10 border-pink-500/20 text-pink-300' },
  instagram: { name: 'Instagram', color: 'text-fuchsia-400', badgeBg: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-300' },
  facebook: { name: 'Facebook', color: 'text-indigo-400', badgeBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' },
};

export const SocialAccountsPanel: React.FC<SocialAccountsPanelProps> = ({
  accounts,
  onUpdateAccount
}) => {
  const [editingPlatform, setEditingPlatform] = useState<SocialPlatform | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');

  const handleToggleConnect = (acc: SocialAccountConfig) => {
    onUpdateAccount({
      ...acc,
      isConnected: !acc.isConnected,
      lastActive: !acc.isConnected ? 'Just connected' : acc.lastActive
    });
  };

  const handleToggleAutoPost = (acc: SocialAccountConfig) => {
    onUpdateAccount({
      ...acc,
      autoPostEnabled: !acc.autoPostEnabled
    });
  };

  const handleSaveKey = (acc: SocialAccountConfig) => {
    onUpdateAccount({
      ...acc,
      apiKey: apiKeyInput,
      isConnected: true,
      lastActive: 'Credentials configured'
    });
    setEditingPlatform(null);
    setApiKeyInput('');
  };

  return (
    <div id="social-accounts-panel" className="max-w-6xl mx-auto space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs mb-1">
              <Zap className="w-4 h-4" />
              <span>DIRECT SOCIAL MEDIA CHANNELS</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Connected Social Accounts</h2>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Connect your social media accounts to enable one-click posting and automated Google Docs sync.
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div className="text-xs">
              <div className="font-semibold text-white">OAuth & API Status</div>
              <div className="text-emerald-400">Encrypted Sandbox Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const meta = PLATFORM_ICONS[acc.platform];
          const isEditing = editingPlatform === acc.platform;

          return (
            <div
              key={acc.platform}
              className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                acc.isConnected
                  ? 'border-slate-700/80 shadow-lg shadow-black/40'
                  : 'border-slate-800 opacity-80'
              }`}
            >
              <div>
                {/* Header info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={acc.avatarUrl}
                      alt={acc.name}
                      className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-800"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-white">{acc.name}</h3>
                      <p className="text-xs text-slate-400">{acc.handle}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${meta.badgeBg}`}>
                    {meta.name}
                  </span>
                </div>

                {/* Connection Details */}
                <div className="space-y-3 py-3 border-t border-b border-slate-800/80 my-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Account Status:</span>
                    {acc.isConnected ? (
                      <span className="flex items-center text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Connected
                      </span>
                    ) : (
                      <span className="flex items-center text-slate-500">
                        <AlertCircle className="w-3.5 h-3.5 mr-1" /> Not Connected
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Auto-Publish via Docs:</span>
                    <button
                      onClick={() => handleToggleAutoPost(acc)}
                      disabled={!acc.isConnected}
                      className="flex items-center space-x-1.5 focus:outline-none disabled:opacity-40"
                    >
                      {acc.autoPostEnabled ? (
                        <ToggleRight className="w-6 h-6 text-amber-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-600" />
                      )}
                      <span className={acc.autoPostEnabled ? 'text-amber-300 font-semibold' : 'text-slate-500'}>
                        {acc.autoPostEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </button>
                  </div>

                  {acc.lastActive && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Last Activity:</span>
                      <span>{acc.lastActive}</span>
                    </div>
                  )}
                </div>

                {/* API Key Modal / Form */}
                {isEditing && (
                  <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-amber-500/30 text-xs">
                    <label className="block text-amber-300 font-semibold mb-1 flex items-center">
                      <Key className="w-3.5 h-3.5 mr-1" /> Custom API Access Key / Bearer Token
                    </label>
                    <input
                      type="password"
                      placeholder={`Enter ${meta.name} API Key...`}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white mb-2 focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingPlatform(null)}
                        className="px-2.5 py-1 text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveKey(acc)}
                        className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-md hover:bg-amber-400"
                      >
                        Save Credentials
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Buttons */}
              <div className="mt-4 flex items-center space-x-2">
                <button
                  onClick={() => handleToggleConnect(acc)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                    acc.isConnected
                      ? 'bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 border border-slate-700'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  }`}
                >
                  {acc.isConnected ? 'Disconnect' : 'Connect Channel'}
                </button>

                <button
                  onClick={() => {
                    setEditingPlatform(acc.platform);
                    setApiKeyInput(acc.apiKey || '');
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
                  title="Configure API Tokens"
                >
                  <Key className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
