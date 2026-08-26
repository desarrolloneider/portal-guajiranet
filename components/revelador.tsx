'use client'

import { useEffect } from 'react'

export function Revelador() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-revelar]'))
    if (!els.length) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.classList.add('visible'))
      return
    }

    const io = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return
          const el = e.target as HTMLElement
          el.style.transitionDelay = (el.dataset.delay || '0') + 'ms'
          el.classList.add('visible')
          io.unobserve(el)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -70px 0px' },
    )

    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return null
}
