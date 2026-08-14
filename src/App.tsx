import { useState, useEffect, useRef, useCallback } from "react"
import roomIllustration from "@/imports/ChatGPT_Image_Aug_14__2026__10_53_25_PM.png"
import titleLogo from "@/imports/ChatGPT_Image_Aug_14__2026__10_57_10_PM-1.png"

// ─── Web Audio API Rain & Wind Synthesizer ───────────────────────────────────────

class RainSynthesizer {
  private ctx: AudioContext | null = null;
  private rainNode: AudioBufferSourceNode | null = null;
  private windNode: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private timer: number | null = null;

  start() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      this.ctx = new AudioContextClass();

      const sampleRate = this.ctx.sampleRate;
      const bufferSize = 2 * sampleRate;
      
      // Pink Noise for Rain
      const pinkBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const pinkData = pinkBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        pinkData[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        pinkData[i] *= 0.11;
        b6 = white * 0.115926;
      }

      // Brown Noise for Wind
      const brownBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const brownData = brownBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        brownData[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = brownData[i];
        brownData[i] *= 3.5;
      }

      this.rainNode = this.ctx.createBufferSource();
      this.rainNode.buffer = pinkBuffer;
      this.rainNode.loop = true;

      this.rainFilter = this.ctx.createBiquadFilter();
      this.rainFilter.type = "lowpass";
      this.rainFilter.frequency.value = 1000; // muffled indoor sound

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      this.windNode = this.ctx.createBufferSource();
      this.windNode.buffer = brownBuffer;
      this.windNode.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = "lowpass";
      this.windFilter.frequency.value = 350;

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.rainNode.connect(this.rainFilter);
      this.rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.ctx.destination);

      this.windNode.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.ctx.destination);

      this.rainNode.start(0);
      this.windNode.start(0);

      this.modulateWind();
    } catch (e) {
      console.warn("AudioContext initialization failed:", e);
    }
  }

  private modulateWind() {
    if (!this.ctx || !this.windGain) return;
    const now = this.ctx.currentTime;
    const targetGain = 0.01 + Math.random() * 0.07;
    const duration = 4 + Math.random() * 5;
    this.windGain.gain.linearRampToValueAtTime(targetGain, now + duration);
    this.timer = window.setTimeout(() => this.modulateWind(), duration * 1000);
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
    try {
      if (this.rainNode) this.rainNode.stop();
      if (this.windNode) this.windNode.stop();
    } catch(e) {}
    if (this.ctx) {
      this.ctx.close();
    }
    this.ctx = null;
    this.rainNode = null;
    this.windNode = null;
  }
}

// ─── Data ────────────────────────────────────────────────────────────────────

const SONGS = [
  { title: "Kun Faya Kun", artist: "A.R. Rahman", duration: "7:52", total: 472, ytId: "T94PHkuyd84" },
  { title: "O Re Piya", artist: "Rahat Fateh Ali Khan", duration: "5:12", total: 312, ytId: "z12qG8q_0lU" },
  { title: "Iktara", artist: "Kavita Seth", duration: "4:21", total: 261, ytId: "fS8bU65G0Cg" },
  { title: "Agar Tum Saath Ho", artist: "Alka Yagnik & Arijit Singh", duration: "5:42", total: 342, ytId: "sK7riqg2mr4" },
  { title: "Phir Le Aya Dil", artist: "Arijit Singh", duration: "5:08", total: 308, ytId: "4-L6R-P__t4" },
  { title: "Tum Se Hi", artist: "Mohit Chauhan", duration: "5:21", total: 321, ytId: "mt9xg0pkW2w" },
  { title: "Kabira", artist: "Tochi Raina & Rekha Bhardwaj", duration: "3:43", total: 223, ytId: "jH1i1b28kSg" },
  { title: "Aaoge Jab Tum", artist: "Rashid Khan", duration: "5:55", total: 355, ytId: "1Y-Y1z75jns" },
  { title: "Choo Lo", artist: "The Local Train", duration: "3:53", total: 233, ytId: "IPXIgEAGe4U" },
  { title: "Tune Kaha", artist: "Prateek Kuhad", duration: "3:24", total: 204, ytId: "eF41iT-yW1I" },
  { title: "Waqt Ki Baatein", artist: "Dream Note", duration: "4:07", total: 247, ytId: "pEEk70w5sL0" },
]

const WHITEBOARD_SECTIONS = [
  { label: "Startup Idea", action: "Song Categories", icon: "✦", songs: ["90s Bollywood", "Ghazals", "Sufi", "Indie Hindi", "Classical"] },
  { label: "App Flow", action: "Playlists", icon: "⬡", songs: ["Tonight's Queue", "Rain Mode", "Focus", "Midnight Drive", "Chai Break"] },
  { label: "Features", action: "Listening History", icon: "◈", songs: ["O Re Piya", "Kun Faya Kun", "Iktara", "Tum Se Hi", "Kabira"] },
  { label: "MVP Launch ASAP", action: "Favourites", icon: "★", songs: ["Iktara", "Kun Faya Kun", "Phir Le Aya Dil", "Tum Se Hi", "Agar Tum Saath Ho"] },
  { label: "To-Do", action: "Queue", icon: "◻", songs: SONGS.map(s => s.title) },
]

const BOOKS = [
  { title: "The Visual MBA", playlist: "Entrepreneurship Anthems" },
  { title: "Atomic Habits", playlist: "Productivity Mode" },
  { title: "Deep Work", playlist: "Focus Hours" },
  { title: "Think and Grow Rich", playlist: "Ambition Fuel" },
  { title: "The Psychology of Money", playlist: "About the Creator" },
]

const LISTENING_MODES = ["Work", "Study", "Rain", "Nostalgia", "Midnight"]

const TEA_MENU = ["90s Bollywood", "Ghazals", "Late Night Songs", "Rainy Evening Mix", "Old Bengali Classics"]

const NOTES = [
  { time: "01:44 AM", text: "Why does this bug only appear at night." },
  { time: "02:31 AM", text: "Deployed. Broke it again. Fixed." },
  { time: "03:12 AM", text: "Need to finish this." },
  { time: "03:28 AM", text: "Maybe tomorrow will be easier." },
  { time: "03:41 AM", text: "One more song." },
]

const SPIDER_MESSAGES = [
  ["With great power comes great responsibility.", "Keep building."],
  ["You should probably sleep.", "No?\n\nOkay."],
]

const AMBIENT_STYLES: Record<number, { sky: string, filter: string, desc: string }> = {
  20: { // 8 PM
    sky: "linear-gradient(180deg, rgba(230, 90, 40, 0.25) 0%, rgba(20, 15, 35, 0.55) 100%)",
    filter: "brightness(1.02) sepia(0.2) hue-rotate(-8deg)",
    desc: "8 PM: Evening transition"
  },
  23: { // 11 PM
    sky: "linear-gradient(180deg, rgba(10, 8, 20, 0.18) 0%, rgba(15, 10, 25, 0.35) 100%)",
    filter: "brightness(1.1) saturate(1.1)",
    desc: "11 PM: Tea stall crowd"
  },
  2: { // 2 AM
    sky: "linear-gradient(180deg, rgba(0, 5, 20, 0.22) 0%, rgba(5, 2, 15, 0.5) 100%)",
    filter: "brightness(0.85) saturate(0.88)",
    desc: "2 AM: Quieter streets"
  },
  3: { // 3:42 AM
    sky: "rgba(0,0,0,0)",
    filter: "brightness(1.0)",
    desc: "3:42 AM: Deep startup night"
  },
  5: { // 5 AM
    sky: "linear-gradient(180deg, rgba(60, 110, 210, 0.25) 0%, rgba(12, 18, 42, 0.6) 100%)",
    filter: "brightness(0.8) saturate(0.75) sepia(0.12)",
    desc: "5 AM: Pre-dawn soft blue sky"
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

function getKolkataTime() {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const kolkata = new Date(utc + 5.5 * 3600000)
  return { h: kolkata.getHours(), m: kolkata.getMinutes(), s: kolkata.getSeconds() }
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Overlay = "whiteboard" | "teaStall" | "books" | "headphones" | "notes" | "clock" | null

export default function App() {
  const [currentSong, setCurrentSong] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(134)
  const [liked, setLiked] = useState(false)
  const [looping, setLooping] = useState(false)
  const [rainOn, setRainOn] = useState(true)
  const [lampOn, setLampOn] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [whiteboardTab, setWhiteboardTab] = useState(0)
  const [spiderIdx, setSpiderIdx] = useState(0)
  const [spiderFlipped, setSpiderFlipped] = useState(false)
  const [spiderHover, setSpiderHover] = useState(false)
  const [headphoneSwing, setHeadphoneSwing] = useState(false)
  const [listeningMode, setListeningMode] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [nightOwls, setNightOwls] = useState(23)
  const [ambientHour, setAmbientHour] = useState<number | null>(null)
  const [lightningActive, setLightningActive] = useState(false)
  const [ytReady, setYtReady] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const rainSynthRef = useRef<RainSynthesizer | null>(null)
  const ytPlayerRef = useRef<any>(null)

  const song = SONGS[currentSong]

  // Web Audio Rain Synthesizer Hook
  useEffect(() => {
    if (!rainSynthRef.current) {
      rainSynthRef.current = new RainSynthesizer()
    }
    if (rainOn) {
      rainSynthRef.current.start()
    } else {
      rainSynthRef.current.stop()
    }
    return () => {
      rainSynthRef.current?.stop()
    }
  }, [rainOn])

  // Dynamic initialization of YouTube Player IFrame API
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      initPlayer()
    }

    const initPlayer = () => {
      ytPlayerRef.current = new (window as any).YT.Player("yt-player", {
        height: "200",
        width: "200",
        videoId: song.ytId,
        playerVars: {
          playsinline: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            setYtReady(true)
          },
          onStateChange: (event: any) => {
            // 1 = playing, 2 = paused, 0 = ended
            if (event.data === (window as any).YT.PlayerState.PLAYING) {
              setPlaying(true)
            } else if (event.data === (window as any).YT.PlayerState.PAUSED) {
              setPlaying(false)
            } else if (event.data === (window as any).YT.PlayerState.ENDED) {
              if (looping) {
                ytPlayerRef.current.playVideo()
              } else {
                next()
              }
            }
          },
        },
      })
    }

    if ((window as any).YT && (window as any).YT.Player && !ytPlayerRef.current) {
      initPlayer()
    }
  }, [])

  // Sync track loading from YT ID
  useEffect(() => {
    if (ytPlayerRef.current && ytReady) {
      ytPlayerRef.current.cueVideoById(song.ytId)
      if (playing) {
        ytPlayerRef.current.playVideo()
      }
    }
    setProgress(0)
  }, [currentSong, ytReady])

  // Sync play/pause with YouTube player
  const togglePlay = () => {
    if (!ytPlayerRef.current || !ytReady) return
    if (playing) {
      ytPlayerRef.current.pauseVideo()
    } else {
      ytPlayerRef.current.playVideo()
    }
    setPlaying(!playing)
  }

  // Poll YouTube video progress timeline
  useEffect(() => {
    let progressInterval: number | null = null
    if (playing && ytPlayerRef.current && ytReady) {
      progressInterval = window.setInterval(() => {
        const currentTime = Math.floor(ytPlayerRef.current.getCurrentTime() || 0)
        setProgress(currentTime)
      }, 500)
    } else {
      if (progressInterval) clearInterval(progressInterval)
    }
    return () => {
      if (progressInterval) clearInterval(progressInterval)
    }
  }, [playing, ytReady])

  // Scrub handler
  const handleProgressChange = (newProgress: number) => {
    setProgress(newProgress)
    if (ytPlayerRef.current && ytReady) {
      ytPlayerRef.current.seekTo(newProgress, true)
    }
  }

  // Resume WebAudio contexts on interaction
  const resumeAudio = useCallback(() => {
    if (rainOn && rainSynthRef.current) {
      rainSynthRef.current.start()
    }
  }, [rainOn])

  useEffect(() => {
    const handleInteraction = () => {
      resumeAudio()
      window.removeEventListener("click", handleInteraction)
      window.removeEventListener("keydown", handleInteraction)
    }
    window.addEventListener("click", handleInteraction)
    window.addEventListener("keydown", handleInteraction)
    return () => {
      window.removeEventListener("click", handleInteraction)
      window.removeEventListener("keydown", handleInteraction)
    }
  }, [resumeAudio])

  // Lightning effect when rain is ON
  useEffect(() => {
    if (!rainOn) return
    let lightningTimer: number | null = null;
    const triggerLightning = () => {
      setLightningActive(true)
      setTimeout(() => setLightningActive(false), 500)
      const nextTime = 8000 + Math.random() * 14000
      lightningTimer = window.setTimeout(triggerLightning, nextTime)
    }
    const nextTime = 5000 + Math.random() * 8000
    lightningTimer = window.setTimeout(triggerLightning, nextTime)
    return () => {
      if (lightningTimer) clearTimeout(lightningTimer)
    }
  }, [rainOn])

  // Heartbeat night-owls counter fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setNightOwls(current => {
        const diff = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const nextVal = current + diff;
        return nextVal < 18 ? 18 : nextVal > 28 ? 28 : nextVal;
      });
    }, 7000)
    return () => clearInterval(interval)
  }, [])

  // keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      switch (e.key) {
        case " ": 
          e.preventDefault()
          togglePlay()
          break
        case "ArrowRight": 
          next()
          break
        case "ArrowLeft": 
          prev()
          break
        case "r": case "R": setRainOn(r => !r); break
        case "b": case "B": setOverlay(o => o === "whiteboard" ? null : "whiteboard"); break
        case "t": case "T": setOverlay(o => o === "teaStall" ? null : "teaStall"); break
        case "n": case "N": setOverlay(o => o === "notes" ? null : "notes"); break
        case "Escape": setOverlay(null); break
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [playing, ytReady, currentSong])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    })
  }, [])

  const prev = () => { setCurrentSong(s => (s - 1 + SONGS.length) % SONGS.length); setProgress(0) }
  const next = () => { setCurrentSong(s => (s + 1) % SONGS.length); setProgress(0) }
  const closeOverlay = () => setOverlay(null)

  const rainShift = { x: mousePos.x * 2.5, y: mousePos.y * 2 }
  const activeAmbient = ambientHour !== null ? (AMBIENT_STYLES[ambientHour] || AMBIENT_STYLES[3]) : AMBIENT_STYLES[3];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
      style={{ background: "#0d0906" }}
      onMouseMove={handleMouseMove}
      onClick={resumeAudio}
    >
      {/* Background YouTube Iframe Container (masked behind illustration layer to satisfy autoplay/rendering visibility rules) */}
      <div 
        id="yt-player" 
        className="absolute pointer-events-none" 
        style={{ width: "200px", height: "200px", left: "20px", top: "20px", zIndex: 0, opacity: 0.001 }} 
      />

      {/* ── Illustration (Renders on top of YT player iframe) ── */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${rainShift.x}px, ${rainShift.y}px) scale(1.01)`,
          transition: "transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)",
          filter: (lampOn ? "brightness(1)" : "brightness(0.65) saturate(0.5)") + " " + activeAmbient.filter,
          zIndex: 10,
        }}
      >
        <img
          src={roomIllustration}
          alt="A young founder working through a rainy Kolkata night at 3 AM"
          className="w-full h-full object-cover"
        />

        {/* Sky Ambient Overlay */}
        <div className="sky-ambient" style={{ background: activeAmbient.sky }} />

        {/* Rain overlay when on */}
        {rainOn && (
          <>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: "repeating-linear-gradient(transparent 0px, transparent 6px, rgba(180,200,220,0.03) 6px, rgba(180,200,220,0.03) 7px)",
                backgroundSize: "4px 7px",
                opacity: 0.5,
              }}
            />
            {/* Run raindrops streaks */}
            <div className="window-glass">
              <div className="raindrop-streak" style={{ left: "8%", animationDelay: "0s", animationDuration: "2.1s" }} />
              <div className="raindrop-streak" style={{ left: "15%", animationDelay: "0.5s", animationDuration: "2.8s" }} />
              <div className="raindrop-streak" style={{ left: "28%", animationDelay: "1.1s", animationDuration: "2.3s" }} />
              <div className="raindrop-streak" style={{ left: "42%", animationDelay: "0.2s", animationDuration: "2.6s" }} />
              <div className="raindrop-streak" style={{ left: "55%", animationDelay: "1.6s", animationDuration: "2.9s" }} />
              <div className="raindrop-streak" style={{ left: "70%", animationDelay: "0.7s", animationDuration: "2.4s" }} />
              <div className="raindrop-streak" style={{ left: "85%", animationDelay: "1.3s", animationDuration: "2.7s" }} />
            </div>
          </>
        )}
      </div>

      {/* Lightning Flash Overlay */}
      <div className={`lightning-flash ${lightningActive ? "flash-active" : ""}`} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 38%, rgba(8,4,1,0.62) 100%)" }} />

      {/* ── Bengali title — upper center ── */}
      <div className="absolute z-20 flex justify-center pointer-events-none fade-in" style={{ top: "8%", left: 0, right: 0 }}>
        <img
          src={titleLogo}
          alt="এখনও জেগে"
          className="select-none"
          style={{ width: "360px", filter: "drop-shadow(0 4px 28px rgba(0,0,0,0.95))" }}
          draggable={false}
        />
      </div>

      {/* ── Night owls counter — bottom center ── */}
      <div className="absolute z-30 handwritten fade-in flex justify-center items-center gap-1.5" style={{ bottom: "3.5%", left: 0, right: 0, color: "rgba(200,137,31,0.5)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
        <span className="inline-block animate-pulse">🌙</span> {nightOwls} people are still awake
      </div>

      {/* ── Nav — top right (Horizontal Row) ── */}
      <nav className="absolute top-6 right-10 z-20 flex flex-row items-center gap-6 fade-in" style={{ animationDelay: "0.3s" }}>
        {[
          { label: "🌙 Tonight", key: "clock" as Overlay, click: () => {} },
          { label: "📼 Mixtapes", key: "headphones" as Overlay, click: () => {} },
          { label: "📌 Pinned Songs", key: "whiteboard" as Overlay, click: () => { setWhiteboardTab(3); } },
          { label: "📓 Notes", key: "notes" as Overlay, click: () => {} },
          { label: "☕ Tea Stall", key: "teaStall" as Overlay, click: () => {} },
        ].map(({ label, key, click }) => (
          <span
            key={label}
            className="handwritten cursor-pointer transition-all duration-300"
            style={{ color: "rgba(212,168,67,0.4)", fontSize: "0.95rem" }}
            onClick={() => {
              if (click) click();
              if (key) setOverlay(o => o === key ? null : key);
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(232,169,74,0.82)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(212,168,67,0.4)")}
          >
            {label}
          </span>
        ))}
      </nav>

      {/* ── Window Latch Rain Toggle Hotspot ── */}
      <div
        className="absolute z-20 cursor-pointer group"
        style={{ top: "40%", left: "10%", width: "4%", height: "7%" }}
        onClick={() => setRainOn(r => !r)}
        title={rainOn ? "Turn off rain sound" : "Turn on rain sound"}
      >
        <div className="absolute inset-0 rounded bg-amber-warm/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-[10px] handwritten text-amber-warm select-none whitespace-nowrap bg-soft-black/80 px-2 py-0.5 rounded border border-amber/30">
            {rainOn ? "🌧 Close Latch" : "🌧 Open Latch"}
          </span>
        </div>
      </div>

      {/* ── Tea stall hotspot — aligned exactly over the yellow board sign ── */}
      <div
        className="absolute z-20 cursor-pointer group"
        style={{ top: "57%", left: "9%", width: "7.5%", height: "6%" }}
        onClick={() => setOverlay(o => o === "teaStall" ? null : "teaStall")}
      >
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 handwritten font-semibold text-center select-none"
          style={{ color: "rgba(232,169,74,0.85)", fontSize: "0.72rem", whiteSpace: "nowrap", borderBottom: "1.5px solid rgba(232,169,74,0.5)", paddingBottom: "1.5px" }}
        >
          ☕ tea stall [T]
        </div>
      </div>

      {/* ── Bookshelf hotspots (bottom-left) ── */}
      <div
        className="absolute z-20"
        style={{ top: "62%", left: "2%", width: "14%", height: "30%" }}
      >
        {BOOKS.map((book, idx) => (
          <div
            key={idx}
            className="absolute cursor-pointer group"
            style={{
              top: `${10 + idx * 16}%`,
              left: "10%",
              width: "80%",
              height: "14%",
            }}
            onClick={() => {
              if (idx === 4) {
                // About the Creator (notebook)
                setOverlay("notes")
              } else {
                setListeningMode(book.playlist)
                setCurrentSong(Math.floor(Math.random() * SONGS.length))
                setPlaying(true)
              }
            }}
          >
            {/* hover glow */}
            <div className="absolute inset-0 bg-amber-warm/5 opacity-0 group-hover:opacity-100 transition-opacity rounded" />
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-soft-black/90 text-amber-warm text-[10px] handwritten px-2 py-0.5 rounded border border-amber/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-30">
              📖 {book.title}
            </div>
          </div>
        ))}
      </div>

      {/* ── Headphones hotspot — aligned over the physical headphones on the desk ── */}
      <div
        className={`absolute z-20 cursor-pointer group ${headphoneSwing ? "swing" : ""}`}
        style={{ top: "80%", left: "18%", width: "10%", height: "10%" }}
        onClick={() => {
          setOverlay(o => o === "headphones" ? null : "headphones")
        }}
      >
        <div
          className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 handwritten font-semibold text-center select-none"
          style={{ color: "rgba(232,169,74,0.85)", fontSize: "0.72rem", whiteSpace: "nowrap", borderBottom: "1.5px solid rgba(232,169,74,0.5)", paddingBottom: "1.5px" }}
        >
          🎧 listening mode
        </div>
      </div>

      {/* ── Spider-Man poster 3D flip ── */}
      <div
        className="absolute z-20 cursor-pointer"
        style={{ top: "8%", right: "0%", width: "6%", height: "48%" }}
        onMouseEnter={() => setSpiderHover(true)}
        onMouseLeave={() => setSpiderHover(false)}
        onClick={() => { 
          setSpiderFlipped(f => !f); 
          if (!spiderFlipped) {
            setSpiderIdx(i => (i + 1) % SPIDER_MESSAGES.length);
          }
        }}
      >
        <div className="poster-container">
          <div className={`poster-card ${spiderFlipped ? 'flipped' : ''}`}>
            {/* Front side */}
            <div className="poster-front flex flex-col justify-end pb-3 bg-transparent">
              {spiderHover && (
                <div className="absolute inset-0 flex items-end justify-center pb-3 bg-black/60 rounded">
                  <p className="handwritten text-center text-xs px-2 leading-tight" style={{ color: "rgba(232,169,74,0.85)" }}>
                    With great power comes great responsibility.
                  </p>
                </div>
              )}
            </div>
            {/* Back side */}
            <div className="poster-back flex items-center justify-center bg-[#18110b] border border-amber/20 p-2 rounded">
              <div className="text-center">
                <p className="handwritten text-xs leading-relaxed text-amber-warm font-bold">
                  "{SPIDER_MESSAGES[spiderIdx][0]}"
                </p>
                <p className="handwritten text-[10px] mt-2 text-amber/60">
                  {SPIDER_MESSAGES[spiderIdx][1]}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lamp toggle hotspot ── */}
      <div
        className="absolute z-20 cursor-pointer"
        style={{ bottom: "28%", left: "28%", width: "6%", height: "12%", background: "transparent" }}
        onClick={() => setLampOn(l => !l)}
        title={lampOn ? "Turn lamp off" : "Turn lamp on"}
      />

      {/* ── Music player — centered bottom ── */}
      <div
        className="absolute z-30 fade-in"
        style={{
          bottom: "7%", left: "calc(50% - 250px)", width: "500px",
          borderRadius: "20px", padding: "18px 26px 20px", animationDelay: "0.6s",
          background: "rgba(14, 8, 3, 0.08)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          border: "1px solid rgba(200,137,31,0.08)",
          boxShadow: "0 8px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(232,169,74,0.04)",
        }}
      >
        {listeningMode && (
          <div className="handwritten text-center mb-2" style={{ color: "rgba(200,137,31,0.55)", fontSize: "0.7rem", letterSpacing: "0.1em" }}>
            {listeningMode.toUpperCase()} MODE
          </div>
        )}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="serif font-medium" style={{ color: "rgba(240,226,190,0.95)", fontSize: "1rem", lineHeight: 1.2 }}>{song.title}</p>
            <p className="handwritten mt-1" style={{ color: "rgba(200,137,31,0.6)", fontSize: "0.82rem" }}>{song.artist}</p>
          </div>
          <div className="flex items-center gap-4 mt-0.5">
            <button onClick={() => setLiked(l => !l)} className="bg-transparent border-none cursor-pointer p-0 transition-all duration-200 hover:scale-110" style={{ color: liked ? "#e8a94a" : "rgba(200,137,31,0.35)" }}>
              {liked ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-amber-warm"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              )}
            </button>
            <button onClick={() => setLooping(l => !l)} className="bg-transparent border-none cursor-pointer p-0 transition-all duration-200" style={{ color: looping ? "#e8a94a" : "rgba(200,137,31,0.35)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={looping ? "text-amber-warm" : ""}>
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-4">
          <span className="handwritten tabular-nums" style={{ color: "rgba(200,137,31,0.45)", fontSize: "0.68rem", minWidth: "30px" }}>{formatTime(progress)}</span>
          <div className="relative flex-1 flex items-center" style={{ height: "3px" }}>
            <div className="absolute inset-0 rounded-full" style={{ background: "rgba(200,137,31,0.15)" }} />
            <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${(progress / song.total) * 100}%`, background: "linear-gradient(90deg, #a06818, #e8a94a)" }} />
            <input type="range" min={0} max={song.total} value={progress} onChange={e => handleProgressChange(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer" style={{ height: "100%" }} />
          </div>
          <span className="handwritten tabular-nums" style={{ color: "rgba(200,137,31,0.35)", fontSize: "0.68rem", minWidth: "30px", textAlign: "right" }}>{song.duration}</span>
        </div>

        <div className="flex items-center justify-center gap-8">
          <button onClick={prev} className="bg-transparent border-none cursor-pointer p-0 flex items-center justify-center" title="Previous Song">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-warm opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-200"><polygon points="19 20 9 12 19 4 19 20" fill="currentColor"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
          </button>
          <button
            onClick={togglePlay}
            className="flex items-center justify-center rounded-full border-none cursor-pointer transition-all duration-255 hover:scale-105 animate-glow"
            style={{ width: "44px", height: "44px", background: "radial-gradient(circle at 40% 35%, rgba(232,169,74,0.22) 0%, rgba(160,104,24,0.14) 100%)", border: "1px solid rgba(200,137,31,0.4)", color: "#e8a94a", boxShadow: "0 0 14px rgba(200,137,31,0.15)" }}
          >
            {playing ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            )}
          </button>
          <button onClick={next} className="bg-transparent border-none cursor-pointer p-0 flex items-center justify-center" title="Next Song">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-warm opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-200"><polygon points="5 4 15 12 5 20 5 4" fill="currentColor"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
          </button>
        </div>
      </div>

      {/* ── Playlist drawer ── */}
      <button
        className="absolute z-30 handwritten cursor-pointer"
        style={{
          right: drawerOpen ? "calc(25% + 4px)" : "0", top: "50%", transform: "translateY(-50%)",
          background: "rgba(20,12,5,0.7)", border: "1px solid rgba(200,137,31,0.2)", borderRight: "none",
          color: "rgba(212,168,67,0.55)", padding: "12px 8px", borderRadius: "8px 0 0 8px",
          fontSize: "0.7rem", writingMode: "vertical-rl", letterSpacing: "0.1em",
          backdropFilter: "blur(8px)", transition: "right 0.35s ease",
        }}
        onClick={() => setDrawerOpen(d => !d)}
      >
        {drawerOpen ? "close" : "tonight's queue"}
      </button>

      {drawerOpen && (
        <div className="absolute right-0 top-0 h-full z-20 drawer-in" style={{ width: "25%", minWidth: "240px", padding: "32px 24px", background: "rgba(14,8,3,0.72)", backdropFilter: "blur(20px)", borderLeft: "1px solid rgba(200,137,31,0.12)" }}>
          <h3 className="handwritten mb-6" style={{ color: "rgba(212,168,67,0.8)", fontSize: "1.1rem", borderBottom: "1px solid rgba(200,137,31,0.18)", paddingBottom: "12px" }}>Tonight's Queue</h3>
          <div className="flex flex-col gap-1">
            {SONGS.map((s, i) => (
              <button key={i} onClick={() => { setCurrentSong(i); setProgress(0) }} className="flex items-start gap-3 text-left py-3 px-2 rounded-lg bg-transparent border-none cursor-pointer" style={{ background: currentSong === i ? "rgba(200,137,31,0.12)" : "transparent", borderBottom: "1px solid rgba(200,137,31,0.08)" }}
                onMouseEnter={e => { if (currentSong !== i) (e.currentTarget as HTMLElement).style.background = "rgba(200,137,31,0.07)" }}
                onMouseLeave={e => { if (currentSong !== i) (e.currentTarget as HTMLElement).style.background = "transparent" }}
              >
                <span className="handwritten text-xs mt-0.5" style={{ color: "rgba(200,137,31,0.4)", minWidth: "18px" }}>{String(i + 1).padStart(2, "0")}.</span>
                <div>
                  <p className="serif text-xs" style={{ color: currentSong === i ? "rgba(232,169,74,0.95)" : "rgba(240,230,200,0.7)", fontSize: "0.8rem" }}>{s.title}</p>
                  <p className="handwritten text-xs" style={{ color: "rgba(200,137,31,0.4)", fontSize: "0.7rem" }}>{s.artist}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="handwritten text-center absolute bottom-10 left-6 right-6" style={{ color: "rgba(200,137,31,0.25)", fontSize: "0.65rem" }}>03:42 AM — still awake</p>
        </div>
      )}

      {/* ── Tea Stall Sliding Paper Menu ── */}
      <div className={`sliding-paper-menu ${overlay === 'teaStall' ? 'open' : ''}`}>
        <div className="flex justify-between items-center mb-3 border-b border-brown-mid/20 pb-2">
          <span className="text-lg font-bold">☕ Tea Stall Recommendations</span>
          <button onClick={() => setOverlay(null)} className="cursor-pointer text-xs border border-brown-mid/30 hover:bg-brown-mid/10 rounded-full px-2 py-0.5 font-bold">close</button>
        </div>
        <p className="serif text-[13px] italic mb-3 opacity-80 leading-snug">The chaiwala knows exactly what you need to keep going.</p>
        <div className="flex flex-col gap-1.5">
          {TEA_MENU.map((item) => (
            <button
              key={item}
              onClick={() => {
                setListeningMode(item)
                setCurrentSong(Math.floor(Math.random() * SONGS.length))
                setPlaying(true)
                setOverlay(null)
              }}
              className="text-left py-1 px-2 rounded-lg border-none cursor-pointer bg-transparent hover:bg-amber-warm/20 transition-all text-base flex items-center gap-1.5"
              style={{ color: "#533918" }}
            >
              • {item}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          OVERLAYS (MODALS)
      ══════════════════════════════════════════════ */}

      {overlay && overlay !== "teaStall" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center overlay-in" style={{ background: "rgba(8,4,1,0.82)", backdropFilter: "blur(8px)" }} onClick={closeOverlay}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: "520px", width: "90%" }}>

            {/* ── Whiteboard overlay ── */}
            {overlay === "whiteboard" && (
              <div className="rounded-2xl p-8" style={{ background: "rgba(20,12,5,0.9)", border: "1px solid rgba(200,137,31,0.18)" }}>
                <p className="handwritten mb-6 text-center" style={{ color: "rgba(200,137,31,0.4)", fontSize: "0.7rem", letterSpacing: "0.15em" }}>WHITEBOARD</p>
                <div className="flex gap-2 mb-6 flex-wrap justify-center">
                  {WHITEBOARD_SECTIONS.map((sec, i) => (
                    <button key={i} onClick={() => setWhiteboardTab(i)} className="handwritten border-none cursor-pointer rounded-full px-3 py-1 text-xs transition-all duration-200"
                      style={{ background: whiteboardTab === i ? "rgba(200,137,31,0.2)" : "transparent", color: whiteboardTab === i ? "rgba(232,169,74,0.9)" : "rgba(212,168,67,0.4)", border: `1px solid ${whiteboardTab === i ? "rgba(200,137,31,0.4)" : "rgba(200,137,31,0.15)"}` }}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>
                <div>
                  <p className="handwritten mb-4 text-center" style={{ color: "rgba(200,137,31,0.5)", fontSize: "0.75rem" }}>{WHITEBOARD_SECTIONS[whiteboardTab].icon} {WHITEBOARD_SECTIONS[whiteboardTab].action}</p>
                  <div className="flex flex-col gap-2">
                    {WHITEBOARD_SECTIONS[whiteboardTab].songs.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer transition-all duration-200" style={{ borderBottom: "1px solid rgba(200,137,31,0.08)" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(200,137,31,0.07)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                      >
                        <span className="handwritten" style={{ color: "rgba(200,137,31,0.3)", fontSize: "0.65rem", minWidth: "16px" }}>{String(i + 1).padStart(2, "0")}.</span>
                        <span className="serif" style={{ color: "rgba(240,226,190,0.8)", fontSize: "0.88rem" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={closeOverlay} className="handwritten w-full mt-6 text-xs bg-transparent border-none cursor-pointer hover:opacity-60 transition-opacity" style={{ color: "rgba(200,137,31,0.3)" }}>esc to close</button>
              </div>
            )}

            {/* ── Books bookshelf overlay ── */}
            {overlay === "books" && (
              <div className="rounded-2xl p-8" style={{ background: "rgba(20,12,5,0.92)", border: "1px solid rgba(200,137,31,0.18)" }}>
                <p className="handwritten mb-6 text-center" style={{ color: "rgba(200,137,31,0.4)", fontSize: "0.7rem", letterSpacing: "0.15em" }}>BOOKSHELF</p>
                <div className="flex flex-col gap-2">
                  {BOOKS.map((book, i) => (
                    <button key={i} onClick={() => {
                      if (i === 4) {
                        setOverlay("notes")
                      } else {
                        setListeningMode(book.playlist)
                        setCurrentSong(Math.floor(Math.random() * SONGS.length))
                        setPlaying(true)
                        closeOverlay()
                      }
                    }} className="flex items-center justify-between py-3 px-4 rounded-lg bg-transparent border-none cursor-pointer transition-all duration-200 text-left"
                      style={{ borderBottom: "1px solid rgba(200,137,31,0.08)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(200,137,31,0.07)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                    >
                      <span className="serif" style={{ color: "rgba(240,226,190,0.8)", fontSize: "0.85rem" }}>{book.title}</span>
                      <span className="handwritten" style={{ color: "rgba(200,137,31,0.45)", fontSize: "0.72rem" }}>→ {book.playlist}</span>
                    </button>
                  ))}
                </div>
                <button onClick={closeOverlay} className="handwritten w-full mt-6 text-xs bg-transparent border-none cursor-pointer hover:opacity-60" style={{ color: "rgba(200,137,31,0.3)" }}>esc to close</button>
              </div>
            )}

            {/* ── Headphones overlay ── */}
            {overlay === "headphones" && (
              <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(20,12,5,0.92)", border: "1px solid rgba(200,137,31,0.18)" }}>
                <p className="handwritten mb-1" style={{ color: "rgba(200,137,31,0.4)", fontSize: "0.65rem", letterSpacing: "0.15em" }}>LISTENING MODE</p>
                <p className="serif mb-8" style={{ color: "rgba(240,226,190,0.6)", fontStyle: "italic", fontSize: "0.82rem" }}>How do you want to listen tonight?</p>
                <div className="flex flex-col gap-3">
                  {LISTENING_MODES.map(mode => (
                    <button key={mode} onClick={() => {
                      setListeningMode(mode)
                      setHeadphoneSwing(true)
                      setTimeout(() => setHeadphoneSwing(false), 1200)
                      closeOverlay()
                    }}
                      className="handwritten py-3 px-6 rounded-full border cursor-pointer transition-all duration-200 bg-transparent"
                      style={{ color: listeningMode === mode ? "rgba(232,169,74,0.95)" : "rgba(212,168,67,0.65)", borderColor: listeningMode === mode ? "rgba(200,137,31,0.5)" : "rgba(200,137,31,0.2)", fontSize: "1rem", background: listeningMode === mode ? "rgba(200,137,31,0.12)" : "transparent" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(200,137,31,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(232,169,74,0.9)" }}
                      onMouseLeave={e => { if (listeningMode !== mode) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(212,168,67,0.65)" } }}
                    >
                      🎧 {mode}
                    </button>
                  ))}
                </div>
                <button onClick={closeOverlay} className="handwritten mt-8 text-xs bg-transparent border-none cursor-pointer hover:opacity-60" style={{ color: "rgba(200,137,31,0.3)" }}>esc to close</button>
              </div>
            )}

            {/* ── Clock / Ambient Selection overlay ── */}
            {overlay === "clock" && (
              <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(20,12,5,0.92)", border: "1px solid rgba(200,137,31,0.18)" }}>
                <p className="handwritten mb-2" style={{ color: "rgba(200,137,31,0.4)", fontSize: "0.7rem", letterSpacing: "0.15em" }}>KOLKATA ROOM AMBIENCE</p>
                <h2 className="serif mb-6" style={{ color: "rgba(240,226,190,0.92)", fontSize: "1.8rem", fontStyle: "italic" }}>Why are you still awake?</h2>
                <p className="handwritten text-xs text-amber-warm/60 mb-6">Select a night mode to shift the room atmosphere.</p>
                <div className="flex flex-col gap-2.5">
                  {[
                    { name: "3 AM Thoughts (Deep Night)", hr: 3 },
                    { name: "Rain in Kolkata (Quiet Night)", hr: 2 },
                    { name: "Startup Nights (Busy Night)", hr: 23 },
                    { name: "For Overthinkers (Sunset Transitions)", hr: 20 },
                    { name: "Coding Through the Night (Pre-Dawn Sky)", hr: 5 }
                  ].map(pl => (
                    <button key={pl.name} onClick={() => {
                      setAmbientHour(pl.hr)
                      closeOverlay()
                    }} className="handwritten py-2.5 px-5 rounded-full border cursor-pointer transition-all duration-200 bg-transparent flex justify-between items-center"
                      style={{
                        color: ambientHour === pl.hr || (pl.hr === 3 && ambientHour === null) ? "rgba(232,169,74,0.95)" : "rgba(212,168,67,0.7)",
                        borderColor: ambientHour === pl.hr || (pl.hr === 3 && ambientHour === null) ? "rgba(232,169,74,0.4)" : "rgba(200,137,31,0.2)",
                        background: ambientHour === pl.hr || (pl.hr === 3 && ambientHour === null) ? "rgba(200,137,31,0.08)" : "transparent"
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(200,137,31,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(232,169,74,0.9)" }}
                      onMouseLeave={e => { 
                        if (ambientHour !== pl.hr && !(pl.hr === 3 && ambientHour === null)) {
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                          (e.currentTarget as HTMLElement).style.color = "rgba(212,168,67,0.7)"
                        }
                      }}
                    >
                      <span>✨ {pl.name}</span>
                      <span className="text-[10px] opacity-50">{pl.hr % 12 === 0 ? 12 : pl.hr % 12} {pl.hr >= 12 ? "PM" : "AM"}</span>
                    </button>
                  ))}
                </div>
                <button onClick={closeOverlay} className="handwritten mt-8 text-xs bg-transparent border-none cursor-pointer hover:opacity-60" style={{ color: "rgba(200,137,31,0.3)" }}>esc to close</button>
              </div>
            )}

            {/* ── Notebook spiral ruled Notes overlay ── */}
            {overlay === "notes" && (
              <div className="notebook-ruled rounded-xl p-8 max-h-[70vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 pb-2 border-b border-amber/20">
                  <p className="handwritten text-lg font-semibold" style={{ color: "rgba(100, 50, 10, 0.85)" }}>📓 TONIGHT'S NOTES</p>
                  <button onClick={closeOverlay} className="handwritten bg-transparent border-none cursor-pointer hover:opacity-60 text-sm" style={{ color: "rgba(100, 50, 10, 0.6)" }}>close [esc]</button>
                </div>
                <div className="flex flex-col gap-6 pl-10">
                  {NOTES.map((note, i) => (
                    <div key={i} className="relative">
                      <p className="handwritten text-[10px] absolute -left-12 top-0" style={{ color: "rgba(200, 100, 100, 0.7)" }}>{note.time}</p>
                      <p className="handwritten text-base leading-[28px]" style={{ color: "rgba(20, 10, 5, 0.85)" }}>{note.text}</p>
                    </div>
                  ))}
                  <div className="relative">
                    <p className="handwritten text-[10px] absolute -left-12 top-0" style={{ color: "rgba(200, 100, 100, 0.5)" }}>03:42 AM</p>
                    <p className="handwritten text-base leading-[28px] italic" style={{ color: "rgba(100, 70, 50, 0.85)" }}>About the Creator: Still writing code. Still listening to rain. Keep trying.</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Keyboard hints sticky notes — bottom right ── */}
      <div className="absolute bottom-8 right-8 z-20 fade-in" style={{ animationDelay: "1s" }}>
        <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-amber/25" style={{ background: "rgba(14, 8, 3, 0.85)", backdropFilter: "blur(12px)" }}>
          {[["Space", "play / pause"], ["← →", "prev / next"], ["R", "toggle rain"], ["B", "whiteboard"], ["T", "tea stall"], ["N", "notes"]].map(([key, desc]) => (
            <div key={key} className="flex items-center gap-2.5">
              <span className="handwritten font-bold text-[0.72rem]" style={{ minWidth: "38px", color: "#e8a94a" }}>[{key}]</span>
              <span className="handwritten text-[0.72rem]" style={{ color: "rgba(240,226,190,0.85)" }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
