
import React, { useEffect, useRef, useState } from 'react';
import { Camera, Radio, MessageSquare, Play, Users, StopCircle, Loader2, Monitor, Send, Zap, X, Mic, MicOff } from 'lucide-react';
import { db } from '../services/database';
import { User, Broadcast, WebRTCSignal } from '../types';

interface LiveWorkshopProps {
  user: User;
}

interface ChatMessage {
  id: string;
  sender: string;
  senderId: string;
  text: string;
  timestamp: number;
  isBroadcaster: boolean;
  streamId: string;
}

const LiveWorkshop: React.FC<LiveWorkshopProps> = ({ user }) => {
  const [activeBroadcasts, setActiveBroadcasts] = useState<Broadcast[]>([]);
  const [currentBroadcast, setCurrentBroadcast] = useState<Broadcast | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [streamTitle, setStreamTitle] = useState(`${user.username}'s Workshop`);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [streamSource, setStreamSource] = useState<'camera' | 'screen'>('camera');
  const [isMuted, setIsMuted] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());

  useEffect(() => {
    const interval = setInterval(() => {
      db.getActiveBroadcasts().then(setActiveBroadcasts);
      handleIncomingSignals();
    }, 1000);
    return () => {
      clearInterval(interval);
      stopAll();
    };
  }, [isBroadcasting, isWatching, currentBroadcast]);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
      // Broadcaster hört sich nicht selbst (muted={true} im JSX), 
      // Zuschauer hört den Broadcaster (muted={false} im JSX)
      videoRef.current.play().catch(e => console.error("Video Play Error:", e));
    }
  }, [localStream, isBroadcasting, isWatching]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const stopAll = () => {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
  };

  const handleIncomingSignals = async () => {
    const signals = await db.getSignalsFor(user.id);
    if (signals.length === 0) return;

    for (const signal of signals) {
      if (signal.type === 'chat' as any) {
        const msg = signal.data as ChatMessage;
        if (msg.streamId === (currentBroadcast?.id || `bc_${user.id}`)) {
          setChatMessages(prev => [...prev, msg]);
        }
        continue;
      }

      let pc = peerConnections.current.get(signal.from);

      try {
        if (signal.type === 'offer') {
          pc = initPeerConnection(signal.from);
          await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await db.sendSignal({
            id: `sig_${Date.now()}_ans`,
            from: user.id,
            to: signal.from,
            type: 'answer',
            data: answer,
            timestamp: Date.now()
          });
        } else if (signal.type === 'answer' && pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
          setConnectionStatus('Verbunden');
        } else if (signal.type === 'ice-candidate' && pc) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.data));
        }
      } catch (err) {
        console.error("WebRTC Error:", err);
      }
    }
  };

  const initPeerConnection = (targetId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        db.sendSignal({
          id: `ice_${Date.now()}_${Math.random()}`,
          from: user.id,
          to: targetId,
          type: 'ice-candidate',
          data: event.candidate,
          timestamp: Date.now()
        });
      }
    };

    pc.ontrack = (event) => {
      if (isWatching) {
        // Hier kommt der Stream beim Zuschauer an (Video + Audio)
        setLocalStream(event.streams[0]);
        setConnectionStatus('Verbunden');
      }
    };

    if (isBroadcasting && localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    peerConnections.current.set(targetId, pc);
    return pc;
  };

  const startBroadcasting = async () => {
    try {
      // WICHTIG: Explizite Audio-Anforderung
      const stream = streamSource === 'camera' 
        ? await navigator.mediaDevices.getUserMedia({ 
            video: { width: 1280, height: 720 }, 
            audio: { echoCancellation: true, noiseSuppression: true } 
          })
        : await navigator.mediaDevices.getDisplayMedia({ 
            video: true, 
            audio: true // System-Audio mitsenden
          });

      setLocalStream(stream);
      stream.getVideoTracks()[0].onended = () => stopBroadcasting();

      const bcId = `bc_${user.id}`;
      const broadcast: Broadcast = {
        id: bcId,
        userId: user.id,
        username: user.username,
        startTime: new Date().toISOString(),
        title: streamTitle
      };

      await db.startBroadcast(broadcast);
      setIsBroadcasting(true);
      setCurrentBroadcast(broadcast);
      setChatMessages([{ id: 'sys', sender: 'SYSTEM', senderId: '0', text: 'Live Feed aktiv (Audio & Video)', timestamp: Date.now(), isBroadcaster: true, streamId: bcId }]);
    } catch (err) {
      alert("Fehler: Kamera-/Mikrofon-Berechtigung fehlt.");
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const stopBroadcasting = async () => {
    if (currentBroadcast) await db.stopBroadcast(currentBroadcast.id);
    stopAll();
    setIsBroadcasting(false);
    setCurrentBroadcast(null);
    setChatMessages([]);
  };

  const watchStream = async (broadcast: Broadcast) => {
    if (broadcast.userId === user.id) return;
    stopAll();
    setChatMessages([]);
    setConnectionStatus('Initialisiere Handshake...');
    setIsWatching(true);
    setCurrentBroadcast(broadcast);
    
    const pc = initPeerConnection(broadcast.userId);
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);
    await db.sendSignal({
      id: `sig_${Date.now()}_off`,
      from: user.id,
      to: broadcast.userId,
      type: 'offer',
      data: offer,
      timestamp: Date.now()
    });
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !currentBroadcast) return;
    
    const msg: ChatMessage = {
      id: `chat_${Date.now()}`,
      sender: user.username,
      senderId: user.id,
      text: chatInput,
      timestamp: Date.now(),
      isBroadcaster: isBroadcasting,
      streamId: currentBroadcast.id
    };

    if (isWatching) {
      await db.sendSignal({ id: msg.id, from: user.id, to: currentBroadcast.userId, type: 'chat' as any, data: msg, timestamp: Date.now() });
    } else if (isBroadcasting) {
      peerConnections.current.forEach(async (pc, watcherId) => {
        await db.sendSignal({ id: `${msg.id}_${watcherId}`, from: user.id, to: watcherId, type: 'chat' as any, data: msg, timestamp: Date.now() });
      });
    }

    setChatMessages(prev => [...prev, msg]);
    setChatInput('');
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-700 min-h-0 h-full">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <Radio size={20} className={isBroadcasting ? "text-red-500 animate-pulse" : "text-blue-500"} />
           </div>
           <div>
              <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none">
                {isBroadcasting ? 'Broadcasting Hub' : isWatching ? 'Watching Stream' : 'Workshop Center'}
              </h1>
              <p className="text-slate-500 font-bold uppercase text-[8px] tracking-widest mt-1 italic leading-none">P2P Multi-Link Mesh</p>
           </div>
        </div>

        {!isBroadcasting && !isWatching && (
          <div className="flex flex-wrap gap-3 items-center">
             <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button onClick={() => setStreamSource('camera')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase italic transition-all ${streamSource === 'camera' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Cam</button>
                <button onClick={() => setStreamSource('screen')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase italic transition-all ${streamSource === 'screen' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Screen</button>
             </div>
             <input type="text" value={streamTitle} onChange={(e) => setStreamTitle(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-black italic uppercase outline-none focus:border-blue-500 text-white w-40" />
             <button onClick={startBroadcasting} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-black italic transition-all shadow-xl uppercase tracking-widest flex items-center gap-2 text-[10px]"><Zap size={14} /> GO LIVE</button>
          </div>
        )}

        {(isBroadcasting || isWatching) && (
          <div className="flex items-center gap-3">
            {isBroadcasting && (
              <button onClick={toggleMute} className={`p-2 rounded-xl border transition-all ${isMuted ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-blue-600/10 border-blue-500/30 text-blue-500'}`}>
                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}
            <div className="glass px-4 py-2 rounded-xl border-white/10 flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[9px] font-black uppercase text-slate-300 italic">{isBroadcasting ? `${peerConnections.current.size} Viewer` : 'Link Stable'}</span>
            </div>
            <button onClick={isBroadcasting ? stopBroadcasting : () => { stopAll(); setIsWatching(false); setCurrentBroadcast(null); }} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-black italic transition-all shadow-xl uppercase tracking-widest flex items-center gap-2 text-[10px]"><StopCircle size={14} /> STOP</button>
          </div>
        )}
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 pb-4 overflow-hidden">
        {/* Main Feed Section */}
        <div className="lg:col-span-8 flex flex-col min-h-0 h-full">
           <div className="relative flex-1 glass rounded-[40px] overflow-hidden border-2 border-white/5 bg-black/90 group shadow-2xl">
              {(isBroadcasting || isWatching) ? (
                /* WICHTIG: Broadcaster ist lokal stumm, damit es kein Echo gibt. Watcher hört alles! */
                <video ref={videoRef} autoPlay muted={isBroadcasting} playsInline className="w-full h-full object-contain" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center opacity-40">
                   <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                      <Monitor size={48} className="text-slate-700" />
                   </div>
                   <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-2">No Active Selection</h2>
                   <p className="text-slate-500 font-bold text-[9px] uppercase tracking-[0.3em] max-w-sm italic leading-relaxed">Wähle einen Feed aus der Discovery-Liste oder starte eine Übertragung.</p>
                </div>
              )}

              {isWatching && connectionStatus !== 'Verbunden' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-10">
                   <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                   <p className="text-white font-black italic uppercase tracking-widest text-[10px]">{connectionStatus}</p>
                </div>
              )}

              {isBroadcasting && (
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                   <div className="bg-red-600 px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl border border-white/20">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                      <span className="text-[9px] font-black uppercase text-white italic tracking-widest leading-none">LIVE</span>
                   </div>
                   {!isMuted && (
                     <div className="bg-blue-600/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 w-max border border-white/10">
                        <div className="w-1 h-3 bg-white/40 rounded-full overflow-hidden relative">
                           <div className="absolute bottom-0 left-0 right-0 bg-white animate-[mic_1s_infinite_alternate]" />
                        </div>
                        <style>{` @keyframes mic { from { height: 10% } to { height: 90% } } `}</style>
                        <span className="text-[7px] font-black text-white uppercase">Audio ON</span>
                     </div>
                   )}
                </div>
              )}
              
              {currentBroadcast && (
                <div className="absolute bottom-6 left-6 p-6 glass rounded-3xl border-white/10 animate-in slide-in-from-bottom-4">
                   <h3 className="text-lg font-black italic text-white uppercase leading-none">{currentBroadcast.title}</h3>
                   <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mt-1.5 opacity-60">OWNER: {currentBroadcast.username}</p>
                </div>
              )}
           </div>
        </div>

        {/* Chat & Active List Section */}
        <div className="lg:col-span-4 flex flex-col h-full gap-6 min-h-0">
           {/* Chat Module */}
           <div className="flex-1 glass rounded-[40px] border-white/5 bg-slate-900/40 flex flex-col overflow-hidden shadow-xl min-h-0">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                 <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic flex items-center gap-2 leading-none">
                    <MessageSquare size={14} className="text-blue-500" /> Live Chat
                 </h3>
                 {currentBroadcast && <span className="bg-emerald-600/20 text-emerald-500 px-3 py-1 rounded-full text-[7px] font-black uppercase italic">Channel Active</span>}
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                 {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-10 italic">
                       <p className="text-[8px] font-black uppercase tracking-widest">Warte auf Nachrichten...</p>
                    </div>
                 ) : chatMessages.map(msg => (
                    <div key={msg.id} className={`space-y-1 animate-in slide-in-from-left-2 duration-300 ${msg.senderId === user.id ? 'opacity-80' : ''}`}>
                       <span className={`text-[8px] font-black uppercase italic leading-none ${msg.isBroadcaster ? 'text-red-500' : msg.senderId === user.id ? 'text-white' : 'text-blue-500'}`}>
                          {msg.sender} {msg.isBroadcaster && '• HOST'}
                       </span>
                       <p className="text-[11px] text-slate-300 font-medium italic bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                          {msg.text}
                       </p>
                    </div>
                 ))}
                 <div ref={chatEndRef} />
              </div>

              <div className="p-4 bg-black/40 border-t border-white/5">
                 <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1.5 focus-within:bg-white/10 transition-all border border-transparent focus-within:border-blue-500/20">
                    <input 
                      type="text" 
                      value={chatInput}
                      disabled={!currentBroadcast}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                      placeholder={currentBroadcast ? "Nachricht..." : "Join a Feed..."} 
                      className="flex-1 bg-transparent border-none outline-none py-1.5 px-3 text-xs font-bold italic placeholder:text-slate-700"
                    />
                    <button onClick={sendChatMessage} className="p-2.5 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-all disabled:opacity-20"><Send size={14}/></button>
                 </div>
              </div>
           </div>

           {/* Active Feeds Side */}
           <div className="h-48 glass rounded-[40px] p-6 border-white/5 bg-slate-900/40 flex flex-col overflow-hidden shadow-xl shrink-0">
              <h3 className="text-[9px] font-black uppercase text-slate-500 tracking-widest italic mb-4 leading-none">Feed Discovery</h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                 {activeBroadcasts.length === 0 ? (
                   <p className="text-[8px] font-black text-slate-700 uppercase text-center mt-6 tracking-widest italic">Keine Maker online</p>
                 ) : activeBroadcasts.map(bc => (
                   <button 
                     key={bc.id}
                     onClick={() => watchStream(bc)}
                     className={`w-full text-left p-3 rounded-2xl border transition-all relative group overflow-hidden ${currentBroadcast?.id === bc.id ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-transparent hover:border-white/10'}`}
                   >
                      <div className="relative z-10 flex items-center justify-between">
                         <div className="min-w-0">
                            <p className="text-[10px] font-black italic uppercase truncate text-white">{bc.title}</p>
                            <p className="text-[8px] font-bold text-slate-500 uppercase italic tracking-tighter mt-0.5">{bc.username}</p>
                         </div>
                         {bc.userId === user.id && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[6px] font-black uppercase">YOU</span>}
                      </div>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LiveWorkshop;
