import { useEffect, useRef, useState } from 'react'

/**
 * Background YouTube player for Ludovico Einaudi - Experience.
 * Starts at 0:45 (the crescendo). Uses a real-sized but offscreen iframe
 * since browsers block 0x0 players.
 */
const YOUTUBE_VIDEO_ID = 'hN_q-_nGv4U'
const START_SECONDS = 48

export default function AudioPlayer() {
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [visible, setVisible] = useState(true)
  const playerRef = useRef(null)
  const fadeInterval = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    // Prevent duplicate init
    if (playerRef.current) return

    function createPlayer() {
      if (!containerRef.current || playerRef.current) return

      playerRef.current = new window.YT.Player(containerRef.current, {
        width: 320,
        height: 180,
        videoId: YOUTUBE_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          loop: 1,
          modestbranding: 1,
          playlist: YOUTUBE_VIDEO_ID,
          start: START_SECONDS,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            playerRef.current.setVolume(0)
            setReady(true)
          },
          onStateChange: (e) => {
            // When video ends and loops, seek back to start point
            if (e.data === window.YT.PlayerState.PLAYING) {
              const currentTime = playerRef.current.getCurrentTime()
              if (currentTime < START_SECONDS - 2) {
                playerRef.current.seekTo(START_SECONDS, true)
              }
            }
          },
        },
      })
    }

    if (window.YT && window.YT.Player) {
      createPlayer()
    } else {
      // Load API if not loaded
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev()
        createPlayer()
      }
    }

    return () => {
      if (fadeInterval.current) clearInterval(fadeInterval.current)
    }
  }, [])

  function togglePlay() {
    const p = playerRef.current
    if (!p) return

    if (fadeInterval.current) clearInterval(fadeInterval.current)

    if (!playing) {
      // Seek to start point and play
      p.seekTo(START_SECONDS, true)
      p.playVideo()
      // Fade in volume 0 -> 50 over 3s
      let vol = 0
      p.setVolume(0)
      fadeInterval.current = setInterval(() => {
        vol += 1
        if (vol >= 50) {
          vol = 50
          clearInterval(fadeInterval.current)
        }
        try { p.setVolume(vol) } catch {}
      }, 60)
      setPlaying(true)
      setTimeout(() => setVisible(false), 5000)
    } else {
      // Fade out
      let vol = 50
      try { vol = p.getVolume() } catch {}
      fadeInterval.current = setInterval(() => {
        vol -= 2
        if (vol <= 0) {
          vol = 0
          clearInterval(fadeInterval.current)
          try { p.pauseVideo() } catch {}
        }
        try { p.setVolume(vol) } catch {}
      }, 40)
      setPlaying(false)
      setVisible(true)
    }
  }

  return (
    <>
      {/* Real-sized iframe, positioned offscreen so browser doesn't block it */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '320px',
          height: '180px',
          opacity: 0.01,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <div ref={containerRef} />
      </div>

      {ready && (
        <button
          className={`audio-btn ${playing ? 'audio-playing' : ''} ${!visible && playing ? 'audio-hidden' : ''}`}
          onClick={togglePlay}
          onMouseEnter={() => playing && setVisible(true)}
          aria-label={playing ? 'Opreste muzica' : 'Porneste muzica'}
        >
          <span className="audio-icon">
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5,3 19,12 5,21" fill="currentColor" />
              </svg>
            )}
          </span>
          <span className="audio-label">
            {playing ? 'Einaudi' : 'Experience'}
          </span>
          {playing && (
            <span className="audio-bars">
              <span className="audio-bar" />
              <span className="audio-bar" />
              <span className="audio-bar" />
              <span className="audio-bar" />
            </span>
          )}
        </button>
      )}

      {playing && !visible && (
        <div
          className="audio-hover-zone"
          onMouseEnter={() => setVisible(true)}
        />
      )}
    </>
  )
}
