import React, { useRef, useEffect } from 'react';

export function ZenithCanvasBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Handle High DPI
    const setCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    setCanvasSize();

    // Mouse Tracking
    let mouseX = -1000;
    let mouseY = -1000;
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', setCanvasSize);

    // Particles (Vertex Constellations)
    const particles: any[] = [];
    const particleCount = Math.floor((width * height) / 12000); // Responsive count

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        baseX: 0,
        baseY: 0,
        radius: Math.random() * 1.5 + 0.5,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.005;
      ctx.clearRect(0, 0, width, height);

      // Draw Plasma Tendrils (Bezier Curves)
      // We will draw 3 main tendrils with gradients
      const tendrils = [
        { colorStart: 'rgba(139, 92, 246, 0.4)', colorEnd: 'rgba(59, 130, 246, 0.0)' }, // Purple to Blue
        { colorStart: 'rgba(59, 130, 246, 0.4)', colorEnd: 'rgba(244, 63, 94, 0.0)' }, // Blue to Rose
        { colorStart: 'rgba(244, 63, 94, 0.3)', colorEnd: 'rgba(139, 92, 246, 0.0)' }, // Rose to Purple
      ];

      tendrils.forEach((t, i) => {
        ctx.beginPath();
        
        // Base positions mapped to sine waves for fluid motion
        let startX = 0;
        let startY = height * 0.5 + Math.sin(time + i * 2) * 200;
        let endX = width;
        let endY = height * 0.5 + Math.cos(time + i * 2) * 200;

        let cp1x = width * 0.3 + Math.sin(time * 1.5 + i) * 300;
        let cp1y = height * 0.2 + Math.cos(time * 1.2 + i) * 300;
        
        let cp2x = width * 0.7 + Math.cos(time * 1.3 + i) * 300;
        let cp2y = height * 0.8 + Math.sin(time * 1.4 + i) * 300;

        // Magnetic repulsion for tendril control points
        const pushRadius = 300;
        const pushForce = 0.5;

        const pushPoint = (px: number, py: number) => {
          const dx = px - mouseX;
          const dy = py - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < pushRadius) {
            const force = (pushRadius - dist) / pushRadius;
            return {
              x: px + dx * force * pushForce,
              y: py + dy * force * pushForce
            };
          }
          return { x: px, y: py };
        };

        const p1 = pushPoint(cp1x, cp1y);
        const p2 = pushPoint(cp2x, cp2y);

        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, endX, endY);

        // Very thick lines for tendril effect
        ctx.lineWidth = 150 + Math.sin(time + i) * 50;
        ctx.lineCap = 'round';
        
        const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
        gradient.addColorStop(0, t.colorStart);
        gradient.addColorStop(1, t.colorEnd);
        
        ctx.strokeStyle = gradient;
        // Apply heavy blur using native Canvas filter
        ctx.filter = 'blur(40px)';
        ctx.stroke();
      });

      // Reset filter for constellations
      ctx.filter = 'none';

      // Draw Vertex Constellations
      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Magnetic Repulsion
        let dx = p.x - mouseX;
        let dy = p.y - mouseY;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
          let force = (150 - dist) / 150;
          p.x += (dx / dist) * force * 2;
          p.y += (dy / dist) * force * 2;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();

        // Connect nearby particles to form geometric shapes
        for (let j = i + 1; j < particles.length; j++) {
          let p2 = particles[j];
          let ddx = p.x - p2.x;
          let ddy = p.y - p2.y;
          let ddist = Math.sqrt(ddx * ddx + ddy * ddy);

          if (ddist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            let opacity = 1 - (ddist / 100);
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ background: 'var(--color-background)' }}
    />
  );
}
