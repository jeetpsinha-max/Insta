import React, { useState } from 'react';
import { GeneratedPost, SocialPlatform, SocialAccountConfig } from '../types';
import { Send, Clock, Sparkles, RefreshCw, Layers, Edit3, Check, Trash2, ExternalLink, Hash, Copy, MessageSquare, Heart, Share, BarChart2 } from 'lucide-react';

interface PostPreviewEditorProps {
  posts: GeneratedPost[];
  accounts: SocialAccountConfig[];
  onPublishPost: (post: GeneratedPost) => void;
  onSchedulePost: (post: GeneratedPost, scheduledTime: string) => void;
  onDeletePost: (postId: string) => void;
  onUpdatePostContent: (postId: string, newContent: string) => void;
  onRefinePost: (post: GeneratedPost, instruction: string) => void;
  isRefining: boolean;
}

const PLATFORM_STYLES: Record<SocialPlatform, { name: string; bg: string; border: string; badge: string; iconColor: string }> = {
  twitter: { name: 'Twitter / X', bg: 'bg-slate-900', border: 'border-sky-500/30', badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20', iconColor: 'text-sky-400' },
  linkedin: { name: 'LinkedIn', bg: 'bg-slate-900', border: 'border-blue-500/30', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', iconColor: 'text-blue-500' },
  threads: { name: 'Threads', bg: 'bg-slate-900', border: 'border-pink-500/30', badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20', iconColor: 'text-pink-400' },
  instagram: { name: 'Instagram', bg: 'bg-slate-900', border: 'border-fuchsia-500/30', badge: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20', iconColor: 'text-fuchsia-400' },
  facebook: { name: 'Facebook', bg: 'bg-slate-900', border: 'border-indigo-500/30', badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', iconColor: 'text-indigo-400' },
};

export const PostPreviewEditor: React.FC<PostPreviewEditorProps> = ({
  posts,
  accounts,
  onPublishPost,
  onSchedulePost,
  onDeletePost,
  onUpdatePostContent,
  onRefinePost,
  isRefining
}) => {
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [refineInstruction, setRefineInstruction] = useState<string>('');
  const [refiningPostId, setRefiningPostId] = useState<string | null>(null);
  const [scheduleTime, setScheduleTime] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTriggerRefine = (post: GeneratedPost) => {
    if (!refineInstruction.trim()) return;
    onRefinePost(post, refineInstruction);
    setRefineInstruction('');
    setRefiningPostId(null);
  };

  if (posts.length === 0) return null;

  return (
    <div id="post-preview-editor-section" className="max-w-6xl mx-auto space-y-6">
      
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Generated Social Post Studio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Review, edit, AI-refine, and publish or schedule across your social media accounts.
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold rounded-xl">
          {posts.length} Posts Prepared
        </span>
      </div>

      {/* Grid of Post Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {posts.map((post) => {
          const style = PLATFORM_STYLES[post.platform];
          const account = accounts.find(a => a.platform === post.platform);
          const isOverLimit = post.platform === 'twitter' && post.charCount > 280 && !post.threadItems;
          const isEditing = editingPostId === post.id;
          const isRefiningThis = refiningPostId === post.id;

          return (
            <div
              key={post.id}
              className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all ${style.border}`}
            >
              <div>
                {/* Header: Platform & Account Info */}
                <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={account?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                      alt={account?.name || 'User'}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-800"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">{account?.name || 'Social Account'}</span>
                        <span className="text-xs text-slate-400">{account?.handle}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {post.docTitle ? `Doc: ${post.docTitle}` : 'Custom Spark'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${style.badge}`}>
                      {style.name}
                    </span>
                    <button
                      onClick={() => onDeletePost(post.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Body Content Editor / Render */}
                {isEditing ? (
                  <div className="space-y-2 mb-4">
                    <textarea
                      rows={6}
                      value={post.content}
                      onChange={(e) => onUpdatePostContent(post.id, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => setEditingPostId(null)}
                        className="px-3 py-1 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-400"
                      >
                        Done Editing
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 space-y-3">
                    {/* Twitter Thread items if present */}
                    {post.platform === 'twitter' && post.threadItems && post.threadItems.length > 1 ? (
                      <div className="space-y-2 pl-3 border-l-2 border-sky-500/40">
                        <div className="flex items-center text-[11px] font-bold text-sky-400 mb-1">
                          <Layers className="w-3.5 h-3.5 mr-1" /> Twitter Thread ({post.threadItems.length} tweets)
                        </div>
                        {post.threadItems.map((tweet, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-200">
                            {tweet}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                        {post.content}
                      </div>
                    )}

                    {/* Hashtag tags */}
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.hashtags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 text-[11px] bg-slate-800 text-amber-300 rounded-md font-medium">
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Character Count & Refine Trigger */}
                <div className="flex items-center justify-between text-xs py-2 border-t border-slate-800/60 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={isOverLimit ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                      {post.charCount} / {post.maxCharCount} chars
                    </span>
                    {isOverLimit && (
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold">
                        Exceeds Twitter Limit
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopyText(post.id, post.content)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[11px] flex items-center space-x-1"
                    >
                      {copiedId === post.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === post.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => setEditingPostId(isEditing ? null : post.id)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[11px] flex items-center space-x-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setRefiningPostId(isRefiningThis ? null : post.id)}
                      className="px-2.5 py-1 text-amber-300 hover:text-white rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-[11px] font-bold flex items-center space-x-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Refine AI</span>
                    </button>
                  </div>
                </div>

                {/* Gemini Refine Modal input */}
                {isRefiningThis && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/40 space-y-2 mb-4 animate-fade-in text-xs">
                    <div className="font-bold text-amber-400 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Gemini Refinement Request</span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. 'Make it 20% shorter', 'Add a strong CTA', 'Make tone punchier'..."
                      value={refineInstruction}
                      onChange={(e) => setRefineInstruction(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setRefiningPostId(null)}
                        className="px-2.5 py-1 text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleTriggerRefine(post)}
                        disabled={isRefining || !refineInstruction.trim()}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 rounded-lg flex items-center space-x-1"
                      >
                        {isRefining ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        <span>Apply Refinement</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions: Publish Now or Schedule */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="datetime-local"
                    value={scheduleTime[post.id] || ''}
                    onChange={(e) => setScheduleTime({ ...scheduleTime, [post.id]: e.target.value })}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => {
                      if (scheduleTime[post.id]) {
                        onSchedulePost(post, scheduleTime[post.id]);
                      }
                    }}
                    disabled={!scheduleTime[post.id]}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 border border-slate-700"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Schedule</span>
                  </button>
                </div>

                <button
                  onClick={() => onPublishPost(post)}
                  disabled={post.status === 'published'}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer ${
                    post.status === 'published'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-orange-500/20'
                  }`}
                >
                  {post.status === 'published' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Published to Channel</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Post Directly to {style.name} Now</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
