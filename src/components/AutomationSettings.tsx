import React, { useState } from 'react';
import { Settings, RefreshCw, Zap, Copy, Check, Shield, FileText, ToggleLeft, ToggleRight, Sparkles, Plus, Trash2 } from 'lucide-react';
import { AutomationRule, SocialPlatform } from '../types';

interface AutomationSettingsProps {
  rules: AutomationRule[];
  onSaveRules: (rules: AutomationRule[]) => void;
  onOpenDocPicker: () => void;
}

export const AutomationSettings: React.FC<AutomationSettingsProps> = ({
  rules,
  onSaveRules,
  onOpenDocPicker
}) => {
  const [webhookCopied, setWebhookCopied] = useState<boolean>(false);
  const [testWebhookStatus, setTestWebhookStatus] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<boolean>(false);

  const webhookUrl = `${window.location.origin}/api/webhook/trigger`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setWebhookCopied(true);
    setTimeout(() => setWebhookCopied(false), 2000);
  };

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    setTestWebhookStatus(null);
    try {
      const res = await fetch('/api/webhook/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretKey: 'spark_sec_demo_123',
          docId: 'doc_spark_launch',
          event: 'doc_updated'
        })
      });
      const data = await res.json();
      setTestWebhookStatus(data.message || 'Webhook successfully executed!');
    } catch (err) {
      setTestWebhookStatus('Webhook test failed.');
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleToggleRule = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    onSaveRules(updated);
  };

  const handleDeleteRule = (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    onSaveRules(updated);
  };

  return (
    <div id="automation-settings-panel" className="max-w-5xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Google Docs Auto-Sync & Webhooks</h2>
            <p className="text-xs text-slate-400">Configure automated post creation whenever your Google Docs are updated.</p>
          </div>
        </div>
      </div>

      {/* Auto-Sync Rules */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>ACTIVE AUTO-SYNC RULES</span>
          </h3>
          <button
            onClick={onOpenDocPicker}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Auto-Sync Rule</span>
          </button>
        </div>

        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <h4 className="font-bold text-xs text-white">{rule.name}</h4>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    Doc: {rule.docTitle}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center space-x-3">
                  <span>Trigger: {rule.triggerEvent}</span>
                  <span>Platforms: {rule.targetPlatforms.join(', ')}</span>
                  <span>Auto-Publish: {rule.autoPublish ? 'Yes' : 'Queue Draft'}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleToggleRule(rule.id)}
                  className="flex items-center space-x-1.5 text-xs font-semibold"
                >
                  {rule.enabled ? (
                    <ToggleRight className="w-6 h-6 text-amber-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-600" />
                  )}
                  <span className={rule.enabled ? 'text-amber-300' : 'text-slate-500'}>
                    {rule.enabled ? 'Rule Active' : 'Paused'}
                  </span>
                </button>

                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg bg-slate-900 border border-slate-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Webhook Endpoint Integration */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>INBOUND WEBHOOK TRIGGER (ZAPIER / MAKE / GITHUB)</span>
        </h3>
        <p className="text-xs text-slate-400">
          Trigger automated social post generation remotely by sending an HTTP POST payload to your custom Webhook URL.
        </p>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono select-all focus:outline-none"
          />
          <button
            onClick={handleCopyWebhook}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center space-x-1.5"
          >
            {webhookCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{webhookCopied ? 'Copied' : 'Copy Endpoint'}</span>
          </button>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <button
            onClick={handleTestWebhook}
            disabled={testingWebhook}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center space-x-2"
          >
            {testingWebhook ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Zap className="w-4 h-4 text-amber-400" />}
            <span>Send Test Webhook Trigger</span>
          </button>

          {testWebhookStatus && (
            <span className="text-xs text-emerald-400 font-semibold">
              {testWebhookStatus}
            </span>
          )}
        </div>
      </div>

    </div>
  );
};
