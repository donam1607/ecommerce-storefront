import { useEffect, useRef, useState } from "react";

/**
 * NebulaTrail — sparkling cyan/violet particle trail following the mouse.
 *
 * Active conditions (either one):
 *  1. Dark mode is enabled (anywhere on the page)
 *  2. Cursor is hovering over an element with [data-nebula-zone] attribute
 *     (typically the Hero section in light mode)
 *
 * Only runs on pointer-fine (non-touch) devices.
 */
export default function NebulaTrail() {
  const canvasRef = useRef(null);
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains("dark")
  );

  // Watch dark mode toggle
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    // Skip on touch-only devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animId;
    let w = window.innerWidth;
    let h = window.innerHeight;
    let mouseX = -999;
    let mouseY = -999;
    // Whether cursor is currently in a nebula zone (hero section)
    let inNebulaZone = false;

    const setSize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    setSize();
    window.addEventListener("resize", setSize);

    // Particle pool
    const particles = [];

    // Nebula color palette: cyan → blue → violet → pink
    const COLORS = [
      [180, 255, 255],  // cyan
      [140, 200, 255],  // sky blue
      [160, 140, 255],  // violet
      [220, 130, 255],  // purple
      [255, 160, 230],  // pink
      [100, 220, 255],  // light cyan
    ];

    const spawnParticles = (x, y) => {
      const count = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < count; i++) {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.2 + 0.3;
        const size = Math.random() * 2.5 + 0.5;
        particles.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 0.8,
          r: size,
          color,
          alpha: Math.random() * 0.7 + 0.4,
          decay: Math.random() * 0.025 + 0.012,
          sparkle: Math.random() > 0.6,
          sparklePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Check if cursor is inside a [data-nebula-zone] element
      const el = document.elementFromPoint(mouseX, mouseY);
      inNebulaZone = !!(el && el.closest("[data-nebula-zone]"));

      // Spawn only when dark mode OR inside hero nebula zone
      if (isDark || inNebulaZone) {
        spawnParticles(mouseX, mouseY);
      }
    };
    window.addEventListener("mousemove", onMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02;  // gentle gravity
        p.vx *= 0.98;  // slight drag
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        let displayAlpha = p.alpha;
        if (p.sparkle) {
          p.sparklePhase += 0.25;
          displayAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.sparklePhase));
        }

        const [r, g, b] = p.color;

        // Outer glow halo
        if (p.r > 1.2) {
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          glow.addColorStop(0, `rgba(${r},${g},${b},${displayAlpha * 0.4})`);
          glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${displayAlpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", setSize);
    };
    // Re-run effect when isDark changes so the closure captures the latest value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

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
        zIndex: 9998,
        mixBlendMode: "screen",
      }}
    />
  );
}
