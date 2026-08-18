import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Video, 
  History, 
  LogOut, 
  LayoutDashboard,
  Sparkles,
  Calendar,
  Settings,
  Share2
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { Project, GeneratedPost, SocialAccountConfig, AutomationRule, GenerationOptions } from '../types';
import ClipGenerator from './ClipGenerator';
import ProjectModal from './ProjectModal';
import { SparkGenerator } from './SparkGenerator';
import { PostPreviewEditor } from './PostPreviewEditor';
import { PostQueueAndHistory } from './PostQueueAndHistory';
import { SocialAccountsPanel } from './SocialAccountsPanel';
import { AutomationSettings } from './AutomationSettings';
import { GoogleDocPickerModal } from './GoogleDocPickerModal';
import { Toast, ToastMessage } from './Toast';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'clips' | 'create_clip' | 'spark' | 'queue' | 'accounts' | 'automation'>('clips');
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Social / Spark State
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [accounts, setAccounts] = useState<SocialAccountConfig[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<{ id: string; title: string; text: string } | null>(null);
  const [isDocPickerOpen, setIsDocPickerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'projects'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(projs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const newToast: ToastMessage = {
      id: 'toast_' + Date.now(),
      type,
      title,
      description
    };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 4000);
  };

  const handleGeneratePosts = async (options: GenerationOptions) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      const data = await res.json();
      if (data.posts && data.posts.length > 0) {
        setPosts(prev => [...data.posts, ...prev]);
        addToast('success', 'Gemini Spark Generated!', `Created ${data.posts.length} posts.`);
      }
    } catch (err: any) {
      addToast('error', 'Generation Error', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefinePost = async (post: GeneratedPost, instruction: string) => {
    setIsRefining(true);
    try {
      const res = await fetch('/api/gemini/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentContent: post.content, platform: post.platform, instruction })
      });
      const data = await res.json();
      if (data.refinedContent) {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, content: data.refinedContent, charCount: data.refinedContent.length } : p));
        addToast('success', 'Post Refined with Gemini', 'Updated copy applied.');
      }
    } catch {
      addToast('error', 'Refine Failed', 'Could not refine post.');
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur-md p-6 hidden lg:flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">InstaGenius Studio</span>
        </div>

        <nav className="space-y-1.5 flex-grow">
          <button 
            onClick={() => setActiveTab('clips')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'clips' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Clips Library
          </button>
          <button 
            onClick={() => setActiveTab('create_clip')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'create_clip' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Plus className="w-4 h-4" /> AI Clip Generator
          </button>
          <button 
            onClick={() => setActiveTab('spark')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'spark' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Sparkles className="w-4 h-4" /> Caption Studio
          </button>
          <button 
            onClick={() => setActiveTab('queue')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'queue' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Calendar className="w-4 h-4" /> Queue & Schedule
          </button>
          <button 
            onClick={() => setActiveTab('accounts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'accounts' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Share2 className="w-4 h-4" /> Social Channels
          </button>
          <button 
            onClick={() => setActiveTab('automation')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'automation' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Settings className="w-4 h-4" /> Growth Automation
          </button>
        </nav>

        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Quota</span>
              <span className="text-[10px] font-bold text-indigo-400">Unlimited Plan</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-full" />
            </div>
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 overflow-y-auto max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white">
              {activeTab === 'clips' && 'Video Clip Projects'}
              {activeTab === 'create_clip' && 'AI Viral Clip Generator'}
              {activeTab === 'spark' && 'AI Caption & Post Studio'}
              {activeTab === 'queue' && 'Publishing Queue & History'}
              {activeTab === 'accounts' && 'Social Channels'}
              {activeTab === 'automation' && 'Growth Automation Rules'}
            </h1>
            <p className="text-sm text-slate-400">Unified Instagram Creator & AI Growth Suite</p>
          </div>
          {activeTab === 'clips' && (
            <button 
              onClick={() => setActiveTab('create_clip')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-5 h-5" /> Generate Clips
            </button>
          )}
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'clips' && (
            <motion.div key="clips" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
                  <Video className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white">No clip projects yet</h3>
                  <p className="text-slate-400 mb-6">Upload a long-form video or enter transcript to generate viral clips.</p>
                  <button onClick={() => setActiveTab('create_clip')} className="text-indigo-400 font-bold hover:underline">
                    Create Clip Project →
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {projects.map((proj) => (
                    <div 
                      key={proj.id} 
                      onClick={() => setSelectedProject(proj)}
                      className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm hover:border-indigo-500/50 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-800 p-3 rounded-xl text-indigo-400">
                          <Video className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-white">{proj.title}</h3>
                          <p className="text-sm text-slate-400">{proj.clips?.length || 0} Clips extracted</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'create_clip' && (
            <motion.div key="create_clip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ClipGenerator onComplete={() => setActiveTab('clips')} />
            </motion.div>
          )}

          {activeTab === 'spark' && (
            <motion.div key="spark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
              <SparkGenerator 
                onGenerate={handleGeneratePosts}
                isGenerating={isGenerating}
                selectedDoc={selectedDoc}
                onOpenDocPicker={() => setIsDocPickerOpen(true)}
                onClearDoc={() => setSelectedDoc(null)}
              />
              <PostPreviewEditor 
                posts={posts}
                accounts={accounts}
                onPublishPost={(post) => addToast('info', 'Publishing...', `Publishing to ${post.platform}`)}
                onSchedulePost={(post, time) => addToast('success', 'Scheduled', `Scheduled for ${time}`)}
                onDeletePost={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                onUpdatePostContent={(id, content) => setPosts(prev => prev.map(p => p.id === id ? { ...p, content } : p))}
                onRefinePost={handleRefinePost}
                isRefining={isRefining}
              />
            </motion.div>
          )}

          {activeTab === 'queue' && (
            <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PostQueueAndHistory 
                posts={posts}
                onPublishPost={(post) => addToast('info', 'Publishing...', `Publishing to ${post.platform}`)}
                onDeletePost={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
              />
            </motion.div>
          )}

          {activeTab === 'accounts' && (
            <motion.div key="accounts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SocialAccountsPanel 
                accounts={accounts}
                onUpdateAccount={(acc) => {
                  setAccounts(prev => prev.map(a => a.platform === acc.platform ? acc : a));
                  addToast('success', `${acc.name} Saved`);
                }}
              />
            </motion.div>
          )}

          {activeTab === 'automation' && (
            <motion.div key="automation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AutomationSettings 
                rules={rules}
                onSaveRules={(r) => {
                  setRules(r);
                  addToast('success', 'Automation Rules Saved');
                }}
                onOpenDocPicker={() => setIsDocPickerOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {selectedProject && (
          <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
        )}

        <GoogleDocPickerModal 
          isOpen={isDocPickerOpen}
          onClose={() => setIsDocPickerOpen(false)}
          onSelectDoc={(doc) => {
            setSelectedDoc(doc);
            addToast('success', 'Google Doc Loaded', doc.title);
          }}
        />

        <Toast toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      </main>
    </div>
  );
}
