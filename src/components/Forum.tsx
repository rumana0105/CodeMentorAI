import React, { useState, useEffect } from "react";
import { subscribeToForum, createPost, toggleLike, addReply } from "../services/forum";
import { seedCommunityData } from "../services/seedCommunity";
import { useAuth } from "./AuthProvider";
import { ForumPost } from "../types";
import { MessageSquare, Heart, Send, Search, Plus, Users, ChevronRight, Bot, Sparkles, TrendingUp, Flame, Tag, Hash, Clock, Zap } from "lucide-react";
import { generateAIDiscussion } from "../services/gemini";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export default function Forum() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState<ForumPost["category"]>("General");
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const categories = [
    { id: "All", icon: Hash },
    { id: "General", icon: Users },
    { id: "Problems", icon: Flame },
    { id: "Career", icon: TrendingUp },
    { id: "Showcase", icon: Sparkles },
    { id: "Off-topic", icon: MessageSquare }
  ];

  useEffect(() => {
    // Seed initial data if empty
    seedCommunityData();
    
    const unsubscribe = subscribeToForum((newPosts) => {
      setPosts(newPosts);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleCreatePost = async () => {
    if (!user || !newPostTitle.trim() || !newPostContent.trim()) return;
    
    await createPost({
      userId: user.uid,
      authorName: user.displayName || "Anonymous",
      authorPhoto: user.photoURL || "",
      title: newPostTitle,
      content: newPostContent,
      category: newPostCategory,
      tags: [],
      createdAt: new Date().toISOString()
    } as any);

    setNewPostTitle("");
    setNewPostContent("");
    setIsCreating(false);
  };

  const handleGenerateAIDiscussion = async () => {
    setIsGeneratingAI(true);
    try {
      const generated = await generateAIDiscussion();
      await createPost({
        userId: "ai_bot",
        authorName: "CodeMentorAI Bot",
        authorPhoto: "https://api.dicebear.com/7.x/bottts/svg?seed=CodeMentorAI",
        title: generated.title,
        content: generated.content,
        category: generated.category || "General",
        tags: ["AI Generated"],
        createdAt: new Date().toISOString()
      } as any);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const filteredPosts = posts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Neo-Reddit Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-[#020617] p-10 rounded-[2.5rem] border border-[#1E293B] shadow-[0_0_80px_rgba(79,70,229,0.1)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-black uppercase tracking-[0.2em] text-[10px]">
            <Hash size={14} /> Global Developer Network
          </div>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tighter text-white uppercase italic">
            Dev<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-500">_Nexus</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium">Synchronize knowledge, debate architecture, and share insights.</p>
        </div>
        
        <button 
          onClick={() => setIsCreating(true)}
          className="relative z-10 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-95"
        >
          <Plus size={16} />
          Initialize Thread
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Categories (Discord-like channels) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 sticky top-6">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
               <Hash size={12} /> Data_Channels
             </h3>
             <div className="flex flex-col gap-1">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-left group relative",
                      selectedCategory === cat.id 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    {selectedCategory === cat.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-white rounded-r-full" />}
                    <cat.icon size={16} className={selectedCategory === cat.id ? "text-white" : "text-slate-400 group-hover:text-indigo-400"} />
                    {cat.id}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Main Content Area (Reddit-like Feed) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Query discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-[2rem] focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-700 dark:text-white shadow-xl placeholder-slate-400 dark:placeholder-slate-600"
            />
          </div>

          <AnimatePresence>
            {isCreating && (
              <motion.div 
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                className="bg-white dark:bg-[#1E293B] p-8 rounded-[2.5rem] border-2 border-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.15)] space-y-6 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                   <h3 className="font-black uppercase tracking-tight text-xl dark:text-white flex items-center gap-2">
                     <Plus size={20} className="text-indigo-500" /> New Thread
                   </h3>
                   <div className="flex gap-2 flex-wrap justify-end">
                      {categories.filter(c => c.id !== "All").map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setNewPostCategory(c.id as any)}
                          className={cn(
                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                            newPostCategory === c.id ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          )}
                        >
                          {c.id}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-4">
                  <input 
                    type="text"
                    placeholder="Enter Thread Subject..."
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg dark:text-white"
                  />
                  <textarea 
                    placeholder="Provide details for synchronization..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={5}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium text-slate-600 dark:text-slate-300"
                  />
                </div>
                
                <div className="flex justify-end gap-4">
                  <button onClick={() => setIsCreating(false)} className="px-8 py-3 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-700 dark:hover:text-slate-200 transition-colors">Cancel</button>
                  <button 
                    onClick={handleCreatePost}
                    className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] active:scale-95"
                  >
                    Broadcast Post
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white dark:bg-[#0F172A] rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-4 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                      <div className="space-y-2 flex-1">
                        <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded-md" />
                        <div className="w-1/2 h-5 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                      </div>
                    </div>
                    <div className="space-y-2 pt-4">
                      <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-md" />
                      <div className="w-5/6 h-3 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {filteredPosts.map(post => (
                  <PostCard key={post.id} post={post} userId={user?.uid || ""} />
                ))}
                {filteredPosts.length === 0 && (
                  <div className="p-20 text-center bg-white dark:bg-[#0F172A] rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 shadow-xl">
                     <Search size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                     <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No synchronized logs found for this sector.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar: Trending & AI */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-gradient-to-b from-[#0F172A] to-[#1E293B] p-6 rounded-[2rem] text-white border border-slate-800 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Bot size={120} />
             </div>
             <div className="relative z-10 space-y-4">
                <p className="text-[10px] font-black text-fuchsia-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Sparkles size={12} /> AI Moderator
                </p>
                <h4 className="text-lg font-black leading-tight uppercase tracking-tight">Need a discussion starter?</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Our neural network analyzes current trends and can synthesize a relevant thread for community debate.
                </p>
                <button 
                  onClick={handleGenerateAIDiscussion}
                  disabled={isGeneratingAI}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black text-white uppercase tracking-widest transition-all disabled:opacity-50 mt-4"
                >
                  {isGeneratingAI ? (
                    <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                  ) : (
                    <><Zap size={14} className="text-yellow-400" /> Generate AI Thread</>
                  )}
                </button>
             </div>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2 mb-4">
               <TrendingUp size={12} className="text-green-500" /> Trending Topics
             </h3>
             <div className="space-y-4">
                {[
                  { tag: "React19", posts: 42 },
                  { tag: "SystemDesign", posts: 38 },
                  { tag: "LeetcodeDaily", posts: 24 },
                  { tag: "NextjsAppRouter", posts: 19 },
                ].map((trend, i) => (
                  <div key={i} className="flex items-center justify-between group cursor-pointer">
                     <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">#{trend.tag}</span>
                     <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-lg">{trend.posts}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, userId }: { post: ForumPost, userId: string }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const isLiked = post.likes.includes(userId);

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    await addReply(post.id, {
      id: Math.random().toString(36).substr(2, 9),
      userId: userId,
      authorName: "You",
      content: replyContent,
      createdAt: new Date().toISOString()
    } as any);
    setReplyContent("");
    setIsReplying(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-[#0F172A] rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl hover:border-indigo-500/30 transition-colors group relative overflow-hidden"
    >
      {/* Neon thread indicator */}
      <div className="absolute left-0 top-8 bottom-8 w-1 bg-gradient-to-b from-indigo-500/0 via-indigo-500/50 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start gap-4 sm:gap-6">
        <div className="relative shrink-0">
          <img src={post.authorPhoto || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${post.authorName}`} className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" referrerPolicy="no-referrer" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-[#0F172A] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]" title="Node Online" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
            <div className="space-y-1 truncate">
               <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                    post.category === "General" ? "bg-blue-500/10 text-blue-500" :
                    post.category === "Problems" ? "bg-red-500/10 text-red-500" :
                    post.category === "Career" ? "bg-green-500/10 text-green-500" :
                    "bg-fuchsia-500/10 text-fuchsia-500"
                  )}>{post.category || "General"}</span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">@{post.authorName}</span>
               </div>
               <h4 className="font-black text-lg sm:text-xl text-slate-800 dark:text-white group-hover:text-indigo-500 transition-colors tracking-tight truncate">{post.title}</h4>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 shrink-0">
              <Clock size={12} /> {new Date(post.createdAt).toLocaleDateString()}
            </div>
          </div>
          
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-medium mb-4 whitespace-pre-wrap">{post.content}</p>
          
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-2 py-1 rounded-lg">
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => toggleLike(post.id, userId, isLiked)}
                className={cn(
                  "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all px-3 py-1.5 rounded-xl border", 
                  isLiked 
                    ? "bg-pink-500/10 text-pink-500 border-pink-500/20" 
                    : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:text-pink-500"
                )}
              >
                <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
                <span>{post.likes.length}</span> <span className="hidden sm:inline">Likes</span>
              </button>
              <button 
                onClick={() => setIsReplying(!isReplying)}
                className={cn(
                  "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all px-3 py-1.5 rounded-xl border",
                  isReplying
                    ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:text-indigo-500"
                )}
              >
                <MessageSquare size={14} />
                <span>{post.replies.length}</span> <span className="hidden sm:inline">Replies</span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isReplying && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-6 space-y-4 overflow-hidden"
              >
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar border-l-2 border-indigo-500/20 pl-4 ml-2">
                  {post.replies.map(reply => (
                    <div key={reply.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">@{reply.authorName}</span>
                        <span className="font-mono text-[9px] text-slate-400">{new Date(reply.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{reply.content}</p>
                    </div>
                  ))}
                  {post.replies.length === 0 && (
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">Be the first to reply...</p>
                  )}
                </div>
                <div className="flex gap-3 mt-4 relative">
                  <input 
                    type="text"
                    placeholder="Type your reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm outline-none font-medium dark:text-white focus:border-indigo-500 transition-colors"
                  />
                  <button onClick={handleReply} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 active:scale-95">
                    <Send size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
