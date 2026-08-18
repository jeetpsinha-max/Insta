import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, 
  Sparkles, 
  Zap, 
  Scissors, 
  Share2, 
  CheckCircle2, 
  Loader2,
  FileText,
  ChevronLeft,
  Upload
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Clip } from '../types';
import VideoUpload from './VideoUpload';

interface Props {
  onComplete: () => void;
}

export default function ClipGenerator({ onComplete }: Props) {
  const [step, setStep] = useState<'upload' | 'platform' | 'analyze' | 'batch-queued'>('upload');
  const [transcript, setTranscript] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadedVideos, setUploadedVideos] = useState<{ url: string; fileName: string }[]>([]);
  const [platform, setPlatform] = useState<'tiktok' | 'reels' | 'shorts'>('tiktok');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clips, setClips] = useState<Clip[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = async (uploads: { url: string; fileName: string }[]) => {
    setUploadedVideos(uploads);
    if (uploads.length === 1) {
      setVideoUrl(uploads[0].url);
      setVideoTitle(uploads[0].fileName);
      setStep('platform');
    } else {
      // Create a batch in Firestore
      const batchId = Math.random().toString(36).substr(2, 9);
      const promises = uploads.map(upload => 
        addDoc(collection(db, 'projects'), {
          userId: auth.currentUser?.uid,
          videoTitle: upload.fileName,
          videoUrl: upload.url,
          platform,
          clips: [],
          transcript: '',
          createdAt: serverTimestamp(),
          status: 'queued',
          batchId
        })
      );
      await Promise.all(promises);
      setStep('batch-queued');
    }
  };

  const handleAnalyze = async () => {
    if (!transcript || !auth.currentUser) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript, 
          videoTitle: videoTitle || 'Untitled Video',
          platform 
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setClips(data.clips);

      // Save to Firebase
      await addDoc(collection(db, 'projects'), {
        userId: auth.currentUser.uid,
        videoTitle: videoTitle || 'Untitled Video',
        transcript,
        videoUrl,
        platform,
        clips: data.clips,
        createdAt: serverTimestamp(),
        status: 'completed'
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={onComplete}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Library
      </button>

      <AnimatePresence mode="wait">
        {step === 'upload' && !clips.length ? (
          <motion.div
            key="upload-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Step 1: Upload Your Content</h2>
              <p className="text-slate-500 mb-10 text-sm max-w-md mx-auto">Our AI works best when it has the original high-quality video source to analyze visual cues.</p>
              <VideoUpload onUploadComplete={handleUploadComplete} />
              
              <div className="relative flex items-center py-10">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4 text-slate-300 text-[10px] font-bold uppercase tracking-widest">Or manual entry</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <button 
                onClick={() => setStep('analyze')}
                className="text-indigo-600 text-sm font-bold hover:underline transition-all"
              >
                Skip to Transcript Analysis →
              </button>
            </div>
          </motion.div>
        ) : step === 'batch-queued' ? (
          <motion.div
            key="batch-queued-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] p-12 border border-slate-100 shadow-xl shadow-slate-200/40 text-center space-y-8"
          >
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[24px] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-3">Batch Queue Started</h2>
              <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                We've added {uploadedVideos.length} videos to your processing queue. 
                Our AI agents are analyzing them in the background.
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 max-w-sm mx-auto">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                <span>Queue Status</span>
                <span className="text-indigo-600">Active</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-indigo-500"
                  initial={{ width: 0 }}
                  animate={{ width: '40%' }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                />
              </div>
            </div>
            <button 
              onClick={onComplete}
              className="w-full max-w-xs bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 mx-auto"
            >
              View Queue in Library
            </button>
          </motion.div>
        ) : step === 'platform' && !clips.length ? (
          <motion.div
            key="platform-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Step 2: Choose Your Target</h2>
            <p className="text-slate-500 mb-8 text-sm">We'll optimize the hooks and captions for your specific platform.</p>
            
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { id: 'tiktok', name: 'TikTok', icon: '📱' },
                { id: 'reels', name: 'Instagram Reels', icon: '📸' },
                { id: 'shorts', name: 'YouTube Shorts', icon: '🎬' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id as any)}
                  className={`p-6 rounded-2xl border-2 transition-all text-center space-y-3 ${platform === p.id ? 'border-indigo-600 bg-indigo-50/50 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="text-3xl">{p.icon}</div>
                  <div className={`font-bold text-sm ${platform === p.id ? 'text-indigo-700' : 'text-slate-600'}`}>{p.name}</div>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setStep('analyze')}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
            >
              Next: Transcription
            </button>
          </motion.div>
        ) : step === 'analyze' && !clips.length ? (
          <motion.div
            key="analyze-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <section className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 mb-12">
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-900">Step 3: Analyze Context</h2>
                  <div className="flex gap-2">
                    {videoUrl && (
                      <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Video Linked
                      </div>
                    )}
                    <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {platform} Optimized
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Video className="w-4 h-4" /> Video Title
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. My Podcast Episode #42"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Paste Video Transcript
                  </label>
                  <textarea 
                    rows={8}
                    placeholder="Paste your YouTube transcript here..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                  />
                </div>

                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !transcript}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-indigo-200"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing for Viral Potential...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Find Viral Clips
                    </>
                  )}
                </button>
                {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
              </div>
            </section>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {clips.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-600" /> Viral Moments Identified
              </h2>
            </div>

            <div className="grid gap-8 pb-32">
              {clips.map((clip, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
                >
                  <div className="flex flex-col lg:flex-row">
                    {/* Visual Preview Placeholder */}
                    <div className="lg:w-72 h-48 lg:h-auto bg-slate-900 relative flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent"></div>
                      <Video className="w-12 h-12 text-white/20" />
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        {clip.startTime} - {clip.endTime}
                      </div>
                    </div>

                    <div className="flex-1 p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-2">{clip.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-widest border border-indigo-100">
                              Viral Potential: High
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-indigo-600">
                            <Share2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strategic Insight</span>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {clip.justification}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Optimized Caption</span>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm text-slate-800 font-mono">
                              {clip.caption}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-8 border-t border-slate-50 flex flex-wrap gap-3">
                        <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95">
                          <Scissors className="w-4 h-4" /> Export Clip
                        </button>
                        <button className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">
                          Preview Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
