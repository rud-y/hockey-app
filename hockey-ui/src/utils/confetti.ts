const COLORS = ['#22c55e', '#4ade80', '#60a5fa', '#fbbf24', '#f472b6', '#ffffff']

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  rotationSpeed: number
  life: number
}

/**
 * Fires a full-viewport confetti burst for ~3 seconds.
 */
export function celebrateStanleyCup(durationMs = 3000): () => void {
  const canvas = document.createElement('canvas')
  canvas.className = 'stanley-cup-confetti'
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '9999',
  })
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    return () => undefined
  }

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  const particles: Particle[] = []
  const spawn = (count: number) => {
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 8,
        vy: 2 + Math.random() * 5,
        size: 4 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        life: 1,
      })
    }
  }

  spawn(120)
  const spawnInterval = window.setInterval(() => spawn(40), 280)

  let frameId = 0
  const startedAt = performance.now()

  const tick = (now: number) => {
    const elapsed = now - startedAt
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i]
      p.vy += 0.08
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.rotationSpeed
      if (elapsed > durationMs * 0.7) {
        p.life -= 0.02
      }
      if (p.life <= 0 || p.y > canvas.height + 40) {
        particles.splice(i, 1)
        continue
      }

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.globalAlpha = Math.max(0, p.life)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      ctx.restore()
    }

    if (elapsed < durationMs || particles.length > 0) {
      frameId = requestAnimationFrame(tick)
    } else {
      cleanup()
    }
  }

  frameId = requestAnimationFrame(tick)

  const cleanup = () => {
    window.clearInterval(spawnInterval)
    cancelAnimationFrame(frameId)
    window.removeEventListener('resize', resize)
    canvas.remove()
  }

  window.setTimeout(cleanup, durationMs + 1500)
  return cleanup
}
