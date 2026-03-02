import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, User, FileText, Calendar, Loader2, ArrowRight } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import api from '@/services/api';

/**
 * SearchBar — Senior Professional UI 
 * Theme: Tailwind Custom Design System
 */

const SEARCH_TABS = [
  { key: 'all',   label: 'সব',       icon: Search   },
  { key: 'user',  label: 'মানুষ',     icon: User     },
  { key: 'post',  label: 'পোস্ট',     icon: FileText },
  { key: 'event', label: 'ইভেন্ট',    icon: Calendar },
];

async function searchAll(query) {
  const [users, posts, events] = await Promise.allSettled([
    api.get(`/users/search?q=${encodeURIComponent(query)}&limit=5`),
    api.get(`/posts/search?q=${encodeURIComponent(query)}&limit=5`),
    api.get(`/events/search?q=${encodeURIComponent(query)}&limit=5`),
  ]);

  return {
    user:  users.status  === 'fulfilled' ? (users.value.data?.data  || users.value.data?.users  || []) : [],
    post:  posts.status  === 'fulfilled' ? (posts.value.data?.data  || posts.value.data?.posts  || []) : [],
    event: events.status === 'fulfilled' ? (events.value.data?.data || events.value.data?.events || []) : [],
  };
}

const RESULT_RENDERERS = {
  user: (item, navigate, onClose) => (
    <button
      key={item._id}
      onClick={() => { navigate(`/app/user/${item._id}`); onClose(); }}
      className="group w-full flex items-center justify-between px-4 py-3 hover:bg-primary-50 transition-all duration-200 border-b border-gray-50 last:border-0"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar src={item.profilePicture} name={item.name} className="w-10 h-10 border border-gray-100" />
        <div className="text-left min-w-0">
          <p className="text-small font-semibold text-text-main truncate group-hover:text-primary transition-colors">{item.name}</p>
          <p className="text-[12px] text-text-light truncate">{item.role || 'Member'}</p>
        </div>
      </div>
      <ArrowRight size={14} className="text-text-light opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
    </button>
  ),

  post: (item, navigate, onClose) => (
    <button
      key={item._id}
      onClick={() => { navigate(`/app/post/${item._id}`); onClose(); }}
      className="group w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50 transition-all duration-200 border-b border-gray-50 last:border-0"
    >
      <div className="w-10 h-10 rounded-full bg-secondary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary-100 transition-colors">
        <FileText size={18} className="text-secondary" />
      </div>
      <div className="text-left min-w-0 flex-1">
        <p className="text-small text-text-main truncate font-medium group-hover:text-primary">{item.content}</p>
        <p className="text-[11px] text-text-light flex items-center gap-1">
          <span className="font-semibold text-primary/70">{item.author?.name}</span> • পোস্ট
        </p>
      </div>
    </button>
  ),

  event: (item, navigate, onClose) => (
    <button
      key={item._id}
      onClick={() => { navigate(`/app/events/${item._id}`); onClose(); }}
      className="group w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50 transition-all duration-200 border-b border-gray-50 last:border-0"
    >
      <div className="w-10 h-10 rounded-xl bg-orange-50 flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-orange-100">
        <Calendar size={18} className="text-donate" />
      </div>
      <div className="text-left min-w-0 flex-1">
        <p className="text-small font-semibold text-text-main truncate group-hover:text-primary">{item.title}</p>
        <p className="text-[12px] text-text-light">
          {item.date ? new Date(item.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' }) : 'আপকামিং ইভেন্ট'}
        </p>
      </div>
    </button>
  ),
};

const SECTION_LABELS = {
  user:  'মানুষ',
  post:  'পোস্ট',
  event: 'ইভেন্ট',
};

export default function SearchBar({ onClose }) {
  const navigate  = useNavigate();
  const inputRef  = useRef(null);
  const timerRef  = useRef(null);

  const [query,      setQuery]      = useState('');
  const [activeTab,  setActiveTab]  = useState('all');
  const [results,    setResults]    = useState({ user: [], post: [], event: [] });
  const [loading,    setLoading]    = useState(false);
  const [searched,   setSearched]   = useState(false);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);

    clearTimeout(timerRef.current);
    if (!val.trim()) {
      setResults({ user: [], post: [], event: [] });
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await searchAll(val.trim());
        setResults(data);
        setSearched(true);
      } catch (_) {
      } finally { setLoading(false); }
    }, 400);
  }, []);

  const displayResults = activeTab === 'all' ? results : { [activeTab]: results[activeTab] };
  const totalResults   = Object.values(displayResults).flat().length;
  const hasResults     = totalResults > 0;

  return (
    <div className="relative flex flex-col w-full font-body">
      {/* ── Search Input Box ── */}
      <div className="flex items-center gap-3 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl focus-within:bg-white/20 focus-within:border-white/40 transition-all">
        {loading 
          ? <Loader2 size={20} className="text-white animate-spin flex-shrink-0" />
          : <Search size={20} className="text-white/70 flex-shrink-0" />
        }
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="মানুষ, পোস্ট বা ইভেন্ট খুঁজুন..."
          className="flex-1 bg-transparent text-white placeholder-white/50 text-small outline-none py-2"
        />
        {query && (
            <button onClick={() => {setQuery(''); setSearched(false);}} className="text-white/50 hover:text-white">
                <X size={16} />
            </button>
        )}
      </div>

      {/* ── Search Dropdown ── */}
      {query.trim() && (
        <div className="absolute top-[110%] left-0 right-0 bg-card rounded-card shadow-card-hover border border-gray-100 z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Tabs Navigation */}
          <div className="flex gap-2 px-4 pt-4 pb-2 border-b border-gray-50 overflow-x-auto scrollbar-none">
            {SEARCH_TABS.map((tab) => {
              const count = tab.key === 'all' 
                ? Object.values(results).flat().length 
                : results[tab.key]?.length || 0;
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-btn text-small font-medium transition-all
                    ${isActive 
                      ? 'bg-primary text-white shadow-md' 
                      : 'text-text-secondary hover:bg-gray-100'
                    }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                  {searched && count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                      ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-text-secondary'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Results Area */}
          <div className="overflow-y-auto max-h-[380px] scrollbar-thin scrollbar-thumb-gray-200">
            {loading && !searched && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 size={32} className="animate-spin text-primary" />
                <p className="text-small text-text-light">খোঁজা হচ্ছে...</p>
              </div>
            )}

            {!loading && searched && !hasResults && (
              <div className="text-center py-12">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={24} className="text-text-light" />
                </div>
                <p className="text-body font-semibold text-text-main tracking-tight">কোনো ফলাফল পাওয়া যায়নি</p>
                <p className="text-small text-text-light mt-1">দয়া করে অন্য কিছু লিখে চেষ্টা করুন</p>
              </div>
            )}

            {!loading && hasResults && Object.entries(displayResults).map(([category, items]) => {
              if (!items?.length) return null;
              const renderer = RESULT_RENDERERS[category];

              return (
                <div key={category} className="animate-in fade-in duration-300">
                  {activeTab === 'all' && (
                    <div className="px-4 py-2 bg-bg flex justify-between items-center">
                      <p className="text-[11px] font-bold text-text-light uppercase tracking-widest">
                        {SECTION_LABELS[category]}
                      </p>
                      <span className="text-[10px] text-text-light/60">{items.length} টি রেজাল্ট</span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    {items.map((item) => renderer(item, navigate, onClose))}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Footer Footer */}
          {searched && hasResults && (
             <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
                <p className="text-[10px] text-text-light italic">
                    এন্টার চাপুন সব রেজাল্ট দেখতে
                </p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}