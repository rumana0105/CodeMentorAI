import React, { useState, useEffect } from "react";
import { subscribeToForum, createPost, toggleLike, addReply } from "../services/forum";
import { useAuth } from "./AuthProvider";
import { ForumPost } from "../types";
import { MessageSquare, Heart, Send, User, Search, Plus, Users, ChevronRight, Bot } from "lucide-react";
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

  const categories = ["All", "General", "Problems", "Career", "Showcase", "Off-topic"];

  useEffect(() => {
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

  const FORUM_COLLECTION = "community";
  const filteredPosts = posts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#4F46E5] font-black uppercase tracking-[0.2em] text-[10px]">
            <Users size={14} /> Shared Intelligence
          </div>
          <h2 className="text-4xl font-black tracking-tight text-[#1A1A1A] uppercase">Community_Portal</h2>
          <p className="text-[#6B7280] font-serif italic">The global node for developer knowledge synchronization.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center justify-center gap-2 bg-[#4F46E5] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#4338CA] transition-all shadow-xl shadow-indigo-100 hover:-translate-y-1"
        >
          <Plus size={18} />
          Initialize Discourse
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Categories */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-[#E5E7EB] shadow-sm space-y-4">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">Sub_Sectors</h3>
             <div className="flex flex-col gap-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-sm",
                      selectedCategory === cat 
                        ? "bg-[#4F46E5] text-white shadow-lg shadow-indigo-100" 
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {cat}
                    <ChevronRight size={14} className={selectedCategory === cat ? "opacity-100" : "opacity-0"} />
                  </button>
                ))}
             </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2rem] text-white relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <Bot size={80} />
             </div>
             <div className="relative z-10 space-y-4">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">AI Insights</p>
                <h4 className="text-lg font-bold leading-tight uppercase">Analyze trending topics?</h4>
                <p className="text-xs text-slate-400 font-serif italic">Our neural network flags "Dynamic Programming" as this week's most discussed vector.</p>
                <button className="text-[10px] font-black text-white uppercase tracking-widest border-b border-white/20 pb-1 hover:border-primary transition-all">Enable Analytics</button>
             </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#4F46E5] transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Query the database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-white border border-[#E5E7EB] rounded-[2rem] focus:ring-4 focus:ring-[#4F46E5]/10 transition-all outline-none font-bold text-slate-700 shadow-sm"
            />
          </div>

          <AnimatePresence>
            {isCreating && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-8 rounded-[2.5rem] border-2 border-[#4F46E5] shadow-2xl space-y-6"
              >
                <div className="flex items-center justify-between">
                   <h3 className="font-black uppercase tracking-tight text-xl">New_Discourse_Initialiation</h3>
                   <div className="flex gap-2">
                      {["General", "Problems", "Career", "Showcase", "Off-topic"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setNewPostCategory(c as any)}
                          className={cn(
                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                            newPostCategory === c ? "bg-[#4F46E5] text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          )}
                        >
                          {c}
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
                    className="w-full px-6 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#4F46E5] outline-none font-bold text-lg"
                  />
                  <textarea 
                    placeholder="Provide details for synchronization..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={6}
                    className="w-full px-6 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#4F46E5] outline-none resize-none font-serif text-slate-600 italic"
                  />
                </div>
                
                <div className="flex justify-end gap-4">
                  <button onClick={() => setIsCreating(false)} className="px-8 py-3 text-[#6B7280] font-black uppercase tracking-widest text-[10px]">Decline</button>
                  <button 
                    onClick={handleCreatePost}
                    className="bg-[#4F46E5] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#4338CA] transition-all glow-primary"
                  >
                    Broadcast Post
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            {isLoading ? (
              <>
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-[2rem] border border-[#E5E7EB] p-8 shadow-sm space-y-4 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-200 rounded-[1.5rem]" />
                      <div className="space-y-2 flex-1">
                        <div className="w-24 h-4 bg-slate-200 rounded-md" />
                        <div className="w-1/2 h-6 bg-slate-200 rounded-lg" />
                      </div>
                    </div>
                    <div className="space-y-2 pt-4 border-t border-slate-50">
                      <div className="w-full h-4 bg-slate-200 rounded-md" />
                      <div className="w-5/6 h-4 bg-slate-200 rounded-md" />
                      <div className="w-4/6 h-4 bg-slate-200 rounded-md" />
                    </div>
                    <div className="flex gap-4 pt-4 border-t border-slate-50">
                      <div className="w-20 h-6 bg-slate-200 rounded-md" />
                      <div className="w-20 h-6 bg-slate-200 rounded-md" />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {filteredPosts.map(post => (
                  <PostCard key={post.id} post={post} userId={user?.uid || ""} />
                ))}
                {filteredPosts.length === 0 && (
                  <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                     <p className="text-slate-400 italic font-serif">No synchronized logs found for this sector. Try modifying your query.</p>
                  </div>
                )}
              </>
            )}
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
      className="bg-white rounded-[2rem] border border-[#E5E7EB] p-8 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group"
    >
      <div className="flex items-start gap-6">
        <div className="relative shrink-0">
          <img src={post.authorPhoto || `https://picsum.photos/seed/${post.authorId}/100/100`} className="w-16 h-16 rounded-[1.5rem] object-cover grayscale group-hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full" title="Node Online" />
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-md">{post.category || "General"}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{post.authorName}</span>
               </div>
               <h4 className="font-black text-xl text-slate-800 group-hover:text-primary transition-colors tracking-tight">{post.title}</h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-bold">{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
          
          <p className="text-slate-600 text-sm leading-relaxed font-serif italic">{post.content}</p>
          
          <div className="flex items-center justify-between pt-6 border-t border-slate-50 group-hover:border-primary/5 transition-colors">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => toggleLike(post.id, userId, isLiked)}
                className={cn(
                  "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all", 
                  isLiked ? "text-pink-500" : "text-slate-400 hover:text-pink-500"
                )}
              >
                <div className={cn("p-2 rounded-xl transition-all", isLiked ? "bg-pink-50" : "bg-slate-50")}>
                   <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                </div>
                {post.likes.length} Appreciations
              </button>
              <button 
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all"
              >
                <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-primary/5 transition-all">
                  <MessageSquare size={16} />
                </div>
                {post.replies.length} Exchanges
              </button>
            </div>
            
            <div className="flex items-center gap-1">
               {[1,2,3].map(i => (
                 <div key={i} className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
               ))}
            </div>
          </div>

          <AnimatePresence>
            {isReplying && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-6 space-y-6 overflow-hidden"
              >
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {post.replies.map(reply => (
                    <div key={reply.id} className="bg-[#F9FAFB] p-4 rounded-2xl border border-[#E5E7EB] group/reply">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{reply.authorName}</span>
                        <span className="font-mono text-[9px] text-[#9CA3AF]">{new Date(reply.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-[#6B7280] font-serif italic leading-relaxed">{reply.content}</p>
                    </div>
                  ))}
                  {post.replies.length === 0 && (
                    <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest py-4">Awaiting Signal Interface...</p>
                  )}
                </div>
                <div className="flex gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <input 
                    type="text"
                    placeholder="Input synchronization reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="flex-1 bg-transparent border-none rounded-xl px-4 py-2 text-xs outline-none font-bold"
                  />
                  <button onClick={handleReply} className="bg-[#4F46E5] text-white p-3 rounded-xl hover:bg-[#4338CA] transition-all shadow-lg shadow-indigo-100">
                    <Send size={16} />
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
