'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { gsap } from '@/lib/gsap'
import profile from '@/data/profile.json'
import styles from '@/styles/sections/ProjectsSection.module.css'

const PROJECTS = profile.projects

export default function ProjectsSection() {
  const trackRef  = useRef(null)
  const busyRef   = useRef(false)
  const [activeIdx, setActiveIdx] = useState(0)

  function goTo(nextIdx) {
    const n = PROJECTS.length
    if (nextIdx < 0 || nextIdx >= n || busyRef.current) return
    busyRef.current = true

    const track = trackRef.current
    if (!track) { busyRef.current = false; return }

    gsap.to(track, {
      xPercent: -(nextIdx * (100 / PROJECTS.length)),
      duration: 0.5,
      ease: 'power3.inOut',
      onComplete: () => {
        setActiveIdx(nextIdx)
        busyRef.current = false
      },
    })
  }

  return (
    <section className={styles.section}>

      {/* Top bar */}
      <div className={styles.topBar}>
        <span className={styles.sectionLabel}>Featured Work</span>
        <div className={styles.counter}>
          <span className={styles.cCur}>0{activeIdx + 1}</span>
          <span className={styles.cSep}> / </span>
          <span className={styles.cTot}>0{PROJECTS.length}</span>
        </div>
      </div>

      {/* Viewport & Sliding Track */}
      <div className={styles.viewport}>
        <div
          ref={trackRef}
          className={styles.track}
          style={{ width: `${PROJECTS.length * 100}%` }}
        >
          {PROJECTS.map((proj, i) => (
            <div key={proj.id} className={styles.slide} style={{ width: `${100 / PROJECTS.length}%` }}>

              {/* Background image & overlays */}
              <div className={styles.slideBg}>
                <Image
                  src={proj.image}
                  alt={proj.title}
                  fill
                  quality={95}
                  sizes="100vw"
                  className={styles.slideImg}
                  priority={i === 0}
                />
                <div className={styles.slideOverlayLeft}   aria-hidden />
                <div className={styles.slideOverlayBottom} aria-hidden />
                <div className={styles.slideVignette}      aria-hidden />
              </div>

              {/* Decorative background slide number */}
              <span className={styles.slideNum} aria-hidden>0{i + 1}</span>

              {/* Slide Content */}
              <div className={styles.slideContent}>

                {/* Left column: identity, title, demo button */}
                <div className={styles.slideLeft}>
                  <div className={styles.meta}>
                    <span className={styles.typeTag}>{proj.type}</span>
                  </div>
                  <h2 className={styles.title}>{proj.title}</h2>
                  <p  className={styles.subtitle}>{proj.subtitle}</p>
                  <a
                    href={proj.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.liveBtn}
                  >
                    <span>Live Demo</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                </div>

                {/* Right column: description, tech stack */}
                <div className={styles.slideRight}>
                  <p className={styles.desc}>{proj.desc}</p>
                  <div className={styles.stack}>
                    {proj.tech.map(t => (
                      <span key={t} className={styles.tag}>{t}</span>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons: Previous & Next */}
      <button
        className={`${styles.navBtn} ${styles.navBtnPrev}`}
        onClick={() => goTo(activeIdx - 1)}
        disabled={activeIdx === 0}
        aria-label="Previous project"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <button
        className={`${styles.navBtn} ${styles.navBtnNext}`}
        onClick={() => goTo(activeIdx + 1)}
        disabled={activeIdx === PROJECTS.length - 1}
        aria-label="Next project"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dot Pagination */}
      <div className={styles.dots} role="tablist" aria-label="Project navigation">
        {PROJECTS.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === activeIdx}
            aria-label={`Go to project ${i + 1}`}
            className={`${styles.dot} ${i === activeIdx ? styles.dotActive : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

    </section>
  )
}
