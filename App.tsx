
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Zap, 
  Library, 
  PenTool, 
  Menu, 
  X, 
  Facebook, 
  TrendingUp, 
  MessageCircle, 
  Share2, 
  ThumbsUp, 
  Bookmark, 
  Trash2, 
  Copy, 
  ChevronRight, 
  Loader2, 
  Clock, 
  Search as SearchIcon, 
  Download, 
  Info, 
  Sparkles, 
  Award, 
  AlertCircle, 
  CheckCircle, 
  BookOpen, 
  Calendar,
  MessageSquare,
  UserCheck,
  Plus,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  Maximize2,
  TrendingUp as TrendingIcon,
  Filter,
  Flame,
  Target,
  Lightbulb,
  ShieldCheck,
  ZapIcon,
  Database,
  BarChart3,
  Activity,
  Layers,
  FileText,
  List,
  Wand2,
  BrainCircuit,
  Globe,
  Star,
  SearchCode,
  Headphones,
  Smile,
  Frown,
  Meh,
  Heart,
  ChevronLeft,
  Hash
} from 'lucide-react';
import { FBPost, ViewType, LibraryItem, ScanResult, ViralAnalysis } from './types';
import { rewritePost, analyzeViralFactor, generateViralIdeas } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line } from 'recharts';

// --- Toast Component ---
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[200] ${bgColors[type]} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-bottom-5 fade-in duration-300`}>
      {icons[type]}
      <span className="font-bold">{message}</span>
      <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100"><X size={16} /></button>
    </div>
  );
};

// --- Main App Logic ---

type ScanMode = 'quick' | 'deep';
type SortKey = 'total' | 'likes' | 'comments' | 'shares' | 'newest';
// Expanded writing tones
type WritingTone = 'viral' | 'professional' | 'funny' | 'storytelling' | 'urgent' | 'emotional' | 'controversial';
type InputMode = 'single' | 'bulk';

interface ContentTemplate {
  id: string;
  title: string;
  preview: string;
  content: string;
  category: string;
}

const CONTENT_TEMPLATES: ContentTemplate[] = [
  { id: 'st1', title: 'Hành trình khởi nghiệp từ 50k', category: 'Storytelling', preview: 'Tôi nhớ ngày đầu tiên...', content: 'Tôi nhớ ngày đầu tiên bắt đầu khởi nghiệp, trong túi chỉ còn đúng 50k. [Kể về khó khăn]. 3 năm sau, tôi đã đứng ở vị trí [Thành quả]. Bài học rút ra là: Đừng bao giờ bỏ cuộc khi chưa thử hết sức!' },
  { id: 'st2', title: 'Sai lầm 500 triệu sau 1 đêm', category: 'Storytelling', preview: 'Mất 500 triệu sau 1 đêm...', content: 'Sai lầm lớn nhất đời tôi là [Sai lầm]. Nó khiến tôi mất trắng [Con số]. Nhưng nhờ đó, tôi hiểu rằng [Bài học]. Hy vọng bạn không đi vào vết xe đổ này.' },
  { id: 'ex1', title: 'Dự đoán Marketing 2025', category: 'Expert', preview: 'Thế giới sẽ thay đổi...', content: '3 Xu hướng sẽ thống trị Facebook trong 12 tháng tới: 📈 1. AI Content cá nhân hóa. 2. Short-form video thực tế. 3. Social Commerce. Bạn đã sẵn sàng chưa?' },
  { id: 'ex2', title: 'Tại sao khách hàng nói không?', category: 'Expert', preview: 'Insight khách hàng...', content: 'Đừng tin khi khách hàng bảo "Giá cao quá". Thực chất là họ chưa thấy [Giá trị/Lợi ích]. Đây là cách bẻ lái tâm lý cực hiệu quả...' },
  { id: 'ed1', title: '5 Bước xây kênh 10k Follow', category: 'Educational', preview: 'Lộ trình cho người mới...', content: 'Muốn xây kênh Facebook 10k follow? Làm đúng 5 bước này: ✅ B1: Ngách. ✅ B2: Profile chuẩn. ✅ B3: Content giá trị. ✅ B4: Đăng đều. ✅ B5: Tương tác.' },
  { id: 'vi1', title: 'Mini Game đoán số nhận quà', category: 'Viral', preview: 'Quà tặng 0 đồng...', content: '🎁 QUÀ TẶNG TRỊ GIÁ 500K! Comment 2 số cuối giải đặc biệt XSMB hôm nay. Ai đoán đúng nhanh nhất nhận ngay [Quà]. Tag 2 người bạn để tham gia!' },
  { id: 'vi2', title: 'Tiết kiệm vs Kiếm tiền', category: 'Viral', preview: 'Tranh luận nhẹ nhàng...', content: 'Nên tiết kiệm để giàu hay kiếm thật nhiều để giàu? 💸 Team Tiết Kiệm thả ❤️, Team Kiếm Tiền thả 😮. Cùng thảo luận nhé!' },
  { id: 'tr1', title: 'Feedback khách hàng cũ', category: 'Trust', preview: 'Đọc mà muốn khóc...', content: 'Đọc tin nhắn này của khách mà mình muốn khóc vì hạnh phúc. 😭 [Chụp màn hình feedback]. Cảm ơn bạn đã tin tưởng trao cơ hội cho mình.' },
  { id: 'ed2', title: 'Mẹo Canva cho dân không chuyên', category: 'Educational', preview: 'Thiết kế cực nhàn...', content: 'Không cần biết Photoshop vẫn có ảnh chuyên nghiệp. 🎨 Tip 1: Dùng hệ màu [X]. Tip 2: Font chữ [Y]. Xem hướng dẫn chi tiết tại clip này.' },
  { id: 'ex3', title: 'Bí mật thuật toán FB 2024', category: 'Expert', preview: 'Tại sao view sụt giảm?', content: 'Thuật toán FB vừa cập nhật: Ưu tiên [Loại nội dung]. Đừng cố lách luật, hãy tập trung vào [Giải pháp]. Lưu lại ngay kẻo quên!' },
];

const VIRAL_HOOKS = [
  "🔥 BÍ MẬT KHÔNG NGỜ:",
  "❌ ĐỪNG LÀM ĐIỀU NÀY NẾU:",
  "✅ CÔNG THỨC 3 BƯỚC:",
  "🚀 TỐC ĐỘ TĂNG TRƯỞNG:",
  "🤫 TIẾT LỘ:",
  "📈 XU HƯỚNG MỚI NHẤT:",
  "⚠️ CẢNH BÁO:",
];

const WRITING_TONES_LIST: { id: WritingTone; label: string; icon: any }[] = [
  { id: 'viral', label: 'Bắt Trend', icon: Flame },
  { id: 'professional', label: 'Chuyên Gia', icon: UserCheck },
  { id: 'funny', label: 'Hài Hước', icon: Smile },
  { id: 'storytelling', label: 'Kể Chuyện', icon: BookOpen },
  { id: 'urgent', label: 'Khẩn Cấp', icon: AlertCircle },
  { id: 'emotional', label: 'Đồng Cảm', icon: Heart },
  { id: 'controversial', label: 'Tranh Luận', icon: ZapIcon },
];

const generateEnhancedMockPosts = (url: string, mode: ScanMode): FBPost[] => {
  const count = mode === 'deep' ? 40 : 15;
  let normalizedBase = url.trim();
  if (!normalizedBase.startsWith('http')) {
    normalizedBase = `https://www.facebook.com/${normalizedBase}`;
  }
  normalizedBase = normalizedBase.replace(/\/+$/, "");
  const author = normalizedBase.split('/').pop()?.split('?')[0] || "TargetUser";
  
  return Array.from({ length: count }).map((_, i) => {
    const isViralHit = Math.random() > 0.8;
    const isRecent = i < 5;
    
    let likes = isViralHit ? Math.floor(Math.random() * 20000) + 5000 : Math.floor(Math.random() * 800) + 50;
    let comments = isViralHit ? Math.floor(Math.random() * 3000) + 400 : Math.floor(Math.random() * 100) + 10;
    let shares = isViralHit ? Math.floor(Math.random() * 1500) + 200 : Math.floor(Math.random() * 50) + 2;
    
    const hook = VIRAL_HOOKS[Math.floor(Math.random() * VIRAL_HOOKS.length)];
    const mockPostId = `pfbid${Math.random().toString(36).substring(2, 15)}`;

    return {
      id: `post-${i}-${Date.now()}-${Math.random()}`,
      author,
      content: `${hook} Đây là bài viết mô phỏng kết quả quét từ tài khoản @${author}. Nội dung tập trung vào các chủ đề hot, mang tính chia sẻ giá trị và tạo tương tác cao. #${i} #ViralSpyAI #FacebookMarketing`,
      likes,
      comments,
      shares,
      timestamp: new Date(Date.now() - i * (mode === 'deep' ? 36 : 8) * 3600000).toISOString(),
      url: `${normalizedBase}/posts/${mockPostId}`,
      imageUrl: `https://picsum.photos/seed/${i + (isViralHit ? 1000 : 500)}/1024/768`
    };
  });
};

const ITEMS_PER_PAGE = 9;

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [inputMode, setInputMode] = useState<InputMode>('single');
  const [scanUrl, setScanUrl] = useState('');
  const [bulkScanUrls, setBulkScanUrls] = useState('');
  const [scanMode, setScanMode] = useState<ScanMode>('quick');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [scanResults, setScanResults] = useState<ScanResult | null>(null);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  const [writingTone, setWritingTone] = useState<WritingTone>('viral');
  const [customPersona, setCustomPersona] = useState('');
  const [styleKeywords, setStyleKeywords] = useState(''); // New state for keywords
  const [sortKey, setSortKey] = useState<SortKey>('total');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPost, setPreviewPost] = useState<FBPost | null>(null);
  const [scannedProfilesCount, setScannedProfilesCount] = useState(0);
  const [analyzingPostId, setAnalyzingPostId] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Idea Bank States
  const [ideaNiche, setIdeaNiche] = useState('');
  const [ideaKeywords, setIdeaKeywords] = useState('');
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<any[]>([]);
  const [ideaSearchQuery, setIdeaSearchQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('fb_viral_library');
    if (saved) setLibrary(JSON.parse(saved));
    const historyCount = localStorage.getItem('fb_spy_history_count');
    if (historyCount) setScannedProfilesCount(parseInt(historyCount));
  }, []);

  // Reset pagination when search/sort/scan changes
  useEffect(() => {
    setCurrentPage(1);
  }, [scanResults, sortKey, searchQuery]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const saveToLibrary = (post: FBPost) => {
    const newItem: LibraryItem = { ...post, savedAt: new Date().toISOString(), tags: ['viral', 'spy'] };
    // Check duplicates
    if (library.some(item => item.id === post.id)) {
      showToast('Bài viết này đã có trong thư viện!', 'info');
      return;
    }
    const updated = [newItem, ...library];
    setLibrary(updated);
    localStorage.setItem('fb_viral_library', JSON.stringify(updated));
    showToast('Đã lưu vào thư viện Viral!', 'success');
  };

  const removeFromLibrary = (id: string) => {
    const updated = library.filter(item => item.id !== id);
    setLibrary(updated);
    localStorage.setItem('fb_viral_library', JSON.stringify(updated));
    showToast('Đã xóa khỏi thư viện', 'info');
  };

  const exportLibraryToCSV = () => {
    if (!library.length) return;
    // Updated headers to strictly match request
    const headers = ["Content", "Likes", "Comments", "Shares", "Timestamp", "Author", "SavedAt"];
    const rows = library.map(p => [
      `"${p.content.replace(/"/g, '""')}"`,
      p.likes,
      p.comments,
      p.shares,
      `"${new Date(p.timestamp).toLocaleString('vi-VN')}"`, // Better date formatting
      `"${p.author.replace(/"/g, '""')}"`,
      `"${new Date(p.savedAt).toLocaleString('vi-VN')}"`
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `viral_posts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã xuất file CSV thành công!', 'success');
  };

  const handleScan = async () => {
    const urlsToScan = inputMode === 'single' 
      ? [scanUrl.trim()] 
      : bulkScanUrls.split('\n').map(u => u.trim()).filter(u => u !== '').slice(0, 100);

    if (urlsToScan.length === 0 || urlsToScan[0] === '') {
      showToast("Vui lòng nhập URL hợp lệ!", 'error');
      return;
    }

    setIsScanning(true);
    let allPosts: FBPost[] = [];
    
    // Giả lập các bước quét thực tế
    const scanSteps = [
      "Khởi tạo kết nối an toàn...",
      "Truy cập Header DOM...",
      "Phân tích cấu trúc bài viết...",
      "Đọc chỉ số tương tác (Likes/Comments/Shares)...",
      "Tính toán vận tốc Viral (Viral Velocity)...",
      "Đang hoàn tất dữ liệu..."
    ];

    try {
      for (const url of urlsToScan) {
        for (const step of scanSteps) {
          setScanStatus(`[${url.split('/').pop()}] ${step}`);
          await new Promise(resolve => setTimeout(resolve, scanMode === 'deep' ? 600 : 300));
        }
        const posts = generateEnhancedMockPosts(url, scanMode);
        allPosts = [...allPosts, ...posts];
      }

      const totalEng = allPosts.reduce((acc, p) => acc + p.likes + p.comments + p.shares, 0);
      const profileName = urlsToScan.length === 1 ? urlsToScan[0].split('/').pop()?.split('?')[0] || "Đối thủ" : `${urlsToScan.length} tài khoản`;

      setScanResults({ 
        posts: allPosts, 
        profileName, 
        totalEngagement: totalEng, 
        averageEngagement: Math.round(totalEng / allPosts.length) 
      });
      
      const newHistoryCount = scannedProfilesCount + urlsToScan.length;
      setScannedProfilesCount(newHistoryCount);
      localStorage.setItem('fb_spy_history_count', newHistoryCount.toString());

      setIsScanning(false);
      setScanStatus('');
      setActiveView('spy');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Quét dữ liệu thành công!', 'success');
    } catch (error) {
      console.error("Scan Error:", error);
      showToast("Có lỗi xảy ra trong quá trình quét. Vui lòng thử lại!", 'error');
      setIsScanning(false);
    }
  };

  const filteredAndSortedPosts = useMemo(() => {
    if (!scanResults) return [];
    let result = [...scanResults.posts];
    if (searchQuery) result = result.filter(post => post.content.toLowerCase().includes(searchQuery.toLowerCase()));
    result.sort((a, b) => {
      switch (sortKey) {
        case 'total': return (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares);
        case 'likes': return b.likes - a.likes;
        case 'comments': return b.comments - a.comments;
        case 'shares': return b.shares - a.shares;
        case 'newest': return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        default: return 0;
      }
    });
    return result;
  }, [scanResults, sortKey, searchQuery]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredAndSortedPosts.length / ITEMS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedPosts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedPosts, currentPage]);

  // Viral Trend Data Calculation
  const viralTrendData = useMemo(() => {
    const now = new Date();
    const result = [
      { name: '3 tuần trước', count: 0 },
      { name: '2 tuần trước', count: 0 },
      { name: 'Tuần trước', count: 0 },
      { name: 'Tuần này', count: 0 },
    ];
    
    const oneDay = 24 * 60 * 60 * 1000;
    
    library.forEach(item => {
      if (!item.savedAt) return;
      const savedDate = new Date(item.savedAt);
      const diffDays = Math.floor((now.getTime() - savedDate.getTime()) / oneDay);
      
      if (diffDays >= 0 && diffDays < 28) {
         // 0-6: index 3 (Tuần này)
         // 7-13: index 2
         // 14-20: index 1
         // 21-27: index 0
         const weekIndex = 3 - Math.floor(diffDays / 7);
         if (weekIndex >= 0 && weekIndex <= 3) {
            result[weekIndex].count += 1;
         }
      }
    });
    return result;
  }, [library]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRewrite = async () => {
    if (!aiInput) return;
    setIsWriting(true);
    // Pass styleKeywords to the service
    const result = await rewritePost(aiInput, writingTone, customPersona, styleKeywords);
    setAiOutput(result || "Không có kết quả.");
    setIsWriting(false);
    showToast('Đã viết lại nội dung xong!', 'success');
  };

  const handleAnalyzeViral = async (post: FBPost) => {
    // Nếu đang xem bài này và đã có kết quả thì đóng
    if (analyzingPostId === post.id && post.analysis) { 
      setAnalyzingPostId(null); 
      return; 
    }
    
    // Nếu chưa phân tích hoặc đang muốn xem
    setAnalyzingPostId(post.id);
    
    // Nếu bài viết đã có dữ liệu phân tích rồi thì không cần gọi API nữa (tiết kiệm)
    if (post.analysis) {
        return;
    }

    const result = await analyzeViralFactor(post.content);
    
    if (result && scanResults) {
        // Cập nhật kết quả phân tích vào danh sách bài viết trong state
        const updatedPosts = scanResults.posts.map(p => 
            p.id === post.id ? { ...p, analysis: result } : p
        );
        setScanResults({ ...scanResults, posts: updatedPosts });
        showToast('Phân tích hoàn tất!', 'success');
    } else {
        showToast('Không thể phân tích. Thử lại sau.', 'error');
    }
  };

  const handleGenerateIdeas = async () => {
    if (!ideaNiche) return;
    setIsGeneratingIdeas(true);
    const ideas = await generateViralIdeas(ideaNiche, ideaKeywords);
    setGeneratedIdeas(ideas);
    setIsGeneratingIdeas(false);
    showToast('Đã tạo xong ý tưởng mới!', 'success');
  };

  const filteredIdeas = useMemo(() => {
    if (!ideaSearchQuery) return CONTENT_TEMPLATES;
    return CONTENT_TEMPLATES.filter(t => 
      t.title.toLowerCase().includes(ideaSearchQuery.toLowerCase()) || 
      t.content.toLowerCase().includes(ideaSearchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(ideaSearchQuery.toLowerCase())
    );
  }, [ideaSearchQuery]);

  const NavItem = ({ icon: Icon, label, id }: { icon: any, label: string, id: ViewType }) => (
    <button onClick={() => setActiveView(id)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeView === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}>
      <Icon size={20} />
      {isSidebarOpen && <span className="font-medium whitespace-nowrap">{label}</span>}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed h-full z-50 shadow-sm overflow-hidden`}>
        <div className="p-6 flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-100"><Facebook size={24} /></div>
          {isSidebarOpen && <h1 className="text-xl font-bold text-gray-900 tracking-tighter leading-none">FB Spy AI</h1>}
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <NavItem icon={LayoutDashboard} label="Tổng quan" id="dashboard" />
          <NavItem icon={Search} label="Quét bài viết" id="scanner" />
          <NavItem icon={Sparkles} label="Kho ý tưởng" id="idea-bank" />
          <NavItem icon={Zap} label="Spy đối thủ" id="spy" />
          <NavItem icon={Library} label="Viral Library" id="library" />
          <NavItem icon={PenTool} label="AI Writer" id="ai-writer" />
          
          <div className="pt-4 mt-4 border-t border-gray-100">
             <a href="https://www.facebook.com/quannv0988" target="_blank" rel="noopener noreferrer" className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-amber-600 bg-amber-50 hover:bg-amber-100 group`}>
              <Headphones size={20} className="group-hover:scale-110 transition-transform" />
              {isSidebarOpen && <span className="font-black text-[10px] uppercase tracking-wide leading-tight">Liên hệ tư vấn<br/>MIỄN PHÍ CÙNG CHUYÊN GIA</span>}
            </a>
          </div>
        </nav>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-4 flex items-center justify-center hover:bg-gray-100 border-t border-gray-100 transition-colors">
          {isSidebarOpen ? <X size={20} className="text-gray-400" /> : <Menu size={20} className="text-gray-400" />}
        </button>
      </aside>

      <main className={`${isSidebarOpen ? 'ml-64' : 'ml-20'} flex-1 p-8 transition-all duration-300 relative`}>
        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-3">
                <h2 className="text-4xl font-black text-gray-900 flex items-center tracking-tighter uppercase">Phân Tích Hiệu Quả</h2>
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 font-bold">
                    <Database size={16} className="text-blue-600" />
                    <p>Dữ liệu tổng hợp từ {scannedProfilesCount} tài khoản bạn đã quét.</p>
                  </div>
                  <p className="text-xs text-gray-500 font-medium italic flex items-center">
                    <Info size={12} className="mr-1" />
                    Hệ thống sẽ thông minh hơn khi bạn quét nhiều đối thủ. Hãy tích lũy dữ liệu để mở khóa các chỉ số chuyên sâu.
                  </p>
                </div>
              </div>
              <div className="flex space-x-4">
                <button onClick={() => setActiveView('scanner')} className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
                  <Search className="mr-3" size={18} /> QUÉT ĐỐI THỦ MỚI
                </button>
                <button onClick={() => setActiveView('idea-bank')} className="bg-purple-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center hover:bg-purple-700 shadow-xl shadow-purple-200 transition-all">
                  <Sparkles className="mr-3" size={18} /> KHO Ý TƯỞNG
                </button>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm"><Database className="text-blue-600 mb-6" size={32} /><h3 className="text-gray-400 text-xs font-black uppercase tracking-widest">Profiles Analyzed</h3><p className="text-4xl font-black mt-2 text-gray-900 tracking-tighter">{scannedProfilesCount}</p></div>
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm"><Activity className="text-green-600 mb-6" size={32} /><h3 className="text-gray-400 text-xs font-black uppercase tracking-widest">Độ tin cậy dữ liệu</h3><p className="text-4xl font-black mt-2 text-gray-900 tracking-tighter">{Math.min(100, scannedProfilesCount * 8)}%</p></div>
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm"><Flame className="text-orange-500 mb-6" size={32} /><h3 className="text-gray-400 text-xs font-black uppercase tracking-widest">Loại hình hot</h3><p className="text-4xl font-black mt-2 text-gray-900 tracking-tighter uppercase">Reels</p></div>
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm"><Award className="text-amber-500 mb-6" size={32} /><h3 className="text-gray-400 text-xs font-black uppercase tracking-widest">Viral Score TB</h3><p className="text-4xl font-black mt-2 text-gray-900 tracking-tighter">8.4/10</p></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
                 <h3 className="text-2xl font-black text-gray-900 mb-10 flex items-center uppercase tracking-tighter">Biểu đồ xu hướng định dạng</h3>
                 <div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{ name: 'Reels', val: 1800 }, { name: 'Storytelling', val: 1400 }, { name: 'Video 1:1', val: 900 }, { name: 'Ảnh đơn', val: 600 }, { name: 'Text dài', val: 1100 }]}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="val" fill="#3b82f6" radius={[12, 12, 0, 0]} barSize={50} /></BarChart></ResponsiveContainer></div>
              </section>

              <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-2xl font-black text-gray-900 flex items-center uppercase tracking-tighter">
                    <TrendingIcon className="mr-3 text-emerald-500" size={28} /> Xu hướng lưu Viral
                  </h3>
                  <div className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest">30 ngày qua</div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={viralTrendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 'bold'}} 
                        cursor={{stroke: '#10b981', strokeWidth: 2}}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#10b981" 
                        strokeWidth={4} 
                        dot={{r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} 
                        activeDot={{r: 8}} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Idea Bank View */}
        {activeView === 'idea-bank' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Kho Ý Tưởng Viral</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold mb-4">Tạo ý tưởng mới</h3>
                <div className="space-y-4">
                  <input
                    className="w-full p-3 border rounded-xl"
                    placeholder="Ngành hàng (VD: Mỹ phẩm, Bất động sản...)"
                    value={ideaNiche}
                    onChange={(e) => setIdeaNiche(e.target.value)}
                  />
                  <input
                    className="w-full p-3 border rounded-xl"
                    placeholder="Từ khóa (VD: khuyến mãi, tết...)"
                    value={ideaKeywords}
                    onChange={(e) => setIdeaKeywords(e.target.value)}
                  />
                  <button
                    onClick={handleGenerateIdeas}
                    disabled={isGeneratingIdeas}
                    className="w-full bg-purple-600 text-white p-3 rounded-xl font-bold"
                  >
                    {isGeneratingIdeas ? 'Đang tạo...' : 'Tạo ý tưởng'}
                  </button>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                 <h3 className="font-bold mb-4">Kết quả</h3>
                 <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {generatedIdeas.map((idea, idx) => (
                      <div key={idx} className="p-4 border rounded-xl hover:bg-gray-50">
                        <h4 className="font-bold text-lg">{idea.title}</h4>
                        <p className="text-sm text-gray-600 mt-2">{idea.content}</p>
                        <div className="mt-2 flex gap-2">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{idea.category}</span>
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">{idea.viralReason}</span>
                        </div>
                      </div>
                    ))}
                    {generatedIdeas.length === 0 && <p className="text-gray-400 text-center">Chưa có ý tưởng nào được tạo.</p>}
                 </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="font-bold mb-4 text-xl">Mẫu Content Có Sẵn</h3>
              <div className="relative mb-6">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                 <input 
                   className="w-full pl-10 p-3 rounded-xl border" 
                   placeholder="Tìm kiếm mẫu..."
                   value={ideaSearchQuery}
                   onChange={(e) => setIdeaSearchQuery(e.target.value)}
                 />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIdeas.map(template => (
                  <div key={template.id} className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold">{template.category}</span>
                    </div>
                    <h4 className="font-bold text-lg mb-2">{template.title}</h4>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{template.content}</p>
                    <button 
                      onClick={() => {
                        setAiInput(template.content);
                        setActiveView('ai-writer');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full py-2 border border-blue-600 text-blue-600 rounded-lg font-bold hover:bg-blue-50"
                    >
                      Sử dụng mẫu này
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scanner View */}
        {activeView === 'scanner' && (
           <div className="max-w-2xl mx-auto bg-white p-8 rounded-[2rem] shadow-sm">
             <h2 className="text-3xl font-bold mb-6 text-center">Quét Content Đối Thủ</h2>
             <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
               <button 
                 className={`flex-1 py-2 rounded-lg font-bold ${inputMode === 'single' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                 onClick={() => setInputMode('single')}
               >
                 Link Đơn Lẻ
               </button>
               <button 
                 className={`flex-1 py-2 rounded-lg font-bold ${inputMode === 'bulk' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                 onClick={() => setInputMode('bulk')}
               >
                 Quét Hàng Loạt
               </button>
             </div>
             
             {inputMode === 'single' ? (
               <input 
                 className="w-full p-4 border rounded-xl mb-4"
                 placeholder="Nhập link Facebook Profile/Page..."
                 value={scanUrl}
                 onChange={(e) => setScanUrl(e.target.value)}
               />
             ) : (
               <textarea 
                 className="w-full p-4 border rounded-xl mb-4 h-32"
                 placeholder="Nhập danh sách link (mỗi dòng 1 link)..."
                 value={bulkScanUrls}
                 onChange={(e) => setBulkScanUrls(e.target.value)}
               />
             )}

             <div className="flex items-center gap-4 mb-8">
               <label className="flex items-center space-x-2 cursor-pointer">
                 <input type="radio" name="scanMode" checked={scanMode === 'quick'} onChange={() => setScanMode('quick')} />
                 <span>Quét nhanh</span>
               </label>
               <label className="flex items-center space-x-2 cursor-pointer">
                 <input type="radio" name="scanMode" checked={scanMode === 'deep'} onChange={() => setScanMode('deep')} />
                 <span>Quét sâu (Deep Scan)</span>
               </label>
             </div>

             <button 
               onClick={handleScan}
               disabled={isScanning}
               className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-70 flex justify-center items-center"
             >
               {isScanning ? <><Loader2 className="animate-spin mr-2" /> ĐANG QUÉT...</> : 'BẮT ĐẦU QUÉT'}
             </button>
             
             {isScanning && (
               <div className="mt-6 text-center text-gray-500 animate-pulse">
                 {scanStatus}
               </div>
             )}
           </div>
        )}

        {/* Spy View (Results) */}
        {activeView === 'spy' && scanResults && (
          <div className="space-y-6">
            <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm">
               <div>
                 <h2 className="text-2xl font-bold">{scanResults.profileName}</h2>
                 <div className="flex gap-4 text-sm text-gray-600 mt-1">
                   <span>Tổng tương tác: <strong>{scanResults.totalEngagement.toLocaleString()}</strong></span>
                   <span>TB tương tác: <strong>{scanResults.averageEngagement.toLocaleString()}</strong>/post</span>
                 </div>
               </div>
               <div className="flex gap-3">
                 <select 
                   value={sortKey} 
                   onChange={(e) => setSortKey(e.target.value as SortKey)}
                   className="p-2 border rounded-lg bg-gray-50"
                 >
                   <option value="total">Tương tác cao nhất</option>
                   <option value="likes">Nhiều Like nhất</option>
                   <option value="newest">Mới nhất</option>
                 </select>
               </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedPosts.map((post) => (
                <div key={post.id} className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col">
                   <div className="flex items-center mb-4 space-x-3">
                     <div className="w-10 h-10 bg-gray-200 rounded-full" />
                     <div>
                       <h4 className="font-bold text-sm">{post.author}</h4>
                       <span className="text-xs text-gray-500">{new Date(post.timestamp).toLocaleDateString()}</span>
                     </div>
                   </div>
                   <p className="text-gray-800 mb-4 line-clamp-4 flex-1">{post.content}</p>
                   {post.imageUrl && (
                     <img src={post.imageUrl} alt="Post" className="w-full h-48 object-cover rounded-xl mb-4" />
                   )}
                   
                   <div className="flex justify-between text-sm text-gray-500 mb-4 pt-4 border-t">
                     <span className="flex items-center"><ThumbsUp size={14} className="mr-1"/> {post.likes}</span>
                     <span className="flex items-center"><MessageCircle size={14} className="mr-1"/> {post.comments}</span>
                     <span className="flex items-center"><Share2 size={14} className="mr-1"/> {post.shares}</span>
                   </div>

                   <div className="grid grid-cols-2 gap-2 mt-auto">
                     <button 
                       onClick={() => handleAnalyzeViral(post)}
                       className="py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-bold hover:bg-purple-100 flex items-center justify-center"
                     >
                        <Zap size={14} className="mr-1" /> Phân tích
                     </button>
                     <button 
                       onClick={() => saveToLibrary(post)}
                       className="py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 flex items-center justify-center"
                     >
                        <Bookmark size={14} className="mr-1" /> Lưu
                     </button>
                   </div>
                   
                   {analyzingPostId === post.id && !post.analysis && (
                      <div className="mt-4 text-center text-xs text-gray-500"><Loader2 className="animate-spin inline mr-1" size={12}/> Đang phân tích...</div>
                   )}

                   {post.analysis && (
                     <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs space-y-2">
                       <div className="flex justify-between font-bold">
                         <span>Viral Score: {post.analysis.viralScore}/10</span>
                         <span>Hook: {post.analysis.hookScore}/10</span>
                       </div>
                       <p className="text-gray-600"><strong>Điểm mạnh:</strong> {post.analysis.strengths.join(', ')}</p>
                       <p className="text-green-600"><strong>Cải thiện:</strong> {post.analysis.improvement}</p>
                     </div>
                   )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center space-x-2 mt-8">
              <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="p-2 border rounded-lg disabled:opacity-50"><ChevronLeft size={20} /></button>
              <span className="px-4 py-2 font-bold">Trang {currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="p-2 border rounded-lg disabled:opacity-50"><ChevronRight size={20} /></button>
            </div>
          </div>
        )}

        {/* AI Writer */}
        {activeView === 'ai-writer' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
            <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col">
              <h2 className="text-xl font-bold mb-4 flex items-center"><PenTool className="mr-2" /> Input</h2>
              <textarea
                className="flex-1 w-full p-4 border rounded-xl resize-none mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Nhập nội dung gốc hoặc ý tưởng của bạn..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
              />
              
              <div className="space-y-4">
                 <div>
                   <label className="text-sm font-bold text-gray-700 block mb-2">Phong cách (Tone)</label>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                     {WRITING_TONES_LIST.map(tone => (
                       <button
                         key={tone.id}
                         onClick={() => setWritingTone(tone.id)}
                         className={`p-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 border ${writingTone === tone.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'}`}
                       >
                         <tone.icon size={16} />
                         {tone.label}
                       </button>
                     ))}
                   </div>
                 </div>
                 
                 <div>
                   <label className="text-sm font-bold text-gray-700 block mb-2">Đóng vai (Persona)</label>
                   <input 
                     className="w-full p-3 border rounded-xl text-sm"
                     placeholder="VD: Chuyên gia BĐS, Gen Z, Bà mẹ bỉm sữa..."
                     value={customPersona}
                     onChange={(e) => setCustomPersona(e.target.value)}
                   />
                 </div>
                 
                 <div>
                   <label className="text-sm font-bold text-gray-700 block mb-2">Từ khóa bắt buộc</label>
                   <input 
                     className="w-full p-3 border rounded-xl text-sm"
                     placeholder="VD: giảm giá, duy nhất hôm nay..."
                     value={styleKeywords}
                     onChange={(e) => setStyleKeywords(e.target.value)}
                   />
                 </div>

                 <button 
                   onClick={handleRewrite}
                   disabled={isWriting || !aiInput}
                   className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-70"
                 >
                   {isWriting ? <Loader2 className="animate-spin inline" /> : 'VIẾT LẠI NGAY'}
                 </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col">
               <h2 className="text-xl font-bold mb-4 flex items-center text-blue-600"><Sparkles className="mr-2" /> Output</h2>
               <div className="flex-1 w-full p-6 border rounded-xl bg-gray-50 overflow-y-auto whitespace-pre-wrap">
                 {aiOutput || <span className="text-gray-400 italic">Kết quả sẽ hiện ở đây...</span>}
               </div>
               <div className="flex justify-end mt-4">
                 <button 
                   onClick={() => {navigator.clipboard.writeText(aiOutput); showToast('Đã copy!', 'success')}}
                   disabled={!aiOutput}
                   className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                 >
                   <Copy size={18} /> <span>Copy</span>
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* Library View */}
        {activeView === 'library' && (
           <div className="space-y-6">
             <header className="flex justify-between items-center">
               <h2 className="text-3xl font-bold">Thư Viện Đã Lưu ({library.length})</h2>
               <button onClick={exportLibraryToCSV} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-100 transition-all">
                 <Download size={18} /> <span>Xuất CSV</span>
               </button>
             </header>

             {library.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-3xl">
                 <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"><Bookmark className="text-gray-400" size={32} /></div>
                 <h3 className="text-gray-900 font-bold text-lg">Chưa có bài viết nào</h3>
                 <p className="text-gray-500">Hãy quét và lưu lại các bài viết hay để học hỏi.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {library.map(item => (
                   <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border relative group">
                     <button 
                       onClick={() => removeFromLibrary(item.id)}
                       className="absolute top-4 right-4 p-2 bg-white shadow-md rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                     >
                       <Trash2 size={16} />
                     </button>
                     <p className="text-gray-800 mb-4 line-clamp-4">{item.content}</p>
                     <div className="flex justify-between text-xs text-gray-500 mt-4 pt-4 border-t">
                        <span>Lưu lúc: {new Date(item.savedAt).toLocaleDateString()}</span>
                        <span className="font-bold text-blue-600">{item.analysis?.viralScore ? `Viral: ${item.analysis.viralScore}` : ''}</span>
                     </div>
                     <div className="mt-4 flex gap-2">
                       <button 
                         onClick={() => {
                           setAiInput(item.content);
                           setActiveView('ai-writer');
                         }}
                         className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
                       >
                         Rewrite
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
        )}

      </main>
    </div>
  );
};

export default App;
