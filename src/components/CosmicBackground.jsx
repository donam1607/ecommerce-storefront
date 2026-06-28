import { useEffect, useRef, useState } from "react";

/**
 * CosmicBackground — fixed full-page starfield rendered only in dark mode.
 * Layers: deep-space nebula glow → 340 twinkling stars → plexus network → shooting stars.
 * Detects dark mode via MutationObserver on <html class="dark">.
 */
export default function CosmicBackground() {
  const canvasRef = useRef(null);
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains("dark")
  );
  const [isMobile, setIsMobile] = useState(true); // Default check on mount

  useEffect(() => {
    const checkMobile = () => {
      const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const touchCapable = window.matchMedia("(pointer: coarse)").matches;
      setIsMobile(mobileUA || touchCapable);
    };
    checkMobile();
  }, []);

  // Watch dark mode changes
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Canvas animation — only runs while isDark
  useEffect(() => {
    if (!isDark) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let w = 0, h = 0;

    const setSize = () => {
      w = canvas.width  = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    setSize();
    window.addEventListener("resize", setSize);

    /* ── STARS ── */
    /* ── STARS ── */
    const STAR_COUNT = isMobile ? 80 : 380;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(),   // normalized 0-1 so resize doesn't scatter them
      y: Math.random(),
      r: Math.random() * (isMobile ? 1.2 : 1.8) + 0.15,
      baseAlpha: Math.random() * 0.7 + 0.28,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.020 + 0.005,
      hue: Math.random() < 0.70 ? Math.floor(Math.random() * 55 + 195) : Math.floor(Math.random() * 40 + 35),
      sat: Math.random() < 0.55 ? 75 : 5,
    }));

    /* ── PLEXUS NODES ── */
    // plexus nodes are completely disabled on mobile (0 nodes) to save nested loop distance calculations
    const NODE_COUNT = isMobile ? 0 : 60;
    const MAX_DIST   = 150;
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.3 + 0.4,
      alpha: Math.random() * 0.38 + 0.35,
      hue: Math.floor(Math.random() * 55 + 198),
    }));

    /* ── SHOOTING STARS ── */
    let shooters = [];
    const spawnShooter = () => {
      if (isMobile && Math.random() > 0.3) return; // spawn less shooting stars on mobile
      shooters.push({
        x: Math.random() * w * 0.8,
        y: Math.random() * h * 0.5,
        len: Math.random() * (isMobile ? 80 : 140) + 40,
        speed: Math.random() * 13 + 8,
        alpha: 1,
        decay: Math.random() * 0.025 + 0.009,
        angle: Math.PI / 6 + (Math.random() - 0.5) * 0.55,
        bright: Math.random() * 0.3 + 0.7,
      });
    };
    const shootTimer = setInterval(spawnShooter, isMobile ? 3000 : 1400);
    spawnShooter(); spawnShooter();
    if (!isMobile) spawnShooter();

    /* ── NEBULA ORBS ── */
    const nebulae = [
      { cx: 0.10, cy: 0.18, r: 0.38, h: 218, a: 0.065 },
      { cx: 0.85, cy: 0.72, r: 0.30, h: 265, a: 0.055 },
      { cx: 0.50, cy: 0.05, r: 0.25, h: 195, a: 0.045 },
      { cx: 0.25, cy: 0.88, r: 0.20, h: 285, a: 0.04  },
      { cx: 0.72, cy: 0.35, r: 0.18, h: 240, a: 0.035 },
    ];

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      /* nebula glows */
      nebulae.forEach(n => {
        const gx = n.cx * w, gy = n.cy * h, gr = n.r * Math.max(w, h) * 0.65;
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        g.addColorStop(0,    `hsla(${n.h},75%,58%,${n.a})`);
        g.addColorStop(0.45, `hsla(${n.h},70%,52%,${n.a * 0.30})`);
        g.addColorStop(1,    `hsla(${n.h},60%,48%,0)`);
        ctx.beginPath();
        ctx.arc(gx, gy, gr, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });

      /* twinkling stars */
      stars.forEach(s => {
        s.phase += s.speed;
        const a = s.baseAlpha * (0.48 + 0.52 * Math.sin(s.phase));
        const sx = s.x * w, sy = s.y * h;
        if (s.r > 1.05) {
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.r * 5.5);
          glow.addColorStop(0, `hsla(${s.hue},${s.sat}%,96%,${a * 0.50})`);
          glow.addColorStop(1, `hsla(${s.hue},${s.sat}%,96%,0)`);
          ctx.beginPath();
          ctx.arc(sx, sy, s.r * 5.5, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue},${s.sat}%,97%,${a})`;
        ctx.fill();
      });

      /* plexus nodes + connecting lines */
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < -15) a.x = w + 15;
        if (a.x > w + 15) a.x = -15;
        if (a.y < -15) a.y = h + 15;
        if (a.y > h + 15) a.y = -15;

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(120,210,255,${(1 - dist / MAX_DIST) * 0.20})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${a.hue},82%,76%,${a.alpha})`;
        ctx.fill();
      }

      /* shooting stars */
      shooters = shooters.filter(s => s.alpha > 0);
      shooters.forEach(s => {
        const tx = s.x + Math.cos(s.angle) * s.len;
        const ty = s.y + Math.sin(s.angle) * s.len;
        const g = ctx.createLinearGradient(s.x, s.y, tx, ty);
        g.addColorStop(0,    `rgba(255,255,255,0)`);
        g.addColorStop(0.18, `rgba(180,235,255,${s.alpha * s.bright * 0.50})`);
        g.addColorStop(0.72, `rgba(225,248,255,${s.alpha * s.bright * 0.88})`);
        g.addColorStop(1,    `rgba(255,255,255,${s.alpha * s.bright})`);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = g;
        ctx.lineWidth = 2;
        ctx.stroke();
        // bright head dot
        ctx.beginPath();
        ctx.arc(tx, ty, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.alpha * s.bright})`;
        ctx.fill();

        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.alpha -= s.decay;
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(shootTimer);
      window.removeEventListener("resize", setSize);
    };
  }, [isDark, isMobile]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
        opacity: isDark ? 1 : 0,
        transition: "opacity 0.8s ease",
        background: isDark
          ? "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(29,78,216,0.18) 0%, transparent 65%), radial-gradient(ellipse 65% 55% at 85% 85%, rgba(88,50,220,0.14) 0%, transparent 60%), #020617"
          : "transparent",
      }}
    />
  );
}
