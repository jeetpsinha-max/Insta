import React, { useState } from 'react';
import { Sparkles, FileText, Check, Plus, RefreshCw, Layers, Wand2, Hash, Smile, Link, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { GenerationOptions, PostTone, SocialPlatform } from '../types';

interface SparkGeneratorProps {
  onGenerate: (options: GenerationOptions) => void;
  isGenerating: boolean;
  selectedDoc: { id: string; title: string; text: string; webViewLink?: string } | null;
  onOpenDocPicker: () => void;
  onClearDoc: () => void;
}

const TONE_OPTIONS: { id: PostTone; label: string; desc: string }[] = [
  { id: 'professional', label: 'Professional', desc: 'Clear, authoritative, and structured' },
  { id: 'conversational', label: 'Conversational', desc: 'Friendly, relatable, and engaging' },
  { id: 'punchy', label: 'Punchy', desc: 'High energy, short sentences, direct' },
  { id: 'storyteller', label: 'Storyteller', desc: 'Narrative hook, anecdotal, emotional' },
  { id: 'thought_leadership', label: 'Thought Leader', desc: 'Bold assertions, industry foresight' },
  { id: 'viral', label: 'Viral Hook', desc: 'Curiosity gaps, scroll-stopping format' },
];

const PLATFORMS: { id: SocialPlatform; label: string; color: string }[] = [
  { id: 'twitter', label: 'Twitter / X', color: 'bg-sky-500' },
  { id: 'linkedin', label: 'LinkedIn', color: 'bg-blue-600' },
  { id: 'threads', label: 'Threads', color: 'bg-pink-500' },
  { id: 'instagram', label: 'Instagram', color: 'bg-fuchsia-600' },
  { id: 'facebook', label: 'Facebook', color: 'bg-indigo-600' },
];

export const SparkGenerator: React.FC<SparkGeneratorProps> = ({
  onGenerate,
  isGenerating,
  selectedDoc,
  onOpenDocPicker,
  onClearDoc
}) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['twitter', 'linkedin', 'threads']);
  const [tone, setTone] = useState<PostTone>('professional');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [includeHashtags, setIncludeHashtags] = useState<boolean>(true);
  const [includeEmojis, setIncludeEmojis] = useState<boolean>(true);
  const [customCTA, setCustomCTA] = useState<string>('');
  const [splitTwitterThreads, setSplitTwitterThreads] = useState<boolean>(true);

  const togglePlatform = (p: SocialPlatform) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter(item => item !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleSparkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      docId: selectedDoc?.id,
      docTitle: selectedDoc?.title,
      docText: selectedDoc?.text,
      customPrompt,
      platforms: selectedPlatforms,
      tone,
      includeHashtags,
      includeEmojis,
      customCTA,
      splitTwitterThreads
    });
  };

  return (
    <div id="spark-generator-container" className="max-w-5xl mx-auto space-y-6">
      
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>POWERED BY GEMINI 2.5 FLASH</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Gemini Spark Studio
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Connect a Google Doc or enter bullet ideas. Gemini turns your content into multi-channel social media updates ready to post.
            </p>
          </div>

          {/* Quick Stats or CTA */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 rounded-2xl flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl text-white">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Selected Channels</div>
              <div className="text-sm font-bold text-white">{selectedPlatforms.length} Active Platforms</div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSparkSubmit} className="space-y-6">
        
        {/* Section 1: Source Material (Google Doc or Custom Spark) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>1. SOURCE MATERIAL & SPARK INPUT</span>
            </label>
            <button
              type="button"
              onClick={onOpenDocPicker}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{selectedDoc ? 'Change Google Doc' : 'Select Google Doc'}</span>
            </button>
          </div>

          {/* Selected Doc Card */}
          {selectedDoc ? (
            <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-4 flex items-start justify-between shadow-inner">
              <div className="space-y-1 pr-4">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    GOOGLE DOC CONNECTED
                  </span>
                  <h4 className="font-bold text-sm text-white">{selectedDoc.title}</h4>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {selectedDoc.text}
                </p>
              </div>
              <button
                type="button"
                onClick={onClearDoc}
                className="text-xs text-slate-500 hover:text-rose-400 px-2 py-1 bg-slate-900 rounded-lg border border-slate-800"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <textarea
                rows={4}
                placeholder="Or paste your rough thoughts, podcast script, meeting notes, or article draft here..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 leading-relaxed transition-all"
              />
            </div>
          )}
        </div>

        {/* Section 2: Choose Target Channels */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <label className="text-sm font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>2. TARGET SOCIAL MEDIA PLATFORMS</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {PLATFORMS.map((p) => {
              const isSelected = selectedPlatforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all text-xs font-bold ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${p.color}`} />
                  <span>{p.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Select Tone & Voice */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <label className="text-sm font-bold text-white flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span>3. TONE & BRAND VOICE</span>
          </label>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TONE_OPTIONS.map((t) => {
              const isSelected = tone === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/60 text-white shadow-md'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">{t.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400">{t.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Content Adjustments */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <label className="text-sm font-bold text-white flex items-center space-x-2">
            <Wand2 className="w-4 h-4 text-purple-400" />
            <span>4. ENHANCEMENT OPTIONS</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Hashtag toggle */}
            <div
              onClick={() => setIncludeHashtags(!includeHashtags)}
              className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between ${
                includeHashtags ? 'bg-slate-800 border-amber-500/40 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Hash className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">Auto-Generate Hashtags</span>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${includeHashtags ? 'bg-amber-500 border-amber-500' : 'border-slate-700'}`}>
                {includeHashtags && <Check className="w-3 h-3 text-slate-950 font-bold" />}
              </div>
            </div>

            {/* Emoji toggle */}
            <div
              onClick={() => setIncludeEmojis(!includeEmojis)}
              className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between ${
                includeEmojis ? 'bg-slate-800 border-amber-500/40 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Smile className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">Optimized Emojis</span>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${includeEmojis ? 'bg-amber-500 border-amber-500' : 'border-slate-700'}`}>
                {includeEmojis && <Check className="w-3 h-3 text-slate-950 font-bold" />}
              </div>
            </div>

            {/* Twitter Thread toggle */}
            <div
              onClick={() => setSplitTwitterThreads(!splitTwitterThreads)}
              className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between ${
                splitTwitterThreads ? 'bg-slate-800 border-amber-500/40 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">Split Twitter Threads</span>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${splitTwitterThreads ? 'bg-amber-500 border-amber-500' : 'border-slate-700'}`}>
                {splitTwitterThreads && <Check className="w-3 h-3 text-slate-950 font-bold" />}
              </div>
            </div>
          </div>

          {/* Call to Action input */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Custom Call-To-Action (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 'Read full Google Doc here: https://...' or 'Drop your feedback below 👇'"
              value={customCTA}
              onChange={(e) => setCustomCTA(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isGenerating || (!selectedDoc && !customPrompt.trim())}
            className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 disabled:opacity-50 text-white rounded-2xl text-base font-extrabold transition-all shadow-xl shadow-orange-500/25 flex items-center justify-center space-x-3 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Gemini is Crafting Your Posts...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Spark Social Posts with Gemini AI</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};
