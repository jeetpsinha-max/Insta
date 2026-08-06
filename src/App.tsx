import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SparkGenerator } from './components/SparkGenerator';
import { PostPreviewEditor } from './components/PostPreviewEditor';
import { PostQueueAndHistory } from './components/PostQueueAndHistory';
import { SocialAccountsPanel } from './components/SocialAccountsPanel';
import { AutomationSettings } from './components/AutomationSettings';
import { GoogleDocPickerModal } from './components/GoogleDocPickerModal';
import { Toast, ToastMessage } from './components/Toast';
import { 
  GeneratedPost, 
  SocialAccountConfig, 
  UserAuthStatus, 
  GenerationOptions, 
  AutomationRule 
} from './types';
import { 
  fetchPostsFromDb, 
  savePostToDb, 
  updatePostInDb, 
  deletePostFromDb, 
  getLocalAccounts, 
  saveLocalAccounts, 
  getLocalRules, 
  saveLocalRules 
} from './lib/firebase';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'spark' | 'queue' | 'accounts' | 'automation'>('spark');
  const [userAuth, setUserAuth] = useState<UserAuthStatus>({
    authenticated: false,
    hasDocsPermission: true
  });
  const [accounts, setAccounts] = useState<SocialAccountConfig[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<{ id: string; title: string; text: string; webViewLink?: string } | null>(null);
  
  const [isDocPickerOpen, setIsDocPickerOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load initial state & auth
  useEffect(() => {
    checkUserAuth();
    setAccounts(getLocalAccounts());
    setRules(getLocalRules());
    loadAllPosts();
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

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const checkUserAuth = async () => {
    try {
      const res = await fetch('/api/auth/user');
      const data = await res.json();
      setUserAuth(data);
    } catch (err) {
      console.warn('Auth check error:', err);
    }
  };

  const loadAllPosts = async () => {
    const fetched = await fetchPostsFromDb();
    setPosts(fetched);
  };

  const handleConnectGoogle = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      addToast('error', 'Authentication Failed', 'Unable to initiate Google Workspace OAuth.');
    }
  };

  const handleUpdateAccount = (updated: SocialAccountConfig) => {
    const newAccounts = accounts.map(a => a.platform === updated.platform ? updated : a);
    setAccounts(newAccounts);
    saveLocalAccounts(newAccounts);
    addToast('success', `${updated.name} updated`, `Channel status saved.`);
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
        const createdPosts: GeneratedPost[] = data.posts;
        
        // Save to Firestore / local DB
        for (const post of createdPosts) {
          await savePostToDb(post);
        }

        await loadAllPosts();
        addToast('success', 'Gemini Spark Generated!', `Created ${createdPosts.length} posts tailored for your channels.`);
      } else {
        addToast('error', 'Generation Error', 'Gemini did not return post items.');
      }
    } catch (err: any) {
      addToast('error', 'Generation Exception', err.message || 'Error communicating with Gemini endpoint.');
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
        body: JSON.stringify({
          currentContent: post.content,
          platform: post.platform,
          instruction
        })
      });
      const data = await res.json();

      if (data.refinedContent) {
        const updated = {
          content: data.refinedContent,
          hashtags: data.hashtags || post.hashtags,
          charCount: data.refinedContent.length
        };
        await updatePostInDb(post.id, updated);
        await loadAllPosts();
        addToast('success', 'Post Refined with Gemini', 'Updated copy applied.');
      }
    } catch (err) {
      addToast('error', 'Refining Error', 'Failed to refine post.');
    } finally {
      setIsRefining(false);
    }
  };

  const handlePublishPost = async (post: GeneratedPost) => {
    addToast('info', 'Publishing Post...', `Posting directly to ${post.platform}...`);
    try {
      const res = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          platform: post.platform,
          content: post.content
        })
      });
      const data = await res.json();

      if (data.status === 'published') {
        const updates: Partial<GeneratedPost> = {
          status: 'published',
          publishedAt: data.publishedAt,
          engagementStats: data.engagementStats
        };
        await updatePostInDb(post.id, updates);
        await loadAllPosts();
        addToast('success', 'Successfully Published!', `Live on ${post.platform}.`);
      }
    } catch (err) {
      addToast('error', 'Publish Failed', 'Unable to reach social media API.');
    }
  };

  const handleSchedulePost = async (post: GeneratedPost, scheduledTime: string) => {
    await updatePostInDb(post.id, {
      status: 'scheduled',
      scheduledTime
    });
    await loadAllPosts();
    addToast('success', 'Post Scheduled', `Scheduled for ${new Date(scheduledTime).toLocaleString()}`);
  };

  const handleDeletePost = async (postId: string) => {
    await deletePostFromDb(postId);
    await loadAllPosts();
    addToast('info', 'Post Deleted', 'Item removed from database.');
  };

  const handleUpdatePostContent = async (postId: string, newContent: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: newContent, charCount: newContent.length } : p));
    await updatePostInDb(postId, { content: newContent, charCount: newContent.length });
  };

  const handleSaveRules = (updatedRules: AutomationRule[]) => {
    setRules(updatedRules);
    saveLocalRules(updatedRules);
    addToast('success', 'Automation Rules Saved', 'Google Docs auto-sync setting updated.');
  };

  const activeConnectedAccounts = accounts.filter(a => a.isConnected);

  return (
    <div id="social-spark-app" className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userAuth={userAuth}
        onConnectGoogle={handleConnectGoogle}
        connectedAccountCount={activeConnectedAccounts.length}
      />

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Tab 1: Spark Studio */}
        {activeTab === 'spark' && (
          <div className="space-y-10 animate-fade-in">
            <SparkGenerator
              onGenerate={handleGeneratePosts}
              isGenerating={isGenerating}
              selectedDoc={selectedDoc}
              onOpenDocPicker={() => setIsDocPickerOpen(true)}
              onClearDoc={() => setSelectedDoc(null)}
            />

            {/* Generated Posts Editor Grid */}
            <PostPreviewEditor
              posts={posts.filter(p => p.status === 'draft')}
              accounts={accounts}
              onPublishPost={handlePublishPost}
              onSchedulePost={handleSchedulePost}
              onDeletePost={handleDeletePost}
              onUpdatePostContent={handleUpdatePostContent}
              onRefinePost={handleRefinePost}
              isRefining={isRefining}
            />
          </div>
        )}

        {/* Tab 2: Queue & History */}
        {activeTab === 'queue' && (
          <div className="animate-fade-in">
            <PostQueueAndHistory
              posts={posts}
              onPublishPost={handlePublishPost}
              onDeletePost={handleDeletePost}
            />
          </div>
        )}

        {/* Tab 3: Social Channels */}
        {activeTab === 'accounts' && (
          <div className="animate-fade-in">
            <SocialAccountsPanel
              accounts={accounts}
              onUpdateAccount={handleUpdateAccount}
            />
          </div>
        )}

        {/* Tab 4: Auto-Sync & Webhooks */}
        {activeTab === 'automation' && (
          <div className="animate-fade-in">
            <AutomationSettings
              rules={rules}
              onSaveRules={handleSaveRules}
              onOpenDocPicker={() => setIsDocPickerOpen(true)}
            />
          </div>
        )}

      </main>

      {/* Google Doc Picker Modal */}
      <GoogleDocPickerModal
        isOpen={isDocPickerOpen}
        onClose={() => setIsDocPickerOpen(false)}
        onSelectDoc={(doc) => {
          setSelectedDoc(doc);
          addToast('success', 'Google Doc Connected', `Loaded "${doc.title}" into Spark Studio.`);
        }}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />

    </div>
  );
}
