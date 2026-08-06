import React, { useState } from 'react';
import { GeneratedPost, SocialPlatform } from '../types';
import { Clock, CheckCircle2, AlertCircle, Eye, ThumbsUp, Share2, MessageCircle, Send, Trash2, ExternalLink, Filter, Calendar } from 'lucide-react';

interface PostQueueAndHistoryProps {
  posts: GeneratedPost[];
  onPublishPost: (post: GeneratedPost) => void;
  onDeletePost: (postId: string) => void;
}

const PLATFORM_BADGES: Record<SocialPlatform, { label: string; bg: string }> = {
  twitter: { label: 'Twitter / X', bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  linkedin: { label: 'LinkedIn', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  threads: { label: 'Threads', bg: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  instagram: { label: 'Instagram', bg: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' },
  facebook: { label: 'Facebook', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
};

export const PostQueueAndHistory: React.FC<PostQueueAndHistoryProps> = ({
  posts,
  onPublishPost,
  onDeletePost
}) => {
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'published' | 'draft'>('all');

  const filteredPosts = posts.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;

  return (
    <div id="post-queue-history-panel" className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-sm text-white">Filter Posts:</span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              filter === 'all'
                ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            All Posts ({posts.length})
          </button>

          <button
            onClick={() => setFilter('scheduled')}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              filter === 'scheduled'
                ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            Scheduled Queue ({scheduledCount})
          </button>

          <button
            onClick={() => setFilter('published')}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              filter === 'published'
                ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            Published ({publishedCount})
          </button>

          <button
            onClick={() => setFilter('draft')}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              filter === 'draft'
                ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            Drafts ({draftCount})
          </button>
        </div>
      </div>

      {/* List / Grid of Posts */}
      {filteredPosts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <Clock className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white">No Posts Found</h3>
          <p className="text-xs max-w-sm mx-auto">
            You don't have any posts matching this filter. Head over to Spark Studio to create new updates from Google Docs.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const badge = PLATFORM_BADGES[post.platform];

            return (
              <div
                key={post.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                
                {/* Main Content Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className={`px-2.5 py-0.5 font-bold rounded-lg border ${badge.bg}`}>
                      {badge.label}
                    </span>

                    {/* Status Badge */}
                    {post.status === 'published' && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Published
                      </span>
                    )}

                    {post.status === 'scheduled' && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold flex items-center">
                        <Clock className="w-3 h-3 mr-1" /> Scheduled: {post.scheduledTime ? new Date(post.scheduledTime).toLocaleString() : 'Soon'}
                      </span>
                    )}

                    {post.status === 'draft' && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 font-bold">
                        Draft
                      </span>
                    )}

                    {post.docTitle && (
                      <span className="text-slate-500 text-[11px] truncate max-w-[200px]">
                        Doc: {post.docTitle}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-200 line-clamp-2 font-sans leading-relaxed">
                    {post.content}
                  </p>

                  {/* Analytics metrics if published */}
                  {post.status === 'published' && post.engagementStats && (
                    <div className="flex items-center space-x-4 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center space-x-1 text-slate-300">
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>{post.engagementStats.views} Views</span>
                      </span>
                      <span className="flex items-center space-x-1 text-slate-300">
                        <ThumbsUp className="w-3.5 h-3.5 text-amber-400" />
                        <span>{post.engagementStats.likes} Likes</span>
                      </span>
                      <span className="flex items-center space-x-1 text-slate-300">
                        <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{post.engagementStats.shares} Shares</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                  {post.status !== 'published' && (
                    <button
                      onClick={() => onPublishPost(post)}
                      className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-md shadow-orange-500/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Now</span>
                    </button>
                  )}

                  <button
                    onClick={() => onDeletePost(post.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 rounded-xl bg-slate-800 border border-slate-700 transition-colors"
                    title="Delete Post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
