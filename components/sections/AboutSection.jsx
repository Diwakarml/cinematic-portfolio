'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { gsap } from '@/lib/gsap'
import { FaGithub, FaLinkedinIn, FaMedium, FaInstagram, FaYoutube } from 'react-icons/fa'
import { FiVolume2, FiVolumeX } from 'react-icons/fi'
import profile from '@/data/profile.json'
import styles from '@/styles/sections/AboutSection.module.css'

const BIO      = profile.bio
const WHO_ITEMS = profile.skills

const ICON_MAP = { GitHub: FaGithub, LinkedIn: FaLinkedinIn, Medium: FaMedium, Instagram: FaInstagram, YouTube: FaYoutube }

const SOCIALS = profile.socials.map(s => ({ Icon: ICON_MAP[s.label], href: s.href, label: s.label }))

function getMaleVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null

  const maleNames   = ['david', 'mark', 'george', 'guy', 'ryan', 'liam', 'andrew', 'james', 'daniel', 'oliver', 'rishi', 'male']
  const femaleNames = ['zira', 'hazel', 'susan', 'catherine', 'samantha', 'victoria', 'karen', 'fiona', 'moira', 'veena', 'jenny', 'aria', 'sonia', 'neerja', 'female']

  const enVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'))

  for (const voice of enVoices) {
    const name = voice.name.toLowerCase()
    if (femaleNames.some(f => name.includes(f))) continue
    if (maleNames.some(m => name.includes(m))) return voice
  }

  for (const voice of enVoices) {
    const name = voice.name.toLowerCase()
    if (!femaleNames.some(f => name.includes(f))) return voice
  }

  return enVoices[0] || voices[0] || null
}

export default function AboutSection() {
  const sectionRef  = useRef(null)
  const photoRef    = useRef(null)
  const contentRef  = useRef(null)
  const socialsRef  = useRef(null)
  const intervalRef = useRef(null)

  const [typed, setTyped] = useState(0)
  const [done,  setDone]  = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const toggleAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    } else {
      window.speechSynthesis.cancel()
      const textToSpeak = profile.speakingIntro || `Hi, I am ${profile.name.full}. ${profile.bio}`
      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.rate = 0.96
      utterance.pitch = 1.0

      const maleVoice = getMaleVoice()
      if (maleVoice) utterance.voice = maleVoice

      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      setIsSpeaking(true)
      window.speechSynthesis.speak(utterance)
    }
  }

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const scroller = document.querySelector('main')
    if (!scroller) return

    let isActive = false

    function resetAnim() {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
      }
      clearInterval(intervalRef.current)
      gsap.killTweensOf(photoRef.current)
      gsap.killTweensOf(contentRef.current)
      const socialIcons = socialsRef.current?.querySelectorAll('a') ?? []
      gsap.killTweensOf(socialIcons)
      gsap.set(photoRef.current,   { opacity: 0, x: -50 })
      gsap.set(contentRef.current, { opacity: 0, y:  40 })
      gsap.set(socialIcons, { opacity: 0, y: 20 })
      setTyped(0)
      setDone(false)
    }

    function playAnim() {
      resetAnim()
      gsap.to(photoRef.current,   { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out' })
      gsap.to(contentRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.15 })
      const socialIcons = socialsRef.current?.querySelectorAll('a') ?? []
      gsap.to(socialIcons, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.1, delay: 0.5 })

      let i = 0
      intervalRef.current = setInterval(() => {
        i = Math.min(i + 6, BIO.length)
        setTyped(i)
        if (i >= BIO.length) {
          clearInterval(intervalRef.current)
          setDone(true)
        }
      }, 16)
    }

    resetAnim()

    function onScroll() {
      const inRange = Math.abs(scroller.scrollTop - section.offsetTop) < window.innerHeight * 0.5
      if (inRange && !isActive)  { isActive = true;  playAnim() }
      if (!inRange && isActive)  { isActive = false; resetAnim() }
    }

    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearInterval(intervalRef.current)
      scroller.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <section ref={sectionRef} className={styles.section}>

      {/* ── Left: photo + signature + socials ───────── */}
      <div ref={photoRef} className={styles.photoCol}>
        <div className={styles.photoWrap}>
          <div className={styles.photoFrame} data-about-photo>
            <Image
              src="/assets/diwakar-photo.jpg"
              alt={profile.name.full}
              fill
              quality={100}
              sizes="(min-width: 768px) 30vw, 100vw"
              className={styles.photoImg}
            />
          </div>
          <p className={styles.signature}>{profile.name.first}</p>
        </div>

        {/* Social icons */}
        <div ref={socialsRef} className={styles.socials}>
          {SOCIALS.map(({ Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={styles.socialLink}
            >
              <Icon />
            </a>
          ))}
        </div>
      </div>

      {/* ── Right: content ───────────────────────────── */}
      <div ref={contentRef} className={styles.content}>

        {/* Who I Am header with Voiceover Audio button */}
        <div className={styles.headerRow}>
          <p className={styles.whoLabel}>Who I Am</p>
          <button
            type="button"
            onClick={toggleAudio}
            className={`${styles.audioBtn} ${isSpeaking ? styles.audioBtnActive : ''}`}
            aria-label={isSpeaking ? "Pause audio" : "Listen to audio about myself"}
          >
            {isSpeaking ? <FiVolumeX size={15} /> : <FiVolume2 size={15} />}
            <span>{isSpeaking ? 'Pause Audio' : 'Listen to Audio'}</span>
          </button>
        </div>
        <div className={styles.marqueeWrap}>
          <div className={styles.marqueeTrack}>
            {[...WHO_ITEMS, ...WHO_ITEMS].map((item, i) => (
              <span key={i} className={styles.marqueeItem}>
                {item}
                <span className={styles.marqueeDot}>·</span>
              </span>
            ))}
          </div>
        </div>

        {/* Bio text - typewriter: all chars always in DOM, only color changes */}
        <div className={styles.bioWrap}>
          <p className={styles.bio}>
            {BIO.split('').map((char, i) => (
              <span
                key={i}
                className={
                  i < typed
                    ? (i === typed - 1 && !done ? styles.lastTyped : styles.typed)
                    : styles.untyped
                }
              >
                {char}
              </span>
            ))}
          </p>
        </div>

      </div>
    </section>
  )
}
