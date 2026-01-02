
import React, { useState, useEffect } from 'react';
import { UserPlus, MessageCircle, Wifi, WifiOff, Play, Search, UserCheck, MoreVertical, MoreHorizontal, Loader2, Check } from 'lucide-react';
import { Friend, AppView } from '../types';
import { db } from '../services/database';

interface FriendsHubProps {
  onChatWithFriend: (friend: Friend) => void;
}

const FriendsHub: React.FC<FriendsHubProps> = ({ onChatWithFriend }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addName, setAddName] = useState('');

  useEffect(() => {
    db.getFriends().then(data => {
      setFriends(data);
      setIsLoading(false);
    });
  }, []);

  const handleAddFriend = async () => {
    if (!addName.trim()) return;
    setIsAdding(true);
    const newFriend = await db.addFriend(addName);
    if (newFriend) {
      setFriends(prev => [...prev, newFriend]);
      setAddName('');
    }
    setIsAdding(false);
  };

  const filtered = friends.filter(f => f.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">Maker Network</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Vernetze dich mit anderen PrintVerse-Pionieren</p>
        </div>
        <div className="flex gap-4">
          <div className="glass px-6 py-2 rounded-2xl flex items-center gap-3 border-white/5">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-black uppercase text-slate-400 italic">42 Maker Online</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <div className="glass p-2 rounded-3xl border-white/5 flex items-center gap-4">
          <div className="pl-4 text-slate-500"><Search size={18} /></div>
          <input 
            type="text" 
            placeholder="Deine Freunde durchsuchen..." 
            className="flex-1 bg-transparent border-none outline-none py-2 text-sm font-medium"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="glass p-2 rounded-3xl border-white/10 flex items-center gap-2 bg-blue-600/5">
          <input 
            type="text" 
            placeholder="Username zum Hinzufügen..." 
            className="flex-1 bg-transparent border-none outline-none py-2 px-4 text-sm font-black italic uppercase placeholder:text-blue-900/50"
            value={addName}
            onChange={e => setAddName(e.target.value)}
          />
          <button 
            onClick={handleAddFriend}
            disabled={isAdding || !addName.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2 rounded-2xl text-[10px] font-black italic transition-all flex items-center gap-2"
          >
            {isAdding ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            ADD MAKER
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="glass h-64 rounded-[40px] animate-pulse" />)
        ) : (
          filtered.map(friend => (
            <div key={friend.id} className="glass rounded-[40px] p-8 border-white/5 hover:border-blue-500/20 transition-all group flex flex-col justify-between h-full bg-slate-900/30">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="relative">
                    <img src={friend.avatar} className="w-20 h-20 rounded-3xl object-cover border-2 border-white/5" />
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-slate-900 flex items-center justify-center ${
                      friend.status === 'printing' ? 'bg-orange-500' : friend.status === 'online' ? 'bg-green-500' : 'bg-slate-700'
                    }`}>
                      {friend.status === 'printing' ? <Play size={10} className="text-white fill-current" /> : null}
                    </div>
                  </div>
                  <button className="text-slate-600 hover:text-white transition-colors"><MoreHorizontal size={20} /></button>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">{friend.username}</h3>
                    {friend.isPro && <span className="bg-blue-600/20 text-blue-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase italic">Pro</span>}
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Seit {friend.joinedDate}</p>
                </div>

                {friend.status === 'printing' ? (
                  <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                      <Wifi size={18} className="text-orange-500 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest italic">AKTIVER DRUCK</p>
                       <p className="text-[11px] font-bold text-white italic truncate">{friend.currentPrint}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 opacity-50">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                      <WifiOff size={18} className="text-slate-600" />
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">DRUCKER STANDBY</p>
                       <p className="text-[11px] font-bold text-slate-400 italic uppercase">System Offline</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => onChatWithFriend(friend)}
                  className="flex-1 bg-white/5 hover:bg-blue-600 text-slate-300 hover:text-white py-4 rounded-2xl text-[10px] font-black uppercase italic transition-all border border-white/5 flex items-center justify-center gap-2"
                >
                  <MessageCircle size={16} /> Nachricht
                </button>
                <button className="p-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl transition-all border border-white/5">
                  <UserCheck size={18} className={friend.isFollowing ? 'text-blue-500' : ''} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FriendsHub;
