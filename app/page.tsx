"use client";

import { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const logoImgRef = useRef<HTMLImageElement>(null);
  const particlesRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rotateRef = useRef({ x: 0, y: 0 });
  const shadowRef = useRef({ x: 0, y: 0 });
  const particles = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastAccelRef = useRef({ x: 0, y: 0, z: 0 });
  const shakeThreshold = 15;
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      mouseRef.current = {
        x: (e.clientX - centerX) / centerX,
        y: (e.clientY - centerY) / centerY,
      };

      cursorPosition.current = { x: e.clientX, y: e.clientY };
      
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
    };

    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        const gamma = e.gamma / 45;
        const beta = e.beta / 45;
        mouseRef.current = {
          x: Math.max(-1, Math.min(1, gamma)),
          y: Math.max(-1, Math.min(1, beta)),
        };
      }
    };

    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      if (e.accelerationIncludingGravity) {
        const accel = e.accelerationIncludingGravity;
        if (accel.x !== null && accel.y !== null) {
          mouseRef.current = {
            x: Math.max(-1, Math.min(1, accel.x / 10)),
            y: Math.max(-1, Math.min(1, accel.y / 10)),
          };

          const deltaX = Math.abs(accel.x - lastAccelRef.current.x);
          const deltaY = Math.abs(accel.y - lastAccelRef.current.y);
          const deltaZ = Math.abs((accel.z || 0) - lastAccelRef.current.z);
          
          const totalShake = deltaX + deltaY + deltaZ;
          
          if (totalShake > shakeThreshold) {
            particles.current.forEach((particle) => {
              particle.vx = (Math.random() - 0.5) * 10;
              particle.vy = (Math.random() - 0.5) * 10;
            });
          }
          
          lastAccelRef.current = {
            x: accel.x,
            y: accel.y,
            z: accel.z || 0,
          };
        }
      }
    };

    const canvas = particlesRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    for (let i = 0; i < 50; i++) {
      particles.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }

    window.addEventListener("mousemove", handleMouseMove);
    
    if (typeof DeviceOrientationEvent !== 'undefined') {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        (DeviceOrientationEvent as any).requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', handleDeviceOrientation);
              window.addEventListener('devicemotion', handleDeviceMotion);
            }
          })
          .catch(() => {});
      } else {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
        window.addEventListener('devicemotion', handleDeviceMotion);
      }
    }

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff5f";

      particles.current.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.globalAlpha = particle.opacity;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
    };

    const animateLogo = () => {
      const targetX = mouseRef.current.y * 20;
      const targetY = mouseRef.current.x * 20;
      
      rotateRef.current.x += (targetX - rotateRef.current.x) * 0.15;
      rotateRef.current.y += (targetY - rotateRef.current.y) * 0.15;

      shadowRef.current.x += (mouseRef.current.x * 200 - shadowRef.current.x) * 0.2;
      shadowRef.current.y += (mouseRef.current.y * 200 - shadowRef.current.y) * 0.2;

      if (logoRef.current) {
        logoRef.current.style.transform = `
          perspective(1000px) rotateX(${-rotateRef.current.x}deg) rotateY(${rotateRef.current.y}deg)
        `;
      }

      if (logoImgRef.current) {
        const shadowX = shadowRef.current.x;
        const shadowY = shadowRef.current.y;
        const steps = 50;
        let shadows = [];
        
        for (let i = 1; i <= steps; i++) {
          const x = (shadowX * i) / steps;
          const y = (shadowY * i) / steps;
          const opacity = (1 - i / steps) * 0.5;
          shadows.push(`${x}px ${y}px 2px rgba(0, 255, 95, ${opacity})`);
        }
        
        logoImgRef.current.style.filter = `drop-shadow(${shadows.join(', ')})`;
      }
    };

    const animateCursor = () => {
      if (cursorRef.current) {
        const smoothX = cursorRef.current.offsetLeft;
        const smoothY = cursorRef.current.offsetTop;
        const targetX = cursorPosition.current.x;
        const targetY = cursorPosition.current.y;
        
        const newX = smoothX + (targetX - smoothX) * 0.15;
        const newY = smoothY + (targetY - smoothY) * 0.15;
        
        cursorRef.current.style.left = `${newX}px`;
        cursorRef.current.style.top = `${newY}px`;
      }
    };

    const animate = () => {
      animateParticles();
      animateLogo();
      animateCursor();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("deviceorientation", handleDeviceOrientation);
      window.removeEventListener("devicemotion", handleDeviceMotion);
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mounted]);

    if (!mounted) {
    return (
      <div className="relative h-screen bg-black overflow-hidden" style={{ position: 'fixed', width: '100%', height: '100%' }}>
        <canvas className="absolute top-0 left-0 w-full h-full" />
                                                            <div className="relative z-10 flex flex-col items-center h-screen overflow-hidden justify-center">
               <div className="w-[85%] max-w-[800px] h-auto px-4 mb-8 md:mb-12">
                 <img
                   src="/logowhite.svg"
                   alt="Logo"
                   className="w-full h-full"
                 />
               </div>
             <div className="px-4">
              <div
                className="relative px-4 py-2 md:px-6 md:py-3 rounded-full border-2 border-[#00ff5f] backdrop-blur-md"
                style={{
                  background: "rgba(0, 255, 95, 0.05)",
                  boxShadow: "0 0 40px rgba(0, 255, 95, 0.3), inset 0 0 40px rgba(0, 255, 95, 0.1)",
                  transform: "rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
                }}
              >
                <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(135deg, rgba(0, 255, 95, 0.1) 0%, rgba(0, 255, 95, 0) 100%)" }} />
                <p
                  className="relative text-white text-sm md:text-lg font-bold tracking-wider whitespace-nowrap"
                  style={{
                    fontFamily: "var(--font-avgard-book)",
                    textShadow: "0 0 20px rgba(0, 255, 95, 0.8), 0 0 40px rgba(0, 255, 95, 0.6)",
                    letterSpacing: "0.2em",
                  }}
                >
                  Em Breve
                </p>
              </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-black overflow-hidden" style={{ position: 'fixed', width: '100%', height: '100%' }}>
      <div
        ref={cursorRef}
        className="fixed pointer-events-none w-10 h-10 rounded-full border-2 border-[#00ff5f] transition-opacity duration-300"
        style={{
          background: 'rgba(0, 255, 95, 0.05)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 20px rgba(0, 255, 95, 0.5)',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
        }}
      />
      <canvas
        ref={particlesRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{ zIndex: 0 }}
      />
      <div className="relative z-10 flex flex-col items-center h-screen overflow-hidden justify-center">
        <div
          ref={logoRef}
          className="w-[85%] max-w-[800px] h-auto px-4 mb-8 md:mb-12"
          style={{ transformStyle: "preserve-3d" }}
        >
          <img
            ref={logoImgRef}
            src="/logowhite.svg"
            alt="Logo"
            className="w-full h-full"
          />
        </div>
        <div className="px-4">
          <div
            className="relative px-4 py-2 md:px-6 md:py-3 rounded-full border-2 border-[#00ff5f] backdrop-blur-md"
            style={{
              background: "rgba(0, 255, 95, 0.05)",
              boxShadow: "0 0 40px rgba(0, 255, 95, 0.3), inset 0 0 40px rgba(0, 255, 95, 0.1)",
              transform: "rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
            }}
          >
            <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(135deg, rgba(0, 255, 95, 0.1) 0%, rgba(0, 255, 95, 0) 100%)" }} />
            <p
              className="relative text-white text-sm md:text-lg font-bold tracking-wider whitespace-nowrap"
              style={{
                fontFamily: "var(--font-avgard-book)",
                textShadow: "0 0 20px rgba(0, 255, 95, 0.8), 0 0 40px rgba(0, 255, 95, 0.6)",
                letterSpacing: "0.2em",
              }}
            >
              Em Breve
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
