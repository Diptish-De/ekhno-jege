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
  { title: "Special Night Mix", artist: "Late Night Beats", duration: "4:30", total: 270, ytId: "5RN7-wdKAKg" },
  { title: "Kun Faya Kun", artist: "A.R. Rahman", duration: "7:52", total: 472, ytId: "T94PHkuydcw" },
  { title: "O Re Piya", artist: "Rahat Fateh Ali Khan", duration: "5:12", total: 312, ytId: "iv7lcUkFVSc" },
  { title: "Iktara", artist: "Kavita Seth", duration: "4:21", total: 261, ytId: "akjdj6iHttY" },
  { title: "Agar Tum Saath Ho", artist: "Alka Yagnik & Arijit Singh", duration: "5:42", total: 342, ytId: "sK7riqg2mr4" },
  { title: "Phir Le Aya Dil", artist: "Arijit Singh", duration: "5:08", total: 308, ytId: "k6BnSIs3XUQ" },
  { title: "Tum Se Hi", artist: "Mohit Chauhan", duration: "5:21", total: 321, ytId: "Cb6wuzOurPc" },
  { title: "Kabira", artist: "Tochi Raina & Rekha Bhardwaj", duration: "3:43", total: 223, ytId: "jHNNMj5bNQw" },
  { title: "Aaoge Jab Tum", artist: "Rashid Khan", duration: "5:55", total: 355, ytId: "CNZMIhckaA0" },
  { title: "Choo Lo", artist: "The Local Train", duration: "3:53", total: 233, ytId: "sFMRqxCexDk" },
  { title: "Tune Kaha", artist: "Prateek Kuhad", duration: "3:24", total: 204, ytId: "dTu5dTEzVM4" },
  { title: "Waqt Ki Baatein", artist: "Dream Note", duration: "4:07", total: 247, ytId: "b-K4oDRk04M" },
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

const PLAYLISTS: Record<string, string> = {
  "90s Bollywood": "PLAFjPVdERAkt7jNU1XW7EWXHLyYyf7Sux",
  "90s": "PLAFjPVdERAkt7jNU1XW7EWXHLyYyf7Sux",
  "Ghazals": "PLlgtUI5-ajb5Z1cJY0YNNr9oukdSQ4SCU",
  "Late Night Songs": "PLmfcCDSUSykaj8VP1b5M_UKHTf9cKWrNS",
  "Late Night": "PLmfcCDSUSykaj8VP1b5M_UKHTf9cKWrNS",
  "Rainy Evening Mix": "PL9PwPs7-UT5xc9OveyAY7wRQvd2UyIQOt",
  "Rain Mode": "PL9PwPs7-UT5xc9OveyAY7wRQvd2UyIQOt",
  "Old Bengali Classics": "PLtgWTUdMPxCNhfFOxCw_8_K9aCU4vRVHo",
  "Rain": "PL9PwPs7-UT5xc9OveyAY7wRQvd2UyIQOt",
  "Nostalgia": "PLAFjPVdERAkt7jNU1XW7EWXHLyYyf7Sux",
  "Midnight": "PLmfcCDSUSykaj8VP1b5M_UKHTf9cKWrNS",
}

const LISTENING_MODES = ["Work", "Study", "Rain", "Nostalgia", "Midnight", "90s Bollywood", "Ghazals", "Late Night Songs", "Rainy Evening Mix", "Old Bengali Classics"]

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
  const [currentSong, setCurrentSong] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
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
  const [dynamicTrack, setDynamicTrack] = useState<{ title: string; artist: string } | null>(null)
  const [dynamicTotal, setDynamicTotal] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const toastTimerRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rainSynthRef = useRef<RainSynthesizer | null>(null)
  const ytPlayerRef = useRef<any>(null)
  const ytContainerRef = useRef<HTMLDivElement>(null)
  const currentSongRef = useRef(currentSong)
  currentSongRef.current = currentSong

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
    const container = ytContainerRef.current
    if (!container) return

    // Create a raw DOM element for YT.Player to replace — keeps it outside React's VDOM
    const playerEl = document.createElement("div")
    playerEl.id = "yt-player-target"
    container.innerHTML = ""
    container.appendChild(playerEl)

    const initPlayer = () => {
      if (ytPlayerRef.current) return // already initialised
      ytPlayerRef.current = new (window as any).YT.Player("yt-player-target", {
        height: "200",
        width: "200",
        videoId: SONGS[currentSongRef.current].ytId,
        playerVars: {
          playsinline: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          origin: window.location.origin,
          enablejsapi: 1,
        },
        events: {
          onReady: () => {
            setYtReady(true)
          },
          onError: (event: any) => {
            console.warn("YouTube player error (skipping):", event.data)
            setCurrentSong(s => (s + 1) % SONGS.length)
          },
          onStateChange: (event: any) => {
            const YT = (window as any).YT
            if (event.data === YT.PlayerState.PLAYING) {
              setPlaying(true)
            } else if (event.data === YT.PlayerState.PAUSED) {
              setPlaying(false)
            } else if (event.data === YT.PlayerState.ENDED) {
              // auto-advance to next song
              setCurrentSong(s => (s + 1) % SONGS.length)
            }
          },
        },
      })
    }

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer()
    } else {
      // Load the IFrame API script if not already present
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script")
        tag.src = "https://www.youtube.com/iframe_api"
        document.head.appendChild(tag)
      }
      (window as any).onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === "function") {
        ytPlayerRef.current.destroy()
        ytPlayerRef.current = null
        setYtReady(false)
      }
    }
  }, [])

  // Sync track loading from YT ID
  useEffect(() => {
    if (ytPlayerRef.current && ytReady) {
      try {
        ytPlayerRef.current.loadVideoById(song.ytId)
      } catch (e) {
        console.warn("YT loadVideoById failed:", e)
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

  // Poll YouTube video progress timeline and dynamic metadata
  useEffect(() => {
    let progressInterval: number | null = null
    if (playing && ytPlayerRef.current && ytReady) {
      progressInterval = window.setInterval(() => {
        try {
          const currentTime = Math.floor(ytPlayerRef.current.getCurrentTime() || 0)
          setProgress(currentTime)
          const duration = Math.floor(ytPlayerRef.current.getDuration() || 0)
          if (duration > 0 && dynamicTotal !== duration) {
            setDynamicTotal(duration)
          }
          const videoData = ytPlayerRef.current.getVideoData?.()
          if (videoData && videoData.title) {
            setDynamicTrack({
              title: videoData.title,
              artist: videoData.author || listeningMode || "YouTube"
            })
          }
        } catch (e) {}
      }, 500)
    } else {
      if (progressInterval) clearInterval(progressInterval)
    }
    return () => {
      if (progressInterval) clearInterval(progressInterval)
    }
  }, [playing, ytReady, listeningMode, dynamicTotal])

  const showComingSoon = (name?: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToastMessage(name ? `${name} — Coming Soon! ☕` : "Coming Soon! ☕")
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  const playModeOrPlaylist = (modeName: string) => {
    const playlistId = PLAYLISTS[modeName]
    if (playlistId && ytPlayerRef.current && ytReady) {
      setListeningMode(modeName)
      try {
        ytPlayerRef.current.loadPlaylist({
          list: playlistId,
          listType: "playlist",
          index: 0,
          startSeconds: 0,
        })
        setPlaying(true)
      } catch (e) {
        console.warn("loadPlaylist error:", e)
      }
    } else {
      showComingSoon(modeName)
    }
  }

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

  const prev = () => {
    if (listeningMode && PLAYLISTS[listeningMode] && ytPlayerRef.current?.previousVideo) {
      try {
        ytPlayerRef.current.previousVideo()
      } catch (e) {}
    } else {
      setDynamicTrack(null)
      setDynamicTotal(null)
      setCurrentSong(s => (s - 1 + SONGS.length) % SONGS.length)
      setProgress(0)
    }
  }

  const next = () => {
    if (listeningMode && PLAYLISTS[listeningMode] && ytPlayerRef.current?.nextVideo) {
      try {
        ytPlayerRef.current.nextVideo()
      } catch (e) {}
    } else {
      setDynamicTrack(null)
      setDynamicTotal(null)
      setCurrentSong(s => (s + 1) % SONGS.length)
      setProgress(0)
    }
  }
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
      {/* YouTube player wrapper — ref-based so React never reconciles the inner iframe */}
      <div 
        ref={ytContainerRef}
        className="absolute pointer-events-none overflow-hidden" 
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

        {/* Window Raindrops — strictly outside on the window glass pane (top-left), not inside the room */}
        {rainOn && (
          <div 
            className="absolute pointer-events-none overflow-hidden" 
            style={{ 
              left: "0%", 
              top: "0%", 
              width: "36%", 
              height: "55%", 
              zIndex: 12,
              maskImage: "linear-gradient(180deg, rgba(0,0,0,1) 70%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,1) 70%, transparent 100%)"
            }}
          >
            <div className="window-glass">
              <div className="raindrop-streak" style={{ left: "15%", animationDelay: "0s", animationDuration: "2.1s" }} />
              <div className="raindrop-streak" style={{ left: "32%", animationDelay: "0.5s", animationDuration: "2.8s" }} />
              <div className="raindrop-streak" style={{ left: "55%", animationDelay: "1.1s", animationDuration: "2.3s" }} />
              <div className="raindrop-streak" style={{ left: "75%", animationDelay: "0.2s", animationDuration: "2.6s" }} />
              <div className="raindrop-streak" style={{ left: "90%", animationDelay: "1.6s", animationDuration: "2.9s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Lightning Flash Overlay */}
      <div className={`lightning-flash ${lightningActive ? "flash-active" : ""}`} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 38%, rgba(8,4,1,0.62) 100%)" }} />

      {/* ── Bengali title — upper center ── */}
      <div className="absolute z-20 flex justify-center pointer-events-none fade-in px-4" style={{ top: "clamp(12px, 3vh, 32px)", left: 0, right: 0 }}>
        <img
          src={titleLogo}
          alt="এখনও জেগে"
          className="select-none max-w-[70vw] sm:max-w-[340px] md:max-w-[360px] h-auto object-contain"
          style={{ filter: "drop-shadow(0 4px 28px rgba(0,0,0,0.95))" }}
          draggable={false}
        />
      </div>

      {/* ── Night owls counter — bottom center ── */}
      <div className="absolute z-30 handwritten fade-in flex justify-center items-center gap-1.5 px-3 pointer-events-none" style={{ bottom: "max(12px, env(safe-area-inset-bottom, 12px))", left: 0, right: 0, color: "rgba(200,137,31,0.55)", fontSize: "clamp(0.68rem, 2.2vw, 0.78rem)", whiteSpace: "nowrap" }}>
        <span className="inline-block animate-pulse">🌙</span> {nightOwls} people are still awake
      </div>

      {/* ── Nav — top right on desktop, top floating pill row on mobile ── */}
      <nav className="absolute top-3 right-3 sm:top-5 sm:right-6 md:top-6 md:right-10 z-30 flex flex-wrap justify-end items-center gap-2 sm:gap-4 md:gap-6 fade-in max-w-[95vw]" style={{ animationDelay: "0.3s" }}>
        {[
          { label: "🌙 Tonight", key: "clock" as Overlay, click: () => {} },
          { label: "📼 Mixtapes", key: "headphones" as Overlay, click: () => {} },
          { label: "📌 Pinned", key: "whiteboard" as Overlay, click: () => { setWhiteboardTab(3); } },
          { label: "📓 Notes", key: "notes" as Overlay, click: () => {} },
          { label: "☕ Chai", key: "teaStall" as Overlay, click: () => {} },
        ].map(({ label, key, click }) => (
          <button
            key={label}
            className="handwritten cursor-pointer transition-all duration-300 px-2.5 py-1 sm:px-0 sm:py-0 rounded-full sm:rounded-none bg-black/40 sm:bg-transparent border border-amber/20 sm:border-none backdrop-blur-sm sm:backdrop-blur-none"
            style={{ color: overlay === key ? "rgba(232,169,74,0.95)" : "rgba(212,168,67,0.7)", fontSize: "clamp(0.78rem, 2.6vw, 0.95rem)" }}
            onClick={() => {
              if (click) click();
              if (key) setOverlay(o => o === key ? null : key);
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* ── Window Latch Rain Toggle Hotspot ── */}
      <div
        className="absolute z-20 cursor-pointer group"
        style={{ top: "36%", left: "6%", width: "12%", height: "12%", minWidth: "44px", minHeight: "44px" }}
        onClick={() => setRainOn(r => !r)}
        title={rainOn ? "Turn off rain sound" : "Turn on rain sound"}
      >
        <div className="absolute inset-0 rounded-lg bg-amber-warm/5 sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-[10px] sm:text-xs handwritten text-amber-warm select-none whitespace-nowrap bg-soft-black/85 px-2 py-0.5 rounded border border-amber/30 shadow-md">
            {rainOn ? "🌧 Close Latch" : "🌧 Open Latch"}
          </span>
        </div>
      </div>

      {/* ── Tea stall hotspot — aligned exactly over the yellow board sign ── */}
      <div
        className="absolute z-20 cursor-pointer group"
        style={{ top: "54%", left: "6%", width: "16%", height: "10%", minWidth: "50px", minHeight: "44px" }}
        onClick={() => setOverlay(o => o === "teaStall" ? null : "teaStall")}
      >
        <div
          className="absolute bottom-1 left-1/2 -translate-x-1/2 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 handwritten font-semibold text-center select-none bg-black/40 sm:bg-transparent px-1.5 py-0.5 rounded"
          style={{ color: "rgba(232,169,74,0.9)", fontSize: "clamp(0.68rem, 2vw, 0.76rem)", whiteSpace: "nowrap", borderBottom: "1.5px solid rgba(232,169,74,0.5)" }}
        >
          ☕ tea stall
        </div>
      </div>

      {/* ── Bookshelf hotspots (bottom-left) ── */}
      <div
        className="absolute z-20"
        style={{ top: "64%", left: "2%", width: "20%", height: "30%" }}
      >
        {BOOKS.map((book, idx) => (
          <div
            key={idx}
            className="absolute cursor-pointer group"
            style={{
              top: `${8 + idx * 17}%`,
              left: "5%",
              width: "90%",
              height: "16%",
            }}
            onClick={() => {
              if (idx === 4) {
                setOverlay("notes")
              } else {
                setListeningMode(book.playlist)
                setCurrentSong(Math.floor(Math.random() * SONGS.length))
                setPlaying(true)
              }
            }}
          >
            <div className="absolute inset-0 bg-amber-warm/5 opacity-0 group-hover:opacity-100 transition-opacity rounded" />
            <div className="absolute left-full ml-1 sm:ml-2 top-1/2 -translate-y-1/2 bg-soft-black/90 text-amber-warm text-[10px] handwritten px-2 py-0.5 rounded border border-amber/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-30">
              📖 {book.title}
            </div>
          </div>
        ))}
      </div>

      {/* ── Headphones hotspot ── */}
      <div
        className={`absolute z-20 cursor-pointer group ${headphoneSwing ? "swing" : ""}`}
        style={{ top: "78%", left: "16%", width: "14%", height: "12%", minWidth: "44px", minHeight: "44px" }}
        onClick={() => {
          setOverlay(o => o === "headphones" ? null : "headphones")
        }}
      >
        <div
          className="absolute -top-5 sm:-top-7 left-1/2 -translate-x-1/2 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 handwritten font-semibold text-center select-none bg-black/40 sm:bg-transparent px-1.5 py-0.5 rounded"
          style={{ color: "rgba(232,169,74,0.9)", fontSize: "clamp(0.68rem, 2vw, 0.74rem)", whiteSpace: "nowrap", borderBottom: "1.5px solid rgba(232,169,74,0.5)" }}
        >
          🎧 mixtape
        </div>
      </div>

      {/* ── Spider-Man poster 3D flip ── */}
      <div
        className="absolute z-20 cursor-pointer"
        style={{ top: "8%", right: "0%", width: "10%", maxWidth: "60px", height: "48%" }}
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
        style={{ bottom: "28%", left: "26%", width: "10%", height: "14%", background: "transparent" }}
        onClick={() => setLampOn(l => !l)}
        title={lampOn ? "Turn lamp off" : "Turn lamp on"}
      />

      {/* ── Music player — fully responsive card ── */}
      <div
        className="absolute z-30 fade-in transition-all duration-300"
        style={{
          bottom: "clamp(36px, 6.5vh, 60px)",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 32px)",
          maxWidth: "480px",
          borderRadius: "20px",
          padding: "clamp(12px, 3vw, 18px) clamp(14px, 4vw, 24px)",
          animationDelay: "0.6s",
          background: "rgba(14, 8, 3, 0.45)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          border: "1px solid rgba(200,137,31,0.14)",
          boxShadow: "0 8px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(232,169,74,0.06)",
        }}
      >
        {listeningMode && (
          <div className="handwritten text-center mb-1.5" style={{ color: "rgba(200,137,31,0.75)", fontSize: "0.72rem", letterSpacing: "0.1em" }}>
            ✨ {listeningMode.toUpperCase()} MODE
          </div>
        )}
        <div className="flex items-center justify-between gap-3 mb-2.5 sm:mb-3">
          <div className="min-w-0 flex-1">
            <p className="serif font-medium truncate" style={{ color: "rgba(240,226,190,0.95)", fontSize: "clamp(0.88rem, 3.2vw, 1.05rem)", lineHeight: 1.2 }}>{dynamicTrack?.title || song.title}</p>
            <p className="handwritten mt-0.5 truncate" style={{ color: "rgba(200,137,31,0.75)", fontSize: "clamp(0.76rem, 2.8vw, 0.85rem)" }}>{dynamicTrack?.artist || song.artist}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => setLiked(l => !l)} className="bg-transparent border-none cursor-pointer p-1.5 transition-all duration-200 hover:scale-110 active:scale-95" style={{ color: liked ? "#e8a94a" : "rgba(200,137,31,0.45)" }}>
              {liked ? (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" className="text-amber-warm"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              )}
            </button>
            <button onClick={() => setLooping(l => !l)} className="bg-transparent border-none cursor-pointer p-1.5 transition-all duration-200 hover:scale-110 active:scale-95" style={{ color: looping ? "#e8a94a" : "rgba(200,137,31,0.45)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={looping ? "text-amber-warm" : ""}>
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </button>
            {/* Quick Queue Toggle on mobile inside player */}
            <button onClick={() => setDrawerOpen(d => !d)} className="sm:hidden bg-transparent border border-amber/30 rounded-lg p-1.5 cursor-pointer text-amber-warm/80 text-xs handwritten flex items-center gap-1 active:scale-95">
              <span>📋</span>
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2.5 mb-2.5 sm:mb-3">
          <span className="handwritten tabular-nums" style={{ color: "rgba(200,137,31,0.55)", fontSize: "0.72rem", minWidth: "28px" }}>{formatTime(progress)}</span>
          <div className="relative flex-1 flex items-center py-2 cursor-pointer" style={{ height: "16px" }}>
            <div className="w-full rounded-full relative" style={{ height: "4px", background: "rgba(200,137,31,0.2)" }}>
              <div className="absolute left-0 top-0 h-full rounded-full transition-[width] duration-150" style={{ width: `${(progress / (dynamicTotal || song.total)) * 100}%`, background: "linear-gradient(90deg, #a06818, #e8a94a)" }} />
            </div>
            <input type="range" min={0} max={dynamicTotal || song.total} value={progress} onChange={e => handleProgressChange(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer" style={{ height: "100%" }} />
          </div>
          <span className="handwritten tabular-nums" style={{ color: "rgba(200,137,31,0.45)", fontSize: "0.72rem", minWidth: "28px", textAlign: "right" }}>{dynamicTotal ? formatTime(dynamicTotal) : song.duration}</span>
        </div>

        <div className="flex items-center justify-center gap-7 sm:gap-9">
          <button onClick={prev} className="bg-transparent border-none cursor-pointer p-2 flex items-center justify-center active:scale-90" title="Previous Song">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-warm opacity-85 hover:opacity-100 hover:scale-105 transition-all duration-200"><polygon points="19 20 9 12 19 4 19 20" fill="currentColor"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
          </button>
          <button
            onClick={togglePlay}
            className="flex items-center justify-center rounded-full border-none cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 animate-glow"
            style={{ width: "46px", height: "46px", background: "radial-gradient(circle at 40% 35%, rgba(232,169,74,0.28) 0%, rgba(160,104,24,0.18) 100%)", border: "1px solid rgba(200,137,31,0.5)", color: "#e8a94a", boxShadow: "0 0 16px rgba(200,137,31,0.22)" }}
          >
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            )}
          </button>
          <button onClick={next} className="bg-transparent border-none cursor-pointer p-2 flex items-center justify-center active:scale-90" title="Next Song">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-warm opacity-85 hover:opacity-100 hover:scale-105 transition-all duration-200"><polygon points="5 4 15 12 5 20 5 4" fill="currentColor"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
          </button>
        </div>
      </div>

      {/* ── Playlist drawer handle — hidden on very small screens, integrated into player ── */}
      <button
        className="hidden sm:block absolute z-30 handwritten cursor-pointer"
        style={{
          right: drawerOpen ? "min(340px, 85vw)" : "0", top: "50%", transform: "translateY(-50%)",
          background: "rgba(20,12,5,0.85)", border: "1px solid rgba(200,137,31,0.25)", borderRight: "none",
          color: "rgba(212,168,67,0.7)", padding: "12px 8px", borderRadius: "8px 0 0 8px",
          fontSize: "0.75rem", writingMode: "vertical-rl", letterSpacing: "0.1em",
          backdropFilter: "blur(12px)", transition: "right 0.35s ease",
        }}
        onClick={() => setDrawerOpen(d => !d)}
      >
        {drawerOpen ? "close" : "tonight's queue"}
      </button>

      {/* ── Playlist Drawer Modal/Panel ── */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-full z-50 drawer-in flex flex-col w-full sm:w-[85vw] md:w-[320px] max-w-[360px] p-6 sm:p-7" style={{ background: "rgba(14,8,3,0.94)", backdropFilter: "blur(28px)", borderLeft: "1px solid rgba(200,137,31,0.18)" }}>
            <div className="flex justify-between items-center mb-4 shrink-0 border-b border-amber/20 pb-3">
              <h3 className="handwritten text-lg font-bold" style={{ color: "rgba(212,168,67,0.9)" }}>Tonight's Queue</h3>
              <button onClick={() => setDrawerOpen(false)} className="handwritten text-xs px-2 py-1 rounded border border-amber/30 text-amber-warm bg-transparent cursor-pointer">close</button>
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto flex-1 pr-1">
              {SONGS.map((s, i) => (
                <button 
                  key={i} 
                  onClick={() => { 
                    setListeningMode(null);
                    setDynamicTrack(null);
                    setDynamicTotal(null);
                    setCurrentSong(i); 
                    setProgress(0); 
                    setPlaying(true); 
                    if (ytPlayerRef.current && ytReady) {
                      try {
                        ytPlayerRef.current.loadVideoById({ videoId: s.ytId, startSeconds: 0 });
                        ytPlayerRef.current.playVideo();
                      } catch(e) {
                        console.warn("Direct play failed:", e);
                      }
                    }
                  }} 
                  className="flex items-start gap-3 text-left py-2.5 px-2.5 rounded-lg bg-transparent border-none cursor-pointer transition-all active:bg-amber-warm/15" 
                  style={{ background: currentSong === i && !listeningMode ? "rgba(200,137,31,0.18)" : "transparent", borderBottom: "1px solid rgba(200,137,31,0.08)" }}
                >
                  <span className="handwritten text-xs mt-0.5" style={{ color: "rgba(200,137,31,0.5)", minWidth: "18px" }}>{String(i + 1).padStart(2, "0")}.</span>
                  <div className="min-w-0 flex-1">
                    <p className="serif text-xs truncate" style={{ color: currentSong === i && !listeningMode ? "rgba(232,169,74,0.95)" : "rgba(240,230,200,0.8)", fontSize: "0.85rem" }}>{s.title}</p>
                    <p className="handwritten text-xs truncate" style={{ color: "rgba(200,137,31,0.55)", fontSize: "0.72rem" }}>{s.artist}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="handwritten text-center shrink-0 pt-3" style={{ color: "rgba(200,137,31,0.4)", fontSize: "0.7rem" }}>03:42 AM — still awake</p>
          </div>
        </>
      )}

      {/* ── Tea Stall Sliding Paper Menu ── */}
      <div className={`sliding-paper-menu ${overlay === 'teaStall' ? 'open' : ''}`}>
        <div className="flex justify-between items-center mb-3 border-b border-brown-mid/20 pb-2">
          <span className="text-base sm:text-lg font-bold">☕ Tea Stall Recommendations</span>
          <button onClick={() => setOverlay(null)} className="cursor-pointer text-xs border border-brown-mid/30 hover:bg-brown-mid/10 rounded-full px-2.5 py-0.5 font-bold">close</button>
        </div>
        <p className="serif text-[12px] sm:text-[13px] italic mb-3 opacity-85 leading-snug">The chaiwala knows exactly what you need to keep going.</p>
        <div className="flex flex-col gap-1.5">
          {TEA_MENU.map((item) => (
            <button
              key={item}
              onClick={() => {
                playModeOrPlaylist(item)
                setOverlay(null)
              }}
              className="text-left py-1.5 px-2.5 rounded-lg border-none cursor-pointer bg-transparent hover:bg-amber-warm/20 transition-all text-sm sm:text-base flex items-center gap-1.5"
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
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 overlay-in" style={{ background: "rgba(8,4,1,0.85)", backdropFilter: "blur(12px)" }} onClick={closeOverlay}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-[500px] max-h-[85vh] overflow-y-auto">

            {/* ── Whiteboard overlay ── */}
            {overlay === "whiteboard" && (
              <div className="rounded-2xl p-5 sm:p-8" style={{ background: "rgba(20,12,5,0.94)", border: "1px solid rgba(200,137,31,0.22)" }}>
                <p className="handwritten mb-4 text-center" style={{ color: "rgba(200,137,31,0.6)", fontSize: "0.75rem", letterSpacing: "0.15em" }}>WHITEBOARD</p>
                <div className="flex gap-1.5 sm:gap-2 mb-5 flex-wrap justify-center">
                  {WHITEBOARD_SECTIONS.map((sec, i) => (
                    <button key={i} onClick={() => setWhiteboardTab(i)} className="handwritten border-none cursor-pointer rounded-full px-2.5 sm:px-3 py-1 text-xs transition-all duration-200"
                      style={{ background: whiteboardTab === i ? "rgba(200,137,31,0.2)" : "transparent", color: whiteboardTab === i ? "rgba(232,169,74,0.95)" : "rgba(212,168,67,0.5)", border: `1px solid ${whiteboardTab === i ? "rgba(200,137,31,0.4)" : "rgba(200,137,31,0.15)"}` }}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>
                <div>
                  <p className="handwritten mb-3 text-center" style={{ color: "rgba(200,137,31,0.65)", fontSize: "0.8rem" }}>{WHITEBOARD_SECTIONS[whiteboardTab].icon} {WHITEBOARD_SECTIONS[whiteboardTab].action}</p>
                  <div className="flex flex-col gap-1.5">
                    {WHITEBOARD_SECTIONS[whiteboardTab].songs.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 active:bg-amber-warm/15" style={{ borderBottom: "1px solid rgba(200,137,31,0.08)" }}
                        onClick={() => {
                          if (PLAYLISTS[item]) {
                            playModeOrPlaylist(item)
                            closeOverlay()
                          } else {
                            const songIdx = SONGS.findIndex(s => s.title.toLowerCase() === item.toLowerCase())
                            if (songIdx !== -1) {
                              setListeningMode(null)
                              setDynamicTrack(null)
                              setDynamicTotal(null)
                              setCurrentSong(songIdx)
                              setPlaying(true)
                              if (ytPlayerRef.current && ytReady) {
                                try {
                                  ytPlayerRef.current.loadVideoById({ videoId: SONGS[songIdx].ytId, startSeconds: 0 })
                                  ytPlayerRef.current.playVideo()
                                } catch(e) {}
                              }
                              closeOverlay()
                            } else {
                              showComingSoon(item)
                            }
                          }
                        }}
                      >
                        <span className="handwritten" style={{ color: "rgba(200,137,31,0.4)", fontSize: "0.7rem", minWidth: "16px" }}>{String(i + 1).padStart(2, "0")}.</span>
                        <span className="serif text-sm sm:text-base" style={{ color: "rgba(240,226,190,0.85)" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={closeOverlay} className="handwritten w-full mt-6 text-sm bg-transparent border-none cursor-pointer hover:opacity-75 transition-opacity" style={{ color: "rgba(200,137,31,0.5)" }}>tap anywhere / close</button>
              </div>
            )}

            {/* ── Books bookshelf overlay ── */}
            {overlay === "books" && (
              <div className="rounded-2xl p-5 sm:p-8" style={{ background: "rgba(20,12,5,0.94)", border: "1px solid rgba(200,137,31,0.22)" }}>
                <p className="handwritten mb-5 text-center" style={{ color: "rgba(200,137,31,0.6)", fontSize: "0.75rem", letterSpacing: "0.15em" }}>BOOKSHELF</p>
                <div className="flex flex-col gap-2">
                  {BOOKS.map((book, i) => (
                    <button key={i} onClick={() => {
                      if (i === 4) {
                        setOverlay("notes")
                      } else if (PLAYLISTS[book.playlist]) {
                        playModeOrPlaylist(book.playlist)
                        closeOverlay()
                      } else {
                        showComingSoon(book.playlist)
                      }
                    }} className="flex items-center justify-between py-2.5 px-3.5 rounded-lg bg-transparent border-none cursor-pointer transition-all duration-200 text-left active:bg-amber-warm/15"
                      style={{ borderBottom: "1px solid rgba(200,137,31,0.08)" }}
                    >
                      <span className="serif text-xs sm:text-sm" style={{ color: "rgba(240,226,190,0.85)" }}>{book.title}</span>
                      <span className="handwritten text-xs sm:text-sm" style={{ color: "rgba(200,137,31,0.6)" }}>→ {book.playlist}</span>
                    </button>
                  ))}
                </div>
                <button onClick={closeOverlay} className="handwritten w-full mt-6 text-sm bg-transparent border-none cursor-pointer hover:opacity-75" style={{ color: "rgba(200,137,31,0.5)" }}>tap anywhere / close</button>
              </div>
            )}

            {/* ── Headphones overlay ── */}
            {overlay === "headphones" && (
              <div className="rounded-2xl p-5 sm:p-8 text-center" style={{ background: "rgba(20,12,5,0.94)", border: "1px solid rgba(200,137,31,0.22)" }}>
                <p className="handwritten mb-1" style={{ color: "rgba(200,137,31,0.6)", fontSize: "0.75rem", letterSpacing: "0.15em" }}>LISTENING MODE</p>
                <p className="serif mb-6" style={{ color: "rgba(240,226,190,0.7)", fontStyle: "italic", fontSize: "0.85rem" }}>How do you want to listen tonight?</p>
                <div className="flex flex-col gap-2.5">
                  {LISTENING_MODES.map(mode => (
                    <button key={mode} onClick={() => {
                      playModeOrPlaylist(mode)
                      setHeadphoneSwing(true)
                      setTimeout(() => setHeadphoneSwing(false), 1200)
                      closeOverlay()
                    }}
                      className="handwritten py-2.5 px-5 rounded-full border cursor-pointer transition-all duration-200 bg-transparent active:scale-95"
                      style={{ color: listeningMode === mode ? "rgba(232,169,74,0.95)" : "rgba(212,168,67,0.75)", borderColor: listeningMode === mode ? "rgba(200,137,31,0.6)" : "rgba(200,137,31,0.25)", fontSize: "1rem", background: listeningMode === mode ? "rgba(200,137,31,0.15)" : "transparent" }}
                    >
                      🎧 {mode}
                    </button>
                  ))}
                </div>
                <button onClick={closeOverlay} className="handwritten mt-6 text-sm bg-transparent border-none cursor-pointer hover:opacity-75" style={{ color: "rgba(200,137,31,0.5)" }}>tap anywhere / close</button>
              </div>
            )}

            {/* ── Clock / Ambient Selection overlay ── */}
            {overlay === "clock" && (
              <div className="rounded-2xl p-5 sm:p-8 text-center" style={{ background: "rgba(20,12,5,0.94)", border: "1px solid rgba(200,137,31,0.22)" }}>
                <p className="handwritten mb-2" style={{ color: "rgba(200,137,31,0.6)", fontSize: "0.75rem", letterSpacing: "0.15em" }}>KOLKATA ROOM AMBIENCE</p>
                <h2 className="serif mb-4 text-xl sm:text-2xl" style={{ color: "rgba(240,226,190,0.95)", fontStyle: "italic" }}>Why are you still awake?</h2>
                <p className="handwritten text-xs text-amber-warm/70 mb-5">Select a night mode to shift the room atmosphere.</p>
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
                    }} className="handwritten py-2 px-4 rounded-full border cursor-pointer transition-all duration-200 bg-transparent flex justify-between items-center text-xs sm:text-sm active:scale-95"
                      style={{
                        color: ambientHour === pl.hr || (pl.hr === 3 && ambientHour === null) ? "rgba(232,169,74,0.95)" : "rgba(212,168,67,0.75)",
                        borderColor: ambientHour === pl.hr || (pl.hr === 3 && ambientHour === null) ? "rgba(232,169,74,0.5)" : "rgba(200,137,31,0.25)",
                        background: ambientHour === pl.hr || (pl.hr === 3 && ambientHour === null) ? "rgba(200,137,31,0.12)" : "transparent"
                      }}
                    >
                      <span className="truncate pr-2">✨ {pl.name}</span>
                      <span className="text-[10px] opacity-60 shrink-0">{pl.hr % 12 === 0 ? 12 : pl.hr % 12} {pl.hr >= 12 ? "PM" : "AM"}</span>
                    </button>
                  ))}
                </div>
                <button onClick={closeOverlay} className="handwritten mt-6 text-sm bg-transparent border-none cursor-pointer hover:opacity-75" style={{ color: "rgba(200,137,31,0.5)" }}>tap anywhere / close</button>
              </div>
            )}

            {/* ── Notebook spiral ruled Notes overlay ── */}
            {overlay === "notes" && (
              <div className="notebook-ruled rounded-xl p-5 sm:p-8 max-h-[75vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-5 pb-2 border-b border-amber/20">
                  <p className="handwritten text-base sm:text-lg font-semibold" style={{ color: "rgba(100, 50, 10, 0.9)" }}>📓 TONIGHT'S NOTES</p>
                  <button onClick={closeOverlay} className="handwritten bg-transparent border-none cursor-pointer hover:opacity-75 text-xs sm:text-sm" style={{ color: "rgba(100, 50, 10, 0.7)" }}>close [esc]</button>
                </div>
                <div className="flex flex-col gap-5 pl-7 sm:pl-10">
                  {NOTES.map((note, i) => (
                    <div key={i} className="relative">
                      <p className="handwritten text-[10px] absolute -left-8 sm:-left-12 top-0" style={{ color: "rgba(200, 100, 100, 0.8)" }}>{note.time}</p>
                      <p className="handwritten text-sm sm:text-base leading-[26px] sm:leading-[28px]" style={{ color: "rgba(20, 10, 5, 0.9)" }}>{note.text}</p>
                    </div>
                  ))}
                  <div className="relative">
                    <p className="handwritten text-[10px] absolute -left-8 sm:-left-12 top-0" style={{ color: "rgba(200, 100, 100, 0.6)" }}>03:42 AM</p>
                    <p className="handwritten text-sm sm:text-base leading-[26px] sm:leading-[28px] italic" style={{ color: "rgba(100, 70, 50, 0.9)" }}>About the Creator: Still writing code. Still listening to rain. Keep trying.</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Keyboard hints sticky notes — hidden on mobile screens ── */}
      <div className="hidden md:block absolute bottom-8 right-8 z-20 fade-in" style={{ animationDelay: "1s" }}>
        <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-amber/25" style={{ background: "rgba(14, 8, 3, 0.85)", backdropFilter: "blur(12px)" }}>
          {[["Space", "play / pause"], ["← →", "prev / next"], ["R", "toggle rain"], ["B", "whiteboard"], ["T", "tea stall"], ["N", "notes"]].map(([key, desc]) => (
            <div key={key} className="flex items-center gap-2.5">
              <span className="handwritten font-bold text-[0.72rem]" style={{ minWidth: "38px", color: "#e8a94a" }}>[{key}]</span>
              <span className="handwritten text-[0.72rem]" style={{ color: "rgba(240,226,190,0.85)" }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Coming Soon Toast Notification ── */}
      {toastMessage && (
        <div className="fixed top-6 sm:top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none fade-in w-max max-w-[90vw]">
          <div className="flex items-center gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border border-amber-warm/40 shadow-2xl"
            style={{
              background: "rgba(20, 12, 5, 0.95)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 12px 36px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(232, 169, 74, 0.2)"
            }}
          >
            <span className="text-base sm:text-xl">☕</span>
            <span className="handwritten text-sm sm:text-lg font-bold text-amber-warm tracking-wide truncate">{toastMessage}</span>
          </div>
        </div>
      )}

    </div>
  )
}
