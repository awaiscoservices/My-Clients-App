import { useEffect, useRef } from 'react'

// Fades/slides its children in the first time they scroll into view. (Styles: .rv / .rv.in in globals.css)
export default function Reveal({ as: Tag = 'div', delay = 0, y = 26, className = '', style, children, ...rest }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { el.classList.add('in'); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect() } }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <Tag ref={ref} className={`rv ${className}`} style={{ '--rv-d': `${delay}ms`, '--rv-y': `${y}px`, ...style }} {...rest}>{children}</Tag>
}
