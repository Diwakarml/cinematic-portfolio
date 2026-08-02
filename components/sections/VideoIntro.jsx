'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { FaPlay, FaPause, FaVolumeMute, FaVolumeUp } from 'react-icons/fa'
import { FiVideo, FiRadio } from 'react-icons/fi'
import { gsap } from '@/lib/gsap'
import profile from '@/data/profile.json'
import content from '@/data/content.json'
import styles from '@/styles/sections/VideoIntro.module.css'

const CinematicLayer = dynamic(() => import('@/components/three/CinematicLayer'), { ssr: false })

function scrollNext() {
  const main = document.querySelector('main')
  if (main) main.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
}

const VIDEO_SPEECH_TEXT = profile.speakingIntro

function getMaleVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null

  const maleNames   = ['david', 'mark', 'george', 'guy', 'ryan', 'liam', 'andrew', 'james', 'daniel', 'oliver', 'rishi', 'male']
  const femaleNames = ['zira', 'hazel', 'susan', 'catherine', 'samantha', 'victoria', 'karen', 'fiona', 'moira', 'veena', 'jenny', 'aria', 'sonia', 'neerja', 'female']

  const enVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'))

  // 1. Explicit male voice match
  for (const voice of enVoices) {
    const name = voice.name.toLowerCase()
    if (femaleNames.some(f => name.includes(f))) continue
    if (maleNames.some(m => name.includes(m))) return voice
  }

  // 2. Any English voice not in female names list
  for (const voice of enVoices) {
    const name = voice.name.toLowerCase()
    if (!femaleNames.some(f => name.includes(f))) return voice
  }

  return enVoices[0] || voices[0] || null
}

export default function VideoIntro() {
  const greetRef    = useRef(null)
  const nameRef     = useRef(null)
  const roleRef     = useRef(null)
  const scrollRef   = useRef(null)
  const imageRef    = useRef(null)
  const videoRef    = useRef(null)

  const [isMobile, setIsMobile] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted]     = useState(false)

  useEffect(() => {
    setIsMobile(window.matchMedia('(max-width: 767px)').matches)
  }, [])

  // Entrance animation
  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.4 })
    tl.fromTo(greetRef.current,  { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
      .fromTo(nameRef.current,   { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out' }, '-=0.2')
      .fromTo(roleRef.current,   { opacity: 0, y:  20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4')
      .fromTo(scrollRef.current, { opacity: 0 },         { opacity: 1, duration: 0.5 }, '-=0.1')
    return () => tl.kill()
  }, [])

  // Image fade-in
  useEffect(() => {
    const el = imageRef.current
    if (!el) return
    const t = gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' })
    return () => t.kill()
  }, [])

  // Interactive AI Video Playback with Speech Synthesis fallback
  const playVideoNarration = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    if (isPlaying) {
      if (videoRef.current) videoRef.current.pause()
      setIsPlaying(false)
      return
    }

    const video = videoRef.current
    if (video) {
      video.currentTime = 0
      video.muted = isMuted
      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => fallbackSpeechSynthesis())
    } else {
      fallbackSpeechSynthesis()
    }
  }

  const fallbackSpeechSynthesis = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    if (isPlaying) {
      setIsPlaying(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(VIDEO_SPEECH_TEXT)
    utterance.rate  = 0.96
    utterance.pitch = 1.0

    const maleVoice = getMaleVoice()
    if (maleVoice) utterance.voice = maleVoice

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend   = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)

    window.speechSynthesis.speak(utterance)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (video) {
      video.muted = !isMuted
      setIsMuted(!isMuted)
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isMuted) {
        window.speechSynthesis.resume()
        setIsMuted(false)
      } else {
        window.speechSynthesis.pause()
        setIsMuted(true)
      }
    }
  }

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  return (
    <section className={styles.section}>

      {/* 1 - Blurred ambient background image */}
      <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: isPlaying ? 'blur(16px)' : 'blur(28px)', transform: isPlaying ? 'scale(1.18)' : 'scale(1.12)', transition: 'all 0.8s ease', opacity: isPlaying ? 0.7 : 0.5, overflow: 'hidden' }}>
        <Image
          src="/assets/diwakar-photo.jpg"
          alt=""
          fill
          quality={80}
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: isMobile ? 'center 20%' : 'center top' }}
          aria-hidden="true"
          priority
        />
      </div>

      {/* 2 - Main image & AI video layer */}
      <div ref={imageRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, overflow: 'hidden', transform: isPlaying ? 'scale(1.03)' : 'scale(1)', transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <Image
          src="/assets/diwakar-photo.jpg"
          alt={profile.name.full}
          fill
          quality={100}
          sizes="100vw"
          style={{ objectFit: isMobile ? 'cover' : 'contain', objectPosition: isMobile ? 'center 20%' : '75% center' }}
          priority
        />
        <video
          ref={videoRef}
          src="/assets/Man_with_beard_glasses_speaking_202607312352_gwr_video_mvp.mp4"
          playsInline
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: isMobile ? 'cover' : 'contain',
            objectPosition: isMobile ? 'center 20%' : '75% center',
            opacity: isPlaying ? 1 : 0,
            pointerEvents: isPlaying ? 'auto' : 'none',
            transition: 'opacity 0.5s ease',
          }}
        />
      </div>

      {/* 3 - Cinematic gradient overlay */}
      <div className={styles.overlay} />

      {/* 4 - Three.js cinematic bokeh layer (desktop only) */}
      {!isMobile && <CinematicLayer />}

      {/* 5 - Landing text */}
      <div className={styles.heroContent}>
        <p ref={greetRef} className={styles.eyebrow}>{content.site.tagline}</p>
        <h1 ref={nameRef} className={styles.name}>
          {profile.name.first}<br />{profile.name.last}
        </h1>
        <p ref={roleRef} className={styles.role}>{profile.roles.detailed}</p>
      </div>

      {/* 6 - Soundwave Visualizer Bars & Status when playing */}
      {isPlaying && (
        <div style={{
          position: 'absolute',
          bottom: '5.5rem',
          right: '2rem',
          zIndex: 6,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(16px)',
          padding: '0.6rem 1.2rem',
          borderRadius: '30px',
          border: '1px solid rgba(247, 147, 30, 0.4)',
          color: '#fff',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}>
          <FiRadio className={styles.liveRadioIcon} style={{ color: 'var(--accent)', animation: 'spin 4s linear infinite' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            AI Video Presentation
          </span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '16px', marginLeft: '0.4rem' }}>
            <span style={{ width: '3px', background: 'var(--accent)', height: '100%', borderRadius: '2px', animation: 'eq1 0.6s ease-in-out infinite alternate' }} />
            <span style={{ width: '3px', background: 'var(--accent)', height: '60%', borderRadius: '2px', animation: 'eq2 0.8s ease-in-out infinite alternate' }} />
            <span style={{ width: '3px', background: 'var(--accent)', height: '80%', borderRadius: '2px', animation: 'eq3 0.5s ease-in-out infinite alternate' }} />
            <span style={{ width: '3px', background: 'var(--accent)', height: '40%', borderRadius: '2px', animation: 'eq4 0.7s ease-in-out infinite alternate' }} />
          </div>
        </div>
      )}

      {/* 7 - Interactive Play AI Video Presentation Button */}
      <div className={styles.controls}>
        <button
          onClick={playVideoNarration}
          className={styles.ctrlBtn}
          style={{
            width: 'auto',
            padding: '0.65rem 1.25rem',
            borderRadius: '30px',
            gap: '0.55rem',
            background: isPlaying ? 'var(--accent)' : 'rgba(255, 255, 255, 0.12)',
            borderColor: isPlaying ? 'var(--accent)' : 'rgba(255, 255, 255, 0.3)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.8rem',
            boxShadow: isPlaying ? '0 0 20px rgba(247, 147, 30, 0.5)' : 'none',
          }}
          title="Play AI Video Presentation"
        >
          {isPlaying ? <FaPause size={13} /> : <FaPlay size={13} style={{ marginLeft: '2px' }} />}
          <span>{isPlaying ? 'Pause Presentation' : 'Play AI Video Intro'}</span>
        </button>

        {isPlaying && (
          <button
            onClick={toggleMute}
            className={styles.ctrlBtn}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} />}
          </button>
        )}
      </div>

      {/* 8 - Scroll cue */}
      <button
        ref={scrollRef}
        className={styles.scrollCue}
        onClick={scrollNext}
        aria-label="Scroll to next section"
      >
        <span className={styles.scrollLabel}>Scroll</span>
        <span className={styles.scrollLine} />
      </button>

    </section>
  )
}
