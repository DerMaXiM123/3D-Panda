
import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Image as ImageIcon, X, Loader2, Camera, RefreshCw } from 'lucide-react';
import { Post, User } from '../types';
import { db } from '../services/database';

interface CommunityHubProps {
  user: User;
}

const CommunityHub: React.FC<CommunityHubProps> = ({ user }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.getPosts().then(data => {
      setPosts(data);
      setIsLoading(false);
    });
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsOptimizing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await db.compressImage(reader.result as string, 800, 0.7);
        setNewImage(compressed);
        setIsOptimizing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async () => {
    if (!newCaption.trim()) return;
    
    const post = await db.createPost({
      user: user.username,
      avatar: user.avatar,
      image: newImage || 'https://picsum.photos/seed/default/600/600',
      caption: newCaption
    });

    setPosts([post, ...posts]);
    setNewCaption('');
    setNewImage(null);
    setIsPosting(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
           <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">Community Hub</h1>
           <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Zeig der Welt deine Kreationen</p>
        </div>
        <button 
          onClick={() => setIsPosting(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black italic transition-all shadow-xl shadow-blue-900/20 uppercase tracking-widest"
        >
          POST ERSTELLEN
        </button>
      </header>

      {isPosting && (
        <div className="glass bg-slate-900/80 border-2 border-blue-500/30 rounded-[40px] p-8 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] text-blue-400 italic">Neuer Showcase</h3>
            <button onClick={() => setIsPosting(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div 
               onClick={() => !isOptimizing && fileInputRef.current?.click()}
               className={`aspect-square bg-black/40 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-500/50 transition-all group overflow-hidden relative ${isOptimizing ? 'cursor-wait' : ''}`}
             >
                {newImage ? (
                  <>
                    <img src={newImage} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                       <RefreshCw className="text-white" />
                    </div>
                  </>
                ) : isOptimizing ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <span className="text-[9px] font-black uppercase text-blue-400 italic tracking-widest">Optimiere...</span>
                  </div>
                ) : (
                  <>
                    <Camera size={32} className="text-slate-600 group-hover:text-blue-500" />
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Bild hochladen</span>
                  </>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
             </div>
             
             <div className="flex flex-col justify-between">
                <textarea 
                  placeholder="Beschreibe deinen Druck (Slicer-Settings, Material, Dauer...)" 
                  className="w-full bg-black/20 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-blue-500 h-48 resize-none font-medium italic"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                />
                <button 
                  onClick={handleCreatePost}
                  disabled={!newCaption.trim() || isOptimizing}
                  className="bg-white text-black w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl disabled:opacity-30 mt-4"
                >
                  {isOptimizing ? 'Verarbeitung...' : 'Veröffentlichen'}
                </button>
             </div>
          </div>
        </div>
      )}

      <div className="space-y-10">
        {isLoading ? (
           <div className="flex flex-col items-center py-20 gap-4">
              <Loader2 className="animate-spin text-blue-500" size={40} />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lade Feed...</p>
           </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 glass rounded-[48px] border-dashed border-white/10">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">Noch keine Beiträge vorhanden. Sei der Erste!</p>
          </div>
        ) : posts.map(post => (
          <article key={post.id} className="glass bg-slate-900/40 border border-white/5 rounded-[48px] overflow-hidden shadow-2xl transition-all hover:border-white/10 group">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={post.avatar} alt={post.user} className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
                <div>
                  <h4 className="font-black italic text-white tracking-tighter uppercase">{post.user}</h4>
                  <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold">{post.timestamp}</p>
                </div>
              </div>
              <button className="text-slate-600 hover:text-white"><MoreHorizontal size={24} /></button>
            </div>

            <div className="aspect-square relative overflow-hidden bg-slate-800">
              <img src={post.image} alt="Post Content" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center gap-8">
                <button className="text-slate-500 hover:text-red-500 transition-colors flex items-center gap-3">
                  <Heart size={24} className={post.likes > 0 ? 'fill-red-500 text-red-500' : ''} />
                  <span className="text-[11px] font-black tracking-widest">{post.likes}</span>
                </button>
                <button className="text-slate-500 hover:text-blue-500 transition-colors flex items-center gap-3">
                  <MessageCircle size={24} />
                  <span className="text-[11px] font-black tracking-widest">{post.comments}</span>
                </button>
                <button className="text-slate-500 hover:text-white ml-auto"><Share2 size={22} /></button>
              </div>

              <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <p className="text-sm leading-relaxed text-slate-300 font-medium italic">
                  <span className="font-black text-blue-500 mr-3 not-italic">@{post.user.toUpperCase()}</span>
                  {post.caption}
                </p>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <img src={user.avatar} className="w-8 h-8 rounded-xl object-cover" />
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder="Schreibe einen Kommentar..." 
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-5 text-[11px] outline-none focus:border-blue-500/50 transition-all italic font-bold placeholder:text-slate-700"
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 hover:scale-110 transition-transform"><Send size={16} /></button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default CommunityHub;
