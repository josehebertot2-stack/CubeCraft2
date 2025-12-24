
import React, { useState, useEffect, useRef } from 'react';
import { GameState, World } from './types';
import { INITIAL_WORLDS, BLOCKS } from './constants';
import VoxelWorld from './components/VoxelWorld';
import { geminiLive } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [worlds, setWorlds] = useState<World[]>(INITIAL_WORLDS);
  const [activeSlot, setActiveSlot] = useState(2);
  const [aiTranscription, setAiTranscription] = useState('');
  const [isAiConnected, setIsAiConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  
  // Enhanced Settings State
  const [sensitivity, setSensitivity] = useState(0.8);
  const [volume, setVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.7);
  const [fov, setFov] = useState(75);
  const [renderDistance, setRenderDistance] = useState(60);
  const [invertY, setInvertY] = useState(false);
  const [autoJump, setAutoJump] = useState(true);
  const [showFPS, setShowFPS] = useState(false);
  const [aiVoice, setAiVoice] = useState('Zephyr');

  // Mobile Controls State
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMove, setMobileMove] = useState({ x: 0, z: 0 });
  const [mobileJump, setMobileJump] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeBlock = BLOCKS[activeSlot]?.id || 'stone';

  useEffect(() => {
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  const createNewWorld = () => {
    const newWorld: World = {
      id: String(Date.now()),
      name: `Novo Mundo #${worlds.length + 1}`,
      seed: Math.random().toString(36).substring(7),
      type: 'standard',
      difficulty: 'normal',
      lastPlayed: new Date().toLocaleDateString('pt-BR'),
      thumbnail: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=300&h=200'
    };
    setWorlds([...worlds, newWorld]);
    if (!isMusicPlaying) toggleMusic();
  };

  const loadWorld = (world: World) => {
    setGameState(GameState.PLAYING);
    if (!isMusicPlaying) toggleMusic();
  };

  const handleConnectAi = async () => {
    setIsConnecting(true);
    try {
      await geminiLive.connect((text) => setAiTranscription(text), aiVoice);
      setIsAiConnected(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleJoystick = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = (touch.clientX - centerX) / (rect.width / 2);
    const dy = (touch.clientY - centerY) / (rect.height / 2);
    const mag = Math.sqrt(dx*dx + dy*dy);
    const scale = mag > 1 ? 1/mag : 1;
    setMobileMove({ x: dx * scale, z: dy * scale });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white font-display select-none touch-none">
      <audio 
        ref={audioRef} 
        loop 
        src="https://www.chosic.com/wp-content/uploads/2021/07/Rainy-Day-Games-The-Lofi-Piano.mp3" 
      />

      {/* MENU PRINCIPAL */}
      {gameState === GameState.MENU && (
        <div className="relative h-full flex flex-col p-6 md:p-20 overflow-y-auto">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{backgroundImage: `url('https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop')`}}></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/40 to-primary/10"></div>
          </div>

          <header className="relative z-10 flex justify-between items-center mb-12">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-black shadow-[0_0_20px_rgba(19,236,55,0.4)]">
                <span className="material-symbols-outlined font-bold">view_in_ar</span>
              </div>
              <h1 className="text-2xl font-black tracking-tighter uppercase">CUBECRAFT</h1>
            </div>
            <button 
              onClick={toggleMusic} 
              className={`hud-glass size-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${isMusicPlaying ? 'border-primary/50' : ''}`}
            >
              <span className={`material-symbols-outlined ${isMusicPlaying ? 'text-primary animate-pulse' : 'text-white/40'}`}>
                {isMusicPlaying ? 'music_note' : 'music_off'}
              </span>
            </button>
          </header>

          <main className="relative z-10 max-w-2xl mb-auto">
            <h2 className="text-7xl md:text-[140px] font-black leading-none tracking-tighter mb-8 uppercase animate-fade-in">
              CRAFT<br/><span className="text-primary drop-shadow-[0_0_30px_rgba(19,236,55,0.3)]">YOUR</span><br/>WORLD
            </h2>
            <nav className="flex flex-col gap-4 w-full max-w-sm">
              <button onClick={() => setGameState(GameState.WORLD_SELECT)} className="bg-primary hover:bg-primary-dark p-6 rounded-2xl text-black font-black text-2xl transition-all shadow-2xl shadow-primary/20 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3">
                <span className="material-symbols-outlined">play_circle</span>
                JOGAR AGORA
              </button>
              <button onClick={() => setGameState(GameState.SETTINGS)} className="bg-white/5 hover:bg-white/10 p-5 rounded-2xl font-bold border border-white/5 transition-all flex justify-between items-center group">
                <span className="flex items-center gap-3"><span className="material-symbols-outlined opacity-60">settings</span> CONFIGURAÇÕES</span>
                <span className="material-symbols-outlined opacity-40 group-hover:rotate-90 transition-transform">chevron_right</span>
              </button>
            </nav>
          </main>
        </div>
      )}

      {/* CONFIGURAÇÕES EXPANDIDAS */}
      {gameState === GameState.SETTINGS && (
        <div className="relative z-20 h-full flex flex-col bg-bg-main overflow-hidden animate-fade-in">
          <header className="flex justify-between items-center p-8 md:px-20 border-b border-white/5">
            <h2 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4">
               <span className="material-symbols-outlined text-primary text-4xl">tune</span> Painel de Controle
            </h2>
            <button onClick={() => setGameState(GameState.MENU)} className="bg-primary px-10 py-4 rounded-2xl text-black font-black uppercase text-sm tracking-widest hover:bg-primary-dark transition-colors shadow-lg shadow-primary/10">
              Salvar e Voltar
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-8 md:px-20 pb-20 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              
              {/* ÁUDIO & SOM */}
              <section className="hud-glass p-8 rounded-[2rem] border-white/10">
                <h3 className="font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-3 border-b border-white/5 pb-4">
                  <span className="material-symbols-outlined">volume_up</span> Áudio & Mixagem
                </h3>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-[11px] uppercase font-black opacity-60 tracking-wider">Volume da Música</label>
                      <span className="text-primary font-mono font-bold text-xs">{Math.round(volume * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full accent-primary bg-white/5 h-1.5 rounded-full appearance-none cursor-pointer" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-[11px] uppercase font-black opacity-60 tracking-wider">Efeitos Sonoros (SFX)</label>
                      <span className="text-primary font-mono font-bold text-xs">{Math.round(sfxVolume * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" value={sfxVolume} onChange={(e) => setSfxVolume(parseFloat(e.target.value))} className="w-full accent-primary bg-white/5 h-1.5 rounded-full appearance-none cursor-pointer" />
                  </div>
                </div>
              </section>

              {/* GRÁFICOS & VISUAL */}
              <section className="hud-glass p-8 rounded-[2rem] border-white/10">
                <h3 className="font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-3 border-b border-white/5 pb-4">
                  <span className="material-symbols-outlined">display_settings</span> Renderização
                </h3>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-[11px] uppercase font-black opacity-60 tracking-wider">Campo de Visão (FOV)</label>
                      <span className="text-primary font-mono font-bold text-xs">{fov}°</span>
                    </div>
                    <input type="range" min="50" max="110" step="1" value={fov} onChange={(e) => setFov(parseInt(e.target.value))} className="w-full accent-primary bg-white/5 h-1.5 rounded-full appearance-none cursor-pointer" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-[11px] uppercase font-black opacity-60 tracking-wider">Distância de Visão</label>
                      <span className="text-primary font-mono font-bold text-xs">{renderDistance}m</span>
                    </div>
                    <input type="range" min="20" max="150" step="5" value={renderDistance} onChange={(e) => setRenderDistance(parseInt(e.target.value))} className="w-full accent-primary bg-white/5 h-1.5 rounded-full appearance-none cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-80">Mostrar Contador FPS</label>
                    <button onClick={() => setShowFPS(!showFPS)} className={`w-12 h-6 rounded-full transition-all relative ${showFPS ? 'bg-primary' : 'bg-white/10'}`}>
                      <div className={`absolute top-1 size-4 rounded-full bg-white transition-all ${showFPS ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>
              </section>

              {/* CONTROLES & GAMEPLAY */}
              <section className="hud-glass p-8 rounded-[2rem] border-white/10">
                <h3 className="font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-3 border-b border-white/5 pb-4">
                  <span className="material-symbols-outlined">sports_esports</span> Jogabilidade
                </h3>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-[11px] uppercase font-black opacity-60 tracking-wider">Sensibilidade do Mouse/Touch</label>
                      <span className="text-primary font-mono font-bold text-xs">{sensitivity.toFixed(1)}x</span>
                    </div>
                    <input type="range" min="0.1" max="2.5" step="0.1" value={sensitivity} onChange={(e) => setSensitivity(parseFloat(e.target.value))} className="w-full accent-primary bg-white/5 h-1.5 rounded-full appearance-none cursor-pointer" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setInvertY(!invertY)} className={`p-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${invertY ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/5 opacity-40'}`}>
                      Inverter Eixo Y: {invertY ? 'ON' : 'OFF'}
                    </button>
                    <button onClick={() => setAutoJump(!autoJump)} className={`p-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${autoJump ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/5 opacity-40'}`}>
                      Auto-Jump: {autoJump ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </section>

              {/* IA & VOZ */}
              <section className="hud-glass p-8 rounded-[2rem] border-white/10">
                <h3 className="font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-3 border-b border-white/5 pb-4">
                  <span className="material-symbols-outlined">psychology</span> Assistente IA
                </h3>
                <div className="space-y-4">
                  <p className="text-[10px] uppercase font-black opacity-40 mb-4 tracking-widest">Selecione o sintetizador de voz</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['Zephyr', 'Puck', 'Kore', 'Fenrir'].map(v => (
                      <button 
                        key={v}
                        onClick={() => setAiVoice(v)}
                        className={`py-4 rounded-2xl border font-black uppercase text-[10px] tracking-widest transition-all ${aiVoice === v ? 'bg-primary/20 border-primary text-primary shadow-[0_0_20px_rgba(19,236,55,0.15)]' : 'bg-white/5 border-white/5 opacity-40 hover:opacity-60'}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      )}

      {/* GAMEPLAY HUD */}
      {gameState === GameState.PLAYING && (
        <div className="w-full h-full relative">
          <VoxelWorld 
            activeBlock={activeBlock} 
            mobileMove={mobileMove} 
            mobileJump={mobileJump} 
            sensitivity={sensitivity}
            fov={fov}
            renderDistance={renderDistance}
            invertY={invertY}
            autoJump={autoJump}
          />
          
          {showFPS && (
             <div className="absolute top-4 left-4 font-mono text-[10px] text-primary bg-black/50 px-2 py-1 rounded-md pointer-events-none">
                FPS: 60 | RENDER: {renderDistance}m | FOV: {fov}
             </div>
          )}

          <div className="absolute inset-0 pointer-events-none p-4 md:p-8 flex flex-col justify-between">
            <header className="flex justify-between items-start">
              <div className="hud-glass p-4 rounded-3xl w-48 md:w-72 pointer-events-auto flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-1.5 text-[10px] font-black tracking-widest text-primary">
                    <span>SISTEMA INTEGRADO</span>
                    <span>ACTIVE</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary shadow-[0_0_15px_#13ec37] animate-pulse" style={{width: '100%'}}></div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pointer-events-auto">
                <button onClick={toggleMusic} className={`hud-glass size-12 flex items-center justify-center rounded-2xl active:scale-90 transition-all ${isMusicPlaying ? 'border-primary/40' : ''}`}>
                  <span className={`material-symbols-outlined ${isMusicPlaying ? 'text-primary' : 'text-white/40'}`}>
                    {isMusicPlaying ? 'music_note' : 'music_off'}
                  </span>
                </button>
                {!isAiConnected && (
                  <button onClick={handleConnectAi} disabled={isConnecting} className="hud-glass px-6 h-12 rounded-2xl flex items-center gap-3 text-primary border border-primary/20 hover:bg-primary/10 transition-colors active:scale-95">
                    <span className={`material-symbols-outlined ${isConnecting ? 'animate-spin' : ''}`}>mic</span>
                    <span className="text-xs font-black uppercase tracking-widest hidden md:inline">GUIAR IA</span>
                  </button>
                )}
                <button onClick={() => setGameState(GameState.MENU)} className="hud-glass size-12 flex items-center justify-center rounded-2xl active:scale-90 transition-transform">
                  <span className="material-symbols-outlined">pause</span>
                </button>
              </div>
            </header>

            {isMobile && (
              <div className="absolute inset-0 flex items-end justify-between p-6 pb-28 md:pb-36 pointer-events-none">
                <div className="size-44 rounded-full bg-white/5 border border-white/10 flex items-center justify-center pointer-events-auto relative shadow-2xl" onTouchMove={handleJoystick} onTouchEnd={() => setMobileMove({x:0, z:0})}>
                   <div className="absolute size-20 rounded-full border border-white/5 pointer-events-none"></div>
                   <div className="size-16 rounded-full bg-primary/40 border-2 border-primary shadow-[0_0_20px_rgba(19,236,55,0.4)] transition-transform duration-75" style={{ transform: `translate(${mobileMove.x*45}px, ${mobileMove.z*45}px)` }} />
                </div>
                <div className="flex flex-col gap-6 items-center pointer-events-auto">
                  <button onTouchStart={() => { if(navigator.vibrate) navigator.vibrate(15); setMobileJump(true); }} onTouchEnd={() => setMobileJump(false)} className="size-20 rounded-full hud-glass flex items-center justify-center text-primary border-primary/30 active:scale-125 transition-transform shadow-[0_0_30px_rgba(19,236,55,0.2)]">
                    <span className="material-symbols-outlined text-4xl">arrow_upward</span>
                  </button>
                  <div className="flex gap-4">
                    <button onClick={() => (window as any).performAction(false)} className="size-20 rounded-3xl hud-glass flex items-center justify-center text-red-500 active:scale-90 border-red-500/20 shadow-lg shadow-red-500/10">
                      <span className="material-symbols-outlined text-4xl">mining</span>
                    </button>
                    <button onClick={() => (window as any).performAction(true)} className="size-20 rounded-3xl hud-glass flex items-center justify-center text-primary active:scale-90 border-primary/20 shadow-lg shadow-primary/10">
                      <span className="material-symbols-outlined text-4xl">build</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <footer className="flex justify-center pointer-events-auto overflow-x-auto no-scrollbar pb-4">
               <div className="hud-glass flex gap-3 p-3 rounded-[2rem] min-w-max border-white/10 shadow-2xl">
                  {BLOCKS.slice(0, 9).map((block, i) => (
                    <button 
                      key={block.id}
                      onClick={() => setActiveSlot(i)}
                      className={`relative size-14 md:size-20 rounded-2xl bg-black/40 border-2 transition-all duration-300 ${activeSlot === i ? 'border-primary bg-primary/20 scale-110 shadow-[0_0_20px_rgba(19,236,55,0.3)]' : 'border-white/5 hover:border-white/20'}`}
                    >
                      <span className="material-symbols-outlined text-3xl md:text-4xl" style={{color: block.color}}>{block.icon}</span>
                      {activeSlot === i && <div className="absolute -bottom-1 inset-x-4 h-0.5 bg-primary rounded-full animate-pulse"></div>}
                    </button>
                  ))}
               </div>
            </footer>
          </div>
        </div>
      )}

      {/* SELEÇÃO DE MUNDO */}
      {gameState === GameState.WORLD_SELECT && (
        <div className="relative z-10 flex flex-col h-full p-6 md:p-20 overflow-hidden animate-fade-in">
           <header className="flex justify-between items-center mb-12">
             <h2 className="text-5xl font-black uppercase tracking-tighter">Seus Mundos</h2>
             <button onClick={() => setGameState(GameState.MENU)} className="bg-white/5 hover:bg-white/10 px-6 py-2 rounded-full transition-colors uppercase font-black text-[10px] tracking-widest active:scale-95">Fechar</button>
           </header>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto pb-10 custom-scrollbar pr-4">
             {worlds.map(world => (
               <div key={world.id} onClick={() => loadWorld(world)} className="group bg-white/5 hover:bg-white/10 rounded-[2rem] border border-white/5 p-10 transition-all cursor-pointer transform hover:-translate-y-2 shadow-xl hover:shadow-primary/5">
                 <h3 className="text-3xl font-black uppercase text-primary group-hover:tracking-wider transition-all">{world.name}</h3>
                 <p className="text-white/30 text-[10px] mt-3 uppercase tracking-[0.25em] font-bold">{world.difficulty} • ATUALIZADO EM {world.lastPlayed}</p>
                 <div className="mt-8 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="size-12 rounded-full bg-primary flex items-center justify-center text-black">
                      <span className="material-symbols-outlined font-bold">play_arrow</span>
                    </div>
                 </div>
               </div>
             ))}
             
             <button onClick={createNewWorld} className="min-h-[220px] rounded-[2rem] border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-primary/60 hover:text-primary hover:bg-primary/5 hover:border-primary/50 transition-all group active:scale-95">
                <span className="material-symbols-outlined text-6xl mb-4 group-hover:scale-110 transition-transform">add_circle</span>
                <span className="font-black uppercase tracking-[0.3em] text-[11px]">Gerar Novo Horizonte</span>
             </button>
           </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(19, 236, 55, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(19, 236, 55, 0.4); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>
    </div>
  );
};

export default App;
