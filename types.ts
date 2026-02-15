
export interface ViralAnalysis {
  viralScore: number;
  hookScore: number;
  emotion: string;
  strengths: string[];
  weakness: string;
  improvement: string;
}

export interface FBPost {
  id: string;
  content: string;
  author: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  imageUrl?: string;
  url: string;
  analysis?: ViralAnalysis; // Trường lưu kết quả phân tích
}

export interface LibraryItem extends FBPost {
  savedAt: string;
  tags: string[];
}

export type ViewType = 'dashboard' | 'scanner' | 'spy' | 'library' | 'ai-writer' | 'idea-bank';

export interface ScanResult {
  posts: FBPost[];
  profileName: string;
  totalEngagement: number;
  averageEngagement: number;
}
