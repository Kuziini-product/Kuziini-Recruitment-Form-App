import { useEffect, useRef, useState } from 'react'

/**
 * Invisible YouTube background player for Ludovico Einaudi - Experience.
 * Shows a sleek floating play button. On click, fades in the music.
 */
const YOUTUBE_VIDEO_ID = 'hN_q-_nGv4U' // Ludovico Einaudi - Experience

export default function AudioPlayer() {
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [visible, setVisible] = useState(true)
  const playerRef = useRef(null)
  const fadeInterval = useRef(null)

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }

    function initPlayer() {
      playerRef.current = new window.YT.Player('yt-player-hidden', {
        height: '0',
        width: '0',
        videoId: YOUTUBE_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          loop: 1,
          playlist: YOUTUBE_VIDEO_ID,
        },
        events: {
          onReady: () => {
            playerRef.current.setVolume(0)
            setReady(true)
          },
        },
      })
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      if (fadeInterval.current) clearInterval(fadeInterval.current)
    }
  }, [])

  function togglePlay() {
    if (!playerRef.current) return

    if (!playing) {
      playerRef.current.playVideo()
      // Fade in volume from 0 to 40 over 3 seconds
      let vol = 0
      fadeInterval.current = setInterval(() => {
        vol += 1
        if (vol >= 40) {
          vol = 40
          clearInterval(fadeInterval.current)
        }
        playerRef.current.setVolume(vol)
      }, 75)
      setPlaying(true)

      // Hide button after 4 seconds
      setTimeout(() => setVisible(false), 4000)
    } else {
      // Fade out
      let vol = playerRef.current.getVolume()
      fadeInterval.current = setInterval(() => {
        vol -= 2
        if (vol <= 0) {
          vol = 0
          clearInterval(fadeInterval.current)
          playerRef.current.pauseVideo()
        }
        playerRef.current.setVolume(vol)
      }, 50)
      setPlaying(false)
      setVisible(true)
    }
  }

  return (
    <>
      <div id="yt-player-hidden" style={{ position: 'fixed', top: -9999, left: -9999 }} />

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

      {/* Hover zone to bring button back */}
      {playing && !visible && (
        <div
          className="audio-hover-zone"
          onMouseEnter={() => setVisible(true)}
        />
      )}
    </>
  )
}
