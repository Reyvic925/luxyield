import React, { useRef, useEffect } from 'react';

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Reduce particle count and disable heavy shadows on small screens to improve mobile performance
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window);
    const numParticles = isMobile ? 18 : 80;

    // Get accent colors from CSS variables, fall back to gold
    const computed = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
    const accent = (computed && computed.getPropertyValue('--accent-primary')) ? computed.getPropertyValue('--accent-primary').trim() : '#FFD700';
    const accentRgba08 = (computed && computed.getPropertyValue('--accent-primary-rgba-08')) ? computed.getPropertyValue('--accent-primary-rgba-08').trim() : 'rgba(255,217,99,0.08)';
    const accentRgba44 = (computed && computed.getPropertyValue('--accent-primary-rgba-33')) ? computed.getPropertyValue('--accent-primary-rgba-33').trim() : 'rgba(255,217,99,0.33)';

    // Create tiny particles
    particles.current = Array.from({ length: numParticles }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * (isMobile ? 0.3 : 0.5),
      vy: (Math.random() - 0.5) * (isMobile ? 0.3 : 0.5),
      r: Math.random() * (isMobile ? 1 : 1.2) + 0.4,
      color: isMobile ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)'
    }));

    const draw = () => {
      // In case of resize during animation
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);
      for (let p of particles.current) {
        // Move slightly toward mouse (less sensitive)
        const dx = mouse.current.x - p.x;
        const dy = mouse.current.y - p.y;
        p.vx += dx * 0.00001; // reduced sensitivity
        p.vy += dy * 0.00001;
        p.x += p.vx;
        p.y += p.vy;
        // Wrap around
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        // Draw with local brightness if mouse is near
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
        // If mouse is close, brighten up
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 80 && !isMobile) {
          ctx.fillStyle = 'rgba(255,255,180,0.35)';
          ctx.shadowColor = accent;
          ctx.shadowBlur = 16;
        } else {
          ctx.fillStyle = p.color;
          // Use a subtle accent shadow on desktop, none on mobile
          ctx.shadowColor = isMobile ? 'transparent' : accentRgba44;
          ctx.shadowBlur = isMobile ? 0 : 6;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    // Start animation after slight delay to allow page paint (improves perceived load on mobile)
    const startTimeout = setTimeout(() => draw(), isMobile ? 200 : 0);

    // Mouse move
    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);
    // Resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(startTimeout);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);    // Mouse move
    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);
    // Resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 0 }}
    />
  );
};

export default ParticleBackground;

