/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Book,
  ChevronRight,
  ChevronDown,
  Plus,
  Settings,
  Search,
  Info,
  Share2,
  Edit3,
  Maximize2,
  Type,
  Trash2,
  FileText,
  Download,
  User,
  Cloud,
  CloudOff,
  LogOut,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';

interface Chapter {
  id: string;
  title: string;
  content: string;
  isOpen?: boolean;
  subChapters?: Chapter[];
}

interface BookUniverse {
  id: string;
  title: string;
  iconChar: string;
  color: string;
}

const BOOKS: BookUniverse[] = [
  { id: '1', title: '新100个基本', iconChar: '新', color: '#3B82F6' },
  { id: '2', title: '电影空间', iconChar: '电', color: '#D65A5A' },
  { id: '3', title: '人间指南', iconChar: '人', color: '#475569' },
];

// Helper to increment chapter titles (supports Chinese and Arabic numerals)
const getNextChapterTitle = (title: string): string => {
  if (title === '序言' || title === '序章') return '第一章';

  // Match "第[数字]章" or "第[中文数字]章"
  const chapterMatch = title.match(/^第([0-9一二三四五六七八九十百]+)章/);
  if (chapterMatch) {
    const numPart = chapterMatch[1];
    const rest = title.substring(chapterMatch[0].length);

    if (/^\d+$/.test(numPart)) {
      return `第${parseInt(numPart) + 1}章${rest}`;
    } else {
      const nextNum = incrementChineseNumber(numPart);
      return `第${nextNum}章${rest}`;
    }
  }

  // Match sub-chapters like "4.1", "1.10"
  const subChapterMatch = title.match(/^([0-9一二三四五六七八九十百序]+)\.(\d+)(.*)/);
  if (subChapterMatch) {
    const parentPart = subChapterMatch[1];
    const subNum = subChapterMatch[2];
    const rest = subChapterMatch[3];
    return `${parentPart}.${parseInt(subNum) + 1}${rest}`;
  }

  // Match numbered starts like "1. ", "01. ", "1 " 
  const digitMatch = title.match(/^(\d+)([\.\s、].*)/);
  if (digitMatch) {
    const num = digitMatch[1];
    const rest = digitMatch[2];
    const nextNum = (parseInt(num) + 1).toString().padStart(num.length, '0');
    return `${nextNum}${rest}`;
  }

  return '新章节';
};

const incrementChineseNumber = (s: string): string => {
  const chars = '一二三四五六七八九';

  const chineseToNumber = (s: string): number => {
    if (s === '十') return 10;
    if (s.startsWith('十')) return 10 + chars.indexOf(s[1]) + 1;
    if (s.endsWith('十')) return (chars.indexOf(s[0]) + 1) * 10;
    if (s.includes('十')) {
      const parts = s.split('十');
      return (chars.indexOf(parts[0]) + 1) * 10 + (chars.indexOf(parts[1]) + 1);
    }
    return chars.indexOf(s) + 1;
  };

  const numberToChinese = (n: number): string => {
    if (n <= 10) return ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][n];
    if (n < 20) return '十' + (n % 10 === 0 ? '' : numberToChinese(n % 10));
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const one = n % 10;
      return numberToChinese(ten) + '十' + (one === 0 ? '' : numberToChinese(one));
    }
    return n.toString();
  };

  try {
    return numberToChinese(chineseToNumber(s) + 1);
  } catch (e) {
    return s;
  }
};

const generateMockChapters = (bookId: string, mainChapters: string[]) => {
  const chapters: Chapter[] = [];

  // Always add Prologue (序章) first
  const prologueSubCount = Math.floor(Math.random() * 3) + 3; // 3 to 5
  chapters.push({
    id: `${bookId}-0`,
    title: '序章',
    content: '这是本书的开篇之辞。',
    isOpen: true,
    subChapters: Array.from({ length: prologueSubCount }).map((_, i) => ({
      id: `${bookId}-0-${i + 1}`,
      title: `序.${i + 1} 引导内容`,
      content: `关于序言的第 ${i + 1} 部分详细介绍...`
    }))
  });

  // Add other major chapters
  mainChapters.forEach((title, index) => {
    const chapterNum = index + 1;
    const subCount = Math.floor(Math.random() * 5) + 5; // 5 to 9
    const subChapters = Array.from({ length: subCount }).map((_, i) => ({
      id: `${bookId}-${chapterNum}-${i + 1}`,
      title: `${chapterNum}.${i + 1} 子章节内容`,
      content: `这是关于 ${title} 的第 ${i + 1} 部分详细内容...`
    }));

    chapters.push({
      id: `${bookId}-${chapterNum}`,
      title: title,
      content: `这是 ${title} 的章节引言内容。`,
      isOpen: false,
      subChapters
    });
  });

  return chapters;
};

const BOOK_DATA: Record<string, Chapter[]> = {
  '1': generateMockChapters('1', [
    '第1章 生活原则', '第2章 工作准则', '第3章 思考哲学', '第4章 效率技巧',
    '第5章 成长感悟', '第6章 态度之基', '第7章 社交艺术', '第8章 未来展望', '第9章 总结回顾'
  ]),
  '2': generateMockChapters('2', [
    '第1章 镜头语言', '第2章 导演艺术', '第3章 剧本结构', '第4章 影史经典',
    '第5章 未来影像', '第6章 剪辑节奏', '第7章 色彩美学', '第8章 叙事诡计'
  ]),
  '3': generateMockChapters('3', [
    '第1章 饮食男女', '第2章 穿衣之道', '第3章 居住体验', '第4章 行走天下',
    '第5章 心灵寄托', '第6章 艺术熏陶', '第7章 传统礼仪', '第8章 现代节奏', '第9章 岁月印记'
  ]),
};


function CoverPage({ currentBook }: { currentBook: BookUniverse }) {
  const circles = [
    { x: '15%', y: '10%', color: '#E0F2FE', text: '基本' },
    { x: '35%', y: '15%', color: '#FEE2E2', text: '生活' },
    { x: '55%', y: '8%', color: '#F5F5F4', text: '思考' },
    { x: '75%', y: '18%', color: '#DCFCE7', text: '准则' },
    { x: '88%', y: '12%', color: '#FFEDD5', text: '新' },

    { x: '12%', y: '82%', color: '#E7E5E4', text: '工作' },
    { x: '32%', y: '88%', color: '#DBEAFE', text: '态度' },
    { x: '52%', y: '80%', color: '#FECACA', text: '成长' },
    { x: '72%', y: '85%', color: '#D1FAE5', text: '效率' },
    { x: '92%', y: '78%', color: '#FFD70033', text: '哲学' },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white relative overflow-hidden h-full select-none">
      {/* Decorative Circles */}
      {circles.map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 0.8, scale: 1, y: 0 }}
          transition={{
            delay: i * 0.1,
            duration: 1.5,
          }}
          className="absolute w-20 h-20 rounded-full flex items-center justify-center text-[10px] text-stone-600 font-medium shadow-sm border border-white/50"
          style={{ left: c.x, top: c.y, backgroundColor: c.color }}
        >
          {c.text}
        </motion.div>
      ))}

      {/* Main Title Content */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
        className="text-center z-10 px-12"
      >
        <span className="text-stone-300 uppercase tracking-[0.8em] text-sm mb-12 block ml-[0.8em]">Life</span>

        <div className="relative inline-block">
          <h1 className="font-serif text-7xl font-bold text-stone-800 mb-8 tracking-tighter">
            {currentBook.title}
          </h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute -bottom-2 left-0 h-px bg-stone-200"
          />
        </div>

        <p className="mt-12 text-stone-500 font-serif text-xl tracking-widest leading-loose max-w-md mx-auto">
          面对每一件可能发生事情的哲学解答
        </p>

        <div className="mt-16 flex flex-col items-center gap-4 opacity-40">
          <div className="w-px h-12 bg-stone-300" />
          <span className="text-[10px] uppercase tracking-[0.4em] font-medium text-stone-500">松柏太郎 • 著</span>
        </div>
      </motion.div>

      {/* Bottom Decoration */}
      <div className="absolute bottom-12 flex flex-col items-center opacity-20">
        <span className="text-[10px] uppercase tracking-widest text-stone-500">Lumina Publishing • First Edition</span>
      </div>
    </div>
  );
}

function BookSwitcher({ currentBook, onSelect }: { currentBook: BookUniverse, onSelect: (book: BookUniverse) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative px-2 mb-2">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-4 py-2 hover:bg-stone-200/50 cursor-pointer rounded-lg transition-all group ${isOpen ? 'bg-stone-200/50' : ''}`}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm"
            style={{ backgroundColor: currentBook.color }}
          >
            {currentBook.iconChar}
          </div>
          <span className="text-sm font-semibold text-stone-700">{currentBook.title}</span>
        </div>
        <ChevronDown size={14} className={`text-stone-400 group-hover:text-stone-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute left-2 right-2 top-full mt-1 bg-white rounded-xl shadow-2xl border border-stone-200 p-1 z-50 overflow-hidden"
          >
            {BOOKS.map(book => (
              <button
                key={book.id}
                onClick={() => {
                  onSelect(book);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${book.id === currentBook.id ? 'bg-stone-50' : 'hover:bg-stone-100'}`}
              >
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: book.color }}
                >
                  {book.iconChar}
                </div>
                <span className="text-sm font-medium text-stone-600">{book.title}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [currentBook, setCurrentBook] = useState<BookUniverse>(BOOKS[0]);
  const [chapters, setChapters] = useState<Chapter[]>(BOOK_DATA['1']);
  const [activeChapterId, setActiveChapterId] = useState<string>('cover');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isSynced, setIsSynced] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (isSignUp: boolean) => {
    setAuthLoading(true);
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email: authEmail, password: authPassword })
      : await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });

    if (error) {
      alert(error.message);
    } else {
      setShowAuthModal(false);
    }
    setAuthLoading(false);
  };

  // Cloud Sync Logic
  useEffect(() => {
    if (user) {
      loadFromCloud();
    } else {
      setChapters(BOOK_DATA[currentBook.id] || []);
    }
  }, [user, currentBook.id]);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        saveToCloud();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [chapters]);

  const loadFromCloud = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_books')
      .select('chapters_data')
      .eq('user_id', user.id)
      .eq('book_id', currentBook.id)
      .single();

    if (data && !error) {
      setChapters(data.chapters_data);
    } else {
      setChapters(BOOK_DATA[currentBook.id] || []);
    }
  };

  const saveToCloud = async () => {
    if (!user) return;
    setIsSynced(false);
    const { error } = await supabase
      .from('user_books')
      .upsert({
        user_id: user.id,
        book_id: currentBook.id,
        chapters_data: chapters,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,book_id' });

    if (!error) setIsSynced(true);
  };

  // Find active chapter
  const findChapter = (list: Chapter[], id: string): Chapter | undefined => {
    for (const ch of list) {
      if (ch.id === id) return ch;
      if (ch.subChapters) {
        const found = findChapter(ch.subChapters, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const activeChapter = findChapter(chapters, activeChapterId);

  const handleBookSelect = (book: BookUniverse) => {
    setCurrentBook(book);
    setActiveChapterId('cover');
  };

  const updateChapterTitle = (id: string, newTitle: string) => {
    const updateInList = (list: Chapter[]): Chapter[] => {
      return list.map(ch => {
        if (ch.id === id) return { ...ch, title: newTitle };
        if (ch.subChapters) return { ...ch, subChapters: updateInList(ch.subChapters) };
        return ch;
      });
    };
    setChapters(updateInList(chapters));
  };

  const updateChapterContent = (id: string, newContent: string) => {
    const updateInList = (list: Chapter[]): Chapter[] => {
      return list.map(ch => {
        if (ch.id === id) return { ...ch, content: newContent };
        if (ch.subChapters) return { ...ch, subChapters: updateInList(ch.subChapters) };
        return ch;
      });
    };
    setChapters(updateInList(chapters));
  };

  const toggleFolder = (id: string) => {
    const toggleInList = (list: Chapter[]): Chapter[] => {
      return list.map(ch => {
        if (ch.id === id) return { ...ch, isOpen: !ch.isOpen };
        if (ch.subChapters) return { ...ch, subChapters: toggleInList(ch.subChapters) };
        return ch;
      });
    };
    setChapters(toggleInList(chapters));
  };

  const addNewChapter = (parentId?: string, siblingId?: string) => {
    const newId = Math.random().toString(36).substr(2, 9);

    // Find base title for auto-increment
    let baseTitle = '新章节';
    if (siblingId) {
      const sibling = findChapter(chapters, siblingId);
      if (sibling) baseTitle = getNextChapterTitle(sibling.title);
    } else if (parentId) {
      const parent = findChapter(chapters, parentId);
      if (parent) {
        if (parent.subChapters && parent.subChapters.length > 0) {
          baseTitle = getNextChapterTitle(parent.subChapters[parent.subChapters.length - 1].title);
        } else {
          // Add first sub-chapter
          const mainMatch = parent.title.match(/^第([0-9]+)章/);
          if (mainMatch) {
            baseTitle = `${mainMatch[1]}.1 子章节内容`;
          } else if (parent.title === '序章') {
            baseTitle = `序.1 引导内容`;
          } else {
            baseTitle = '1.1 子章节内容';
          }
        }
      }
    } else if (chapters.length > 0) {
      baseTitle = getNextChapterTitle(chapters[chapters.length - 1].title);
    }

    const newCh: Chapter = { id: newId, title: baseTitle, content: '', isOpen: true };

    if (siblingId) {
      const addAfterSibling = (list: Chapter[]): Chapter[] => {
        const index = list.findIndex(ch => ch.id === siblingId);
        if (index !== -1) {
          const newList = [...list];
          newList.splice(index + 1, 0, newCh);
          return newList;
        }
        return list.map(ch => ({
          ...ch,
          subChapters: ch.subChapters ? addAfterSibling(ch.subChapters) : undefined
        }));
      };
      setChapters(addAfterSibling(chapters));
    } else if (!parentId) {
      setChapters([...chapters, newCh]);
    } else {
      const addInList = (list: Chapter[]): Chapter[] => {
        return list.map(ch => {
          if (ch.id === parentId) {
            return { ...ch, subChapters: [...(ch.subChapters || []), newCh], isOpen: true };
          }
          if (ch.subChapters) return { ...ch, subChapters: addInList(ch.subChapters) };
          return ch;
        });
      };
      setChapters(addInList(chapters));
    }
    setActiveChapterId(newId);
    setIsEditing(true);
  };

  const deleteChapter = (id: string) => {
    const deleteFromList = (list: Chapter[]): Chapter[] => {
      return list.filter(ch => ch.id !== id).map(ch => ({
        ...ch,
        subChapters: ch.subChapters ? deleteFromList(ch.subChapters) : undefined
      }));
    };
    setChapters(deleteFromList(chapters));
    if (activeChapterId === id) {
      setActiveChapterId(chapters[0]?.id || '');
    }
  };

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    if (activeChapter) {
      updateChapterContent(activeChapterId, e.currentTarget.innerText);
    }
  };

  const exportBookAsMarkdown = () => {
    let content = `# ${currentBook.title}\n\n`;

    const traverse = (list: Chapter[], level: number) => {
      list.forEach(ch => {
        const prefix = '#'.repeat(level);
        content += `${prefix} ${ch.title}\n\n`;
        if (ch.content) {
          content += `${ch.content}\n\n`;
        }
        if (ch.subChapters) {
          traverse(ch.subChapters, level + 1);
        }
      });
    };

    traverse(chapters, 2);

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentBook.title}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-full bg-[#E6E4E0] overflow-hidden selection:bg-stone-200">
      {/* Sidebar / Table of Contents */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 320 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="bg-[#EBE9E4] border-r border-stone-300 flex flex-col overflow-hidden relative"
      >
        {/* macOS Style Window Controls */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => user ? supabase.auth.signOut() : setShowAuthModal(true)}
              className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500 transition-colors relative group"
              title={user ? `已登录: ${user.email}` : "登录以同步云端"}
            >
              {user ? <User size={16} className="text-blue-500" /> : <User size={16} />}
              {user && (
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 border border-white" />
              )}
            </button>
            {user && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/50 border border-stone-200 shadow-sm">
                {isSynced ? (
                  <Cloud size={12} className="text-green-500" />
                ) : (
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Cloud size={12} className="text-blue-400" />
                  </motion.div>
                )}
                <span className="text-[10px] text-stone-400 font-medium">
                  {isSynced ? '已同步' : '同步中'}
                </span>
              </div>
            )}
          </div>
        </div>

        {showAuthModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                    <Cloud size={32} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-center text-stone-800 mb-2">云端同步</h3>
                <p className="text-sm text-stone-500 text-center mb-8">登录后您的写作记录将在所有设备同步</p>

                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input
                      type="email"
                      placeholder="邮箱地址"
                      className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Settings className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input
                      type="password"
                      placeholder="设置密码"
                      className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <button
                    disabled={authLoading}
                    onClick={() => handleAuth(false)}
                    className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    登录
                  </button>
                  <button
                    disabled={authLoading}
                    onClick={() => handleAuth(true)}
                    className="py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-colors disabled:opacity-50"
                  >
                    注册
                  </button>
                </div>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="w-full mt-4 py-2 text-sm text-stone-400 hover:text-stone-600 transition-colors"
                >
                  稍后再说
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Book Switcher */}
        <BookSwitcher
          currentBook={currentBook}
          onSelect={handleBookSelect}
        />

        <div className="p-6 flex items-center justify-between border-b border-stone-300 bg-stone-100/50">
          <div className="flex items-center gap-2 text-stone-500">
            <Book size={18} />
            <span className="text-xs font-semibold tracking-widest uppercase opacity-60">目录</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-2 hide-scrollbar">
          <div className="mb-6 px-1">
            <button
              onClick={() => setActiveChapterId('cover')}
              className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg transition-all ${activeChapterId === 'cover' ? 'bg-stone-800 text-white shadow-lg' : 'text-stone-500 hover:bg-stone-200'}`}
            >
              <FileText size={18} />
              <span className="text-sm font-bold tracking-tight">封面</span>
            </button>
          </div>

          <div className="space-y-1">
            {chapters.map((ch) => (
              <ChapterItem
                key={ch.id}
                chapter={ch}
                activeId={activeChapterId}
                onSelect={setActiveChapterId}
                onToggle={toggleFolder}
                onAddSub={(id) => addNewChapter(id)}
                onAddSibling={(id) => addNewChapter(undefined, id)}
                onDelete={deleteChapter}
                onRename={updateChapterTitle}
              />
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-stone-300 flex flex-col gap-2 bg-stone-100/50">
          <button
            onClick={() => addNewChapter()}
            className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-stone-400 rounded-lg text-stone-500 hover:bg-stone-200 hover:text-stone-700 transition-all text-xs font-medium"
          >
            <Plus size={14} />
            <span>添加新章节</span>
          </button>
          <div className="flex items-center justify-between text-stone-400 mt-1">
            <button className="p-2 hover:bg-stone-200 rounded-lg transition-colors">
              <Settings size={18} />
            </button>
            <span className="text-[10px] uppercase tracking-widest opacity-50">Lumina v1.0</span>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative bg-[#F5F2ED]">
        {/* Toolbar */}
        <header className="h-14 border-b border-stone-200 flex items-center justify-between px-6 bg-white/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-stone-100 rounded-lg text-stone-500 transition-colors"
            >
              <motion.div animate={{ rotate: isSidebarOpen ? 0 : 180 }}>
                <ChevronRight size={20} />
              </motion.div>
            </button>
            <div className="flex flex-col">
              <span className="text-xs text-stone-400 font-medium truncate max-w-[200px]">
                {activeChapterId === 'cover' ? '封面' : (activeChapter?.title || '未命名')}
              </span>
              <span className="text-[10px] text-stone-300 uppercase tracking-tighter">
                页码: {Math.floor(Math.random() * 100)} / 395
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ToolbarButton
              icon={<Download size={18} />}
              onClick={exportBookAsMarkdown}
              title="导出书籍 (Markdown)"
            />
            <div className="w-px h-4 bg-stone-200 mx-2" />
            <ToolbarButton icon={<Info size={18} />} />
            <ToolbarButton icon={<Search size={18} />} />
            <ToolbarButton icon={<Share2 size={18} />} />
            <div className="w-px h-4 bg-stone-200 mx-2" />
            <ToolbarButton
              icon={<Edit3 size={18} />}
              active={isEditing}
              onClick={() => setIsEditing(!isEditing)}
            />
            <ToolbarButton icon={<Type size={18} />} />
            <ToolbarButton icon={<Maximize2 size={18} />} />
          </div>
        </header>

        {/* Book Page Container */}
        <div className="flex-1 overflow-y-auto py-12 px-6 flex justify-center bg-[#E6E4E0]">
          <motion.div
            layout
            className="w-full max-w-3xl bg-white book-page min-h-[1000px] p-16 md:p-24 relative"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeChapterId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="h-full flex flex-col"
              >
                {activeChapterId === 'cover' ? (
                  <CoverPage currentBook={currentBook} />
                ) : (
                  <>
                    {/* Chapter Title */}
                    <h1
                      contentEditable={isEditing}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        updateChapterTitle(activeChapterId, e.currentTarget.innerText);
                      }}
                      className="font-serif text-4xl font-bold text-center mb-16 text-stone-800 tracking-tight outline-none"
                    >
                      {activeChapter?.title}
                    </h1>

                    {/* Content */}
                    <div
                      ref={contentRef}
                      contentEditable={isEditing}
                      suppressContentEditableWarning
                      onInput={handleContentChange}
                      className={`font-serif text-xl leading-relaxed text-stone-700 text-justify outline-none whitespace-pre-wrap ${isEditing ? 'cursor-text' : 'cursor-default'}`}
                      style={{ minHeight: '400px' }}
                    >
                      {activeChapter?.content}
                    </div>

                    {/* Page Footer Decoration */}
                    <div className="mt-auto pt-24 flex flex-col items-center opacity-20 select-none">
                      <div className="w-12 h-px bg-stone-900 mb-4" />
                      <span className="font-serif italic text-sm">Lumina Writer • {activeChapter?.title}</span>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

interface ChapterItemProps {
  chapter: Chapter;
  activeId: string;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onAddSub: (parentId?: string) => void;
  onAddSibling?: (siblingId: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  depth?: number;
}

const ChapterItem: React.FC<ChapterItemProps> = ({
  chapter,
  activeId,
  onSelect,
  onToggle,
  onAddSub,
  onAddSibling,
  onDelete,
  onRename,
  depth = 0
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempTitle, setTempTitle] = useState(chapter.title);
  const isActive = activeId === chapter.id;
  const hasSubs = chapter.subChapters && chapter.subChapters.length > 0;
  const isTopLevel = depth === 0;

  const handleRename = () => {
    if (tempTitle.trim()) {
      onRename(chapter.id, tempTitle);
    }
    setIsRenaming(false);
  };

  return (
    <div className="flex flex-col">
      <div
        className={`
          group flex items-center gap-1 py-2 px-3 rounded-md cursor-pointer transition-all
          ${isTopLevel ? 'mt-4 mb-1' : 'my-0.5'}
          ${isActive
            ? (isTopLevel ? 'bg-stone-800 text-white shadow-md' : 'bg-blue-500 text-white shadow-sm')
            : (isTopLevel ? 'text-stone-800 hover:bg-stone-200' : 'text-stone-500 hover:bg-stone-200')}
        `}
        style={{ marginLeft: `${depth * 12}px` }}
        onClick={() => onSelect(chapter.id)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(chapter.id);
          }}
          className={`p-0.5 rounded hover:bg-black/5 transition-transform ${chapter.isOpen ? 'rotate-0' : '-rotate-90'} ${isTopLevel ? 'text-stone-400' : 'text-stone-300'}`}
        >
          {hasSubs ? <ChevronDown size={isTopLevel ? 16 : 14} /> : <div className="w-4" />}
        </button>

        <div className="flex-1 flex items-center gap-2 overflow-hidden" onDoubleClick={(e) => { e.stopPropagation(); setIsRenaming(true); }}>
          {isRenaming ? (
            <input
              autoFocus
              className="text-sm bg-white text-stone-800 px-1 rounded outline-none w-full border border-blue-400"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={`truncate select-none ${isTopLevel ? 'font-serif text-base font-bold tracking-tight' : 'text-sm font-normal'}`}>
              {chapter.title}
            </span>
          )}
        </div>

        <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-white' : 'text-stone-400'}`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddSub(chapter.id);
            }}
            className="p-1 hover:bg-black/10 rounded"
            title="添加子章节"
          >
            <Plus size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(chapter.id); }}
            className="p-1 hover:bg-black/10 rounded"
            title="删除"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {hasSubs && chapter.isOpen && (
        <div className={`relative ${isTopLevel ? 'ml-2 border-l border-stone-300/50' : ''}`}>
          {chapter.subChapters?.map(sub => (
            <ChapterItem
              key={sub.id}
              chapter={sub}
              activeId={activeId}
              onSelect={onSelect}
              onToggle={onToggle}
              onAddSub={onAddSub}
              onAddSibling={onAddSibling}
              onDelete={onDelete}
              onRename={onRename}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function ToolbarButton({ icon, active, onClick, title }: { icon: React.ReactNode; active?: boolean; onClick?: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        p-2 rounded-lg transition-all
        ${active ? 'bg-stone-800 text-white shadow-inner' : 'hover:bg-stone-100 text-stone-500'}
      `}
    >
      {icon}
    </button>
  );
}
