export type SocialPlatform = 'twitter' | 'linkedin' | 'threads' | 'instagram' | 'facebook';

export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';

export type PostTone = 'professional' | 'conversational' | 'punchy' | 'storyteller' | 'thought_leadership' | 'viral';

export interface GeneratedPost {
  id: string;
  platform: SocialPlatform;
  content: string; // For twitter, might contain '---' for threads
  threadItems?: string[]; // Array of tweets if thread
  hashtags: string[];
  charCount: number;
  maxCharCount: number;
  status: PostStatus;
  scheduledTime?: string;
  publishedAt?: string;
  docId?: string;
  docTitle?: string;
  engagementStats?: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
  errorMessage?: string;
}

export interface GoogleDocItem {
  id: string;
  title: string;
  mimeType: string;
  modifiedTime: string;
  iconLink?: string;
  webViewLink?: string;
  contentSnippet?: string;
}

export interface SocialAccountConfig {
  platform: SocialPlatform;
  name: string;
  handle: string;
  avatarUrl: string;
  isConnected: boolean;
  autoPostEnabled: boolean;
  apiKey?: string;
  lastActive?: string;
}

export interface GenerationOptions {
  docId?: string;
  docTitle?: string;
  docText?: string;
  customPrompt?: string;
  platforms: SocialPlatform[];
  tone: PostTone;
  includeHashtags: boolean;
  includeEmojis: boolean;
  customCTA?: string;
  splitTwitterThreads: boolean;
}

export interface UserAuthStatus {
  authenticated: boolean;
  email?: string;
  name?: string;
  picture?: string;
  hasDocsPermission: boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  docId: string;
  docTitle: string;
  triggerEvent: 'doc_updated' | 'schedule_daily' | 'webhook';
  targetPlatforms: SocialPlatform[];
  autoPublish: boolean;
  enabled: boolean;
  lastRun?: string;
}
