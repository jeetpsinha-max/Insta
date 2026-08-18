import { motion, AnimatePresence } from 'motion/react';
import { X, Video, Scissors, Share2, Sparkles, Clock, Globe } from 'lucide-react';
import { Project } from '../types';

interface Props {
  project: Project | null;
  onClose: () => void;
}

export default function ProjectModal({ project, onClose }: Props) {
  if (!project) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-5xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-2 rounded-xl">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{project.videoTitle}</h2>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Created on {new Date(project.createdAt?.seconds * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column: Video & Transcript */}
              <div className="space-y-8">
                {project.videoUrl ? (
                  <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg">
                    <video 
                      src={project.videoUrl} 
                      controls 
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
                    <Video className="w-12 h-12 mb-2" />
                    <p className="text-sm font-medium">No video source provided</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" /> AI Insights
                    </h3>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">
                        {project.platform || 'General'} Optimized
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed max-h-48 overflow-y-auto">
                      {project.transcript}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Generated Clips */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Generated Clips</h3>
                  <span className="text-xs font-bold text-indigo-600 px-2 py-1 bg-indigo-50 rounded-full">
                    {project.clips.length} Moments
                  </span>
                </div>

                <div className="space-y-4">
                  {project.status === 'queued' || project.status === 'processing' ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <Sparkles className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">AI Agents are Working</h4>
                        <p className="text-xs text-slate-500 max-w-[200px] mx-auto mt-1">
                          Analyzing video hooks and generating optimized captions for {project.platform}.
                        </p>
                      </div>
                    </div>
                  ) : project.clips.map((clip, idx) => (
                    <div key={idx} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {clip.title}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
                          {clip.startTime} - {clip.endTime}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-4 leading-relaxed line-clamp-2">
                        {clip.justification}
                      </p>
                      <div className="flex gap-2 mt-4">
                        <button className="flex-grow bg-slate-900 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                          <Scissors className="w-3.5 h-3.5" /> Export
                        </button>
                        <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-all">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-white transition-all">
              Download Report
            </button>
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
              Share All Clips
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
