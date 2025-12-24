"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  animate?: boolean;
}

function AnimatedCard({ children, delay = 0, className = "", animate = true }: AnimatedCardProps) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animate || !ref.current || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [animate]);

  if (!animate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      className={`transition-opacity duration-500 ${inView ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export default function N8Page() {
  const [mounted, setMounted] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showIframeTip, setShowIframeTip] = useState(true);
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
  const logoRotationRef = useRef({ x: 0, y: 0, z: 0 });
  const initialLogoRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (mounted || typeof window === 'undefined') return;

    let animationFrame: number;
    const animateLogoRotation = () => {
      if (!initialLogoRef.current) {
        animationFrame = requestAnimationFrame(animateLogoRotation);
        return;
      }

      logoRotationRef.current.x += 0.3;
      logoRotationRef.current.y += 0.2;
      logoRotationRef.current.z += 0.1;

      const x = Math.sin(logoRotationRef.current.x * Math.PI / 180) * 3;
      const y = Math.sin(logoRotationRef.current.y * Math.PI / 180) * 3;
      const z = Math.sin(logoRotationRef.current.z * Math.PI / 180) * 1.5;
      
      initialLogoRef.current.style.transform = `
        perspective(1000px) 
        rotateX(${x}deg)
        rotateY(${y}deg)
        rotateZ(${z}deg)
      `;

      animationFrame = requestAnimationFrame(animateLogoRotation);
    };

    const timeout = setTimeout(() => {
      animateLogoRotation();
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [mounted]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!isMobile || typeof window === 'undefined' || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const iframeContainer = iframe.parentElement;
    if (!iframeContainer) return;

    let touchStartCount = 0;
    let isTwoFingerScroll = false;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartCount = e.touches.length;
      isTwoFingerScroll = touchStartCount >= 2;
      
      // Se for um dedo, marca para bloquear
      if (touchStartCount === 1) {
        isTwoFingerScroll = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Se começou com um dedo, sempre bloqueia
      if (!isTwoFingerScroll && e.touches.length === 1) {
        e.preventDefault();
        e.stopPropagation();
      }
      // Se tiver dois ou mais dedos, permite
      if (e.touches.length >= 2) {
        isTwoFingerScroll = true;
      }
    };

    const handleTouchEnd = () => {
      touchStartCount = 0;
      isTwoFingerScroll = false;
    };

    iframeContainer.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
    iframeContainer.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    iframeContainer.addEventListener('touchend', handleTouchEnd, { capture: true });
    iframeContainer.addEventListener('touchcancel', handleTouchEnd, { capture: true });

    return () => {
      iframeContainer.removeEventListener('touchstart', handleTouchStart, { capture: true } as any);
      iframeContainer.removeEventListener('touchmove', handleTouchMove, { capture: true } as any);
      iframeContainer.removeEventListener('touchend', handleTouchEnd, { capture: true } as any);
      iframeContainer.removeEventListener('touchcancel', handleTouchEnd, { capture: true } as any);
    };
  }, [isMobile, mounted]);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      mouseRef.current = {
        x: (e.clientX - centerX) / centerX,
        y: (e.clientY - centerY) / centerY,
      };

      if (!isMobile) {
        cursorPosition.current = { x: e.clientX, y: e.clientY };
        
        if (cursorRef.current) {
          cursorRef.current.style.left = `${e.clientX}px`;
          cursorRef.current.style.top = `${e.clientY}px`;
        }
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
    if (!canvas || typeof window === 'undefined') return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    for (let i = 0; i < 20; i++) {
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
    
    if (typeof window !== 'undefined' && typeof DeviceOrientationEvent !== 'undefined') {
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
      if (!isMobile && cursorRef.current) {
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
  }, [mounted, isMobile]);

    if (!mounted) {
    return (
      <div className="relative h-screen bg-black overflow-hidden" style={{ position: 'fixed', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <canvas className="absolute top-0 left-0 w-full h-full" />
        <div className="relative z-10 flex flex-col items-center h-screen overflow-hidden justify-center">
          <div 
            ref={initialLogoRef}
            className="w-[85%] max-w-[800px] h-auto px-4 mb-8 md:mb-12"
            style={{ transformStyle: "preserve-3d" }}
          >
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
    <div className="relative min-h-screen bg-black">
      {!isMobile && (
        <div
          ref={cursorRef}
          className="fixed pointer-events-none w-10 h-10 rounded-full border-2 border-[#00ff5f] transition-opacity duration-300"
          style={{
            background: 'rgba(0, 255, 95, 0.05)',
            backdropFilter: 'blur(3px)',
            boxShadow: '0 0 20px rgba(0, 255, 95, 0.5)',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
          }}
        />
      )}
      <canvas
        ref={particlesRef}
        className="fixed top-0 left-0 w-full h-full"
        style={{ zIndex: 0 }}
      />
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-20">
          <div
            ref={logoRef}
            className="w-[60%] max-w-[500px] h-auto mx-auto mb-8"
            style={{ transformStyle: "preserve-3d" }}
          >
            <img
              ref={logoImgRef}
              src="/logowhite.svg"
              alt="Logo"
              className="w-full h-full"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>
            Sites de Alto Desempenho para<br />N8 Incorporadora
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Transforme visitantes em leads qualificados com sites modernos, responsivos e otimizados para conversão
          </p>
          <AnimatedCard className="flex justify-center items-center">
            <a
              href="#contato"
              className="px-8 py-4 rounded-full border-2 border-[#00ff5f] bg-transparent hover:bg-[#00ff5f]/10 text-white font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{ fontFamily: "var(--font-avgard-demi-bold)" }}
            >
              Falar com Especialista
            </a>
            </AnimatedCard>
        </div>

        <div className="mb-24">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Produto Final</h2>
          <p className="text-center text-gray-300 mb-8">Cada site incluirá as seguintes seções:</p>
          <div className="grid md:grid-cols-3 gap-6">
            <AnimatedCard className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <h3 className="text-lg font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Banners Principais</h3>
            </AnimatedCard>
            <AnimatedCard delay={100} className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <h3 className="text-lg font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Sobre</h3>
            </AnimatedCard>
            <AnimatedCard delay={200} className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <h3 className="text-lg font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Fotos</h3>
            </AnimatedCard>
            <AnimatedCard delay={300} className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <h3 className="text-lg font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Experiência 360</h3>
            </AnimatedCard>
            <AnimatedCard delay={400} className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <h3 className="text-lg font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Informações do Empreendimento</h3>
            </AnimatedCard>
            <AnimatedCard delay={500} className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <h3 className="text-lg font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Plantas</h3>
            </AnimatedCard>
            <AnimatedCard delay={600} className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <h3 className="text-lg font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Localização e Walkability</h3>
            </AnimatedCard>
            <AnimatedCard delay={700} className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <h3 className="text-lg font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Sobre a Incorporadora</h3>
            </AnimatedCard>
            <AnimatedCard delay={800} className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <h3 className="text-lg font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Estágio da Obra</h3>
            </AnimatedCard>
            <AnimatedCard delay={900} className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <h3 className="text-lg font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Contato</h3>
            </AnimatedCard>
            <AnimatedCard delay={1000} className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <h3 className="text-lg font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Download de App Comercial</h3>
            </AnimatedCard>
            <AnimatedCard delay={1100} className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <h3 className="text-lg font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Demais Interações</h3>
            </AnimatedCard>
          </div>
        </div>

        <div className="mb-24">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Por Que Escolher Esta Solução?</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <AnimatedCard className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Geração de Leads</h3>
              <p className="text-gray-300 text-sm text-center">MVP inicial pronto em 7 dias para começar a capturar leads imediatamente</p>
            </AnimatedCard>
            <AnimatedCard delay={100} className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Evolução Contínua</h3>
              <p className="text-gray-300 text-sm text-center">Manutenção mensal para adicionar conteúdo conforme os materiais ficam disponíveis</p>
            </AnimatedCard>
            <AnimatedCard delay={200} className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Tecnologia Moderna</h3>
              <p className="text-gray-300 text-sm text-center">React, responsivo e otimizado para SEO desde o primeiro dia</p>
            </AnimatedCard>
          </div>
          <AnimatedCard className="p-8 rounded-2xl border-2 border-[#00ff5f]/30 backdrop-blur-md bg-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff5f]/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-4 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Estratégia de Lançamento</h3>
              <p className="text-gray-300 mb-4 text-center max-w-3xl mx-auto">
                Desenvolvemos um MVP completo e funcional em apenas 7 dias, utilizando a identidade visual disponível. 
                O site estará pronto para capturar leads desde o primeiro dia, enquanto continuamos evoluindo 
                e adicionando conteúdo através da manutenção mensal conforme os materiais forem disponibilizados.
              </p>
              <p className="text-[#00ff5f] font-semibold text-center">
                Resultado: Site no ar em 7 dias, gerando leads enquanto evoluímos juntos
              </p>
            </div>
            </AnimatedCard>
        </div>

        <div className="mb-24">
          <h2 className="text-3xl font-bold mb-4 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Referência de Trabalho</h2>
          <p className="text-center text-gray-400 mb-8">Veja um exemplo de site já desenvolvido para a N8 Incorporadora</p>
          {isMobile && showIframeTip && (
            <div className="mb-4 mx-4 p-4 rounded-xl border-2 border-[#00ff5f]/50 bg-[#00ff5f]/10 backdrop-blur-md text-center relative">
              <button
                onClick={() => setShowIframeTip(false)}
                className="absolute top-2 right-2 text-[#00ff5f] hover:text-[#00ff5f]/80 transition-colors"
                aria-label="Fechar aviso"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg className="w-5 h-5 text-[#00ff5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-white font-semibold" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>
                  Use dois dedos para navegar no site
                </p>
              </div>
            </div>
          )}
          <AnimatedCard className="flex justify-center">
            <div className="relative" style={{ width: '375px', height: '812px' }}>
              <img
                src="/iphone17.png"
                alt="iPhone 17 Pro Mockup"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
              />
              <div 
                className="absolute"
                style={{
                  top: '60px',
                  left: '13px',
                  right: '13px',
                  bottom: '60px',
                  borderRadius: '3rem',
                  overflow: 'hidden'
                }}
              >
                <iframe
                  ref={iframeRef}
                  src="https://verus.n8incorporadora.com/"
                  className="w-full h-full border-0 bg-white"
                  title="Verus N8 Incorporadora"
                  allow="fullscreen; autoplay; camera; microphone; geolocation; payment; clipboard-read; clipboard-write"
                  style={{ 
                    pointerEvents: 'auto',
                    backgroundColor: '#ffffff',
                    zIndex: 1
                  }}
                />
              </div>
            </div>
            </AnimatedCard>
          <div className="text-center mt-8">
            <a
              href="https://verus.n8incorporadora.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00ff5f] hover:text-[#00ff5f]/80 transition-colors underline text-lg"
            >
              verus.n8incorporadora.com
            </a>
          </div>
        </div>

        <div className="mb-24">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Características do Website</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <AnimatedCard className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Responsivo para todos os tamanhos de tela</h3>
            </AnimatedCard>
            <AnimatedCard delay={100} className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Site desenvolvido em React</h3>
            </AnimatedCard>
            <AnimatedCard delay={200} className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Otimizado para Google</h3>
            </AnimatedCard>
            <AnimatedCard delay={300} className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Seguindo a Identidade Visual da Marca e respeitando padronizações</h3>
            </AnimatedCard>
          </div>
        </div>

        <div className="mb-24">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Prazo de Entrega MVP</h2>
          <div className="flex justify-center">
            <AnimatedCard className="p-8 rounded-2xl border-2 border-[#00ff5f]/30 backdrop-blur-md bg-white/5 text-center hover:border-[#00ff5f]/50 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_40px_rgba(0,255,95,0.5)] transition-all duration-300 max-w-md w-full">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Prazo de entrega MVP</h3>
              <p className="text-2xl text-[#00ff5f]">Até 07 dias após recebimento do briefing e materiais</p>
            </AnimatedCard>
          </div>
        </div>

        <div id="investimento" className="mb-24 scroll-mt-20">
          <h2 className="text-3xl font-bold mb-4 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Investimento</h2>
          <p className="text-center text-gray-400 mb-8">Dois sites completos com manutenção mensal inclusa</p>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <AnimatedCard className="p-8 rounded-2xl border-2 border-[#00ff5f]/30 backdrop-blur-md bg-white/5 relative overflow-hidden hover:border-[#00ff5f]/50 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_40px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff5f]/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Investimento Padrão</h3>
                </div>
                <p className="text-center mb-2"><span className="text-4xl text-[#00ff5f] font-bold">R$ 1.500</span></p>
                <p className="text-center text-sm mb-4 text-gray-400">por site</p>
                <p className="text-center text-sm font-semibold mb-2 text-[#00ff5f]">Manutenção mensal:</p>
                <p className="text-center text-sm text-gray-300 mb-4">R$ 100/mês por site <span className="text-[#00ff5f] font-semibold">somente em meses com atualizações</span></p>
              </div>
            </AnimatedCard>
            <AnimatedCard delay={100} className="p-8 rounded-2xl border-2 border-[#00ff5f]/50 backdrop-blur-md bg-white/5 relative overflow-hidden hover:border-[#00ff5f]/70 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_40px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff5f]/20 rounded-full blur-3xl" />
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#00ff5f]/20 border border-[#00ff5f] flex items-center justify-center">
                <span className="text-xs text-[#00ff5f] font-bold leading-none text-center">OFERTA<br />LIMITADA</span>
              </div>
              <div className="relative z-10">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Condição Especial 2025</h3>
                  <p className="text-xs text-[#00ff5f] mb-4 font-semibold">Economia de R$ 600 nos dois projetos</p>
                </div>
                <p className="text-center mb-2"><span className="text-4xl text-[#00ff5f] font-bold">R$ 1.200</span></p>
                <p className="text-center text-sm mb-4 text-gray-400">por site</p>
                <p className="text-center text-sm font-semibold mb-2 text-[#00ff5f]">Manutenção mensal:</p>
                <p className="text-center text-sm text-gray-300 mb-4">R$ 100/mês por site <span className="text-[#00ff5f] font-semibold">somente em meses com atualizações</span></p>
                <p className="text-xs text-center text-gray-400 italic">Válido apenas para contratos fechados em 2025</p>
              </div>
            </AnimatedCard>
          </div>
          <AnimatedCard className="p-6 rounded-2xl border-2 border-[#00ff5f]/40 backdrop-blur-md bg-white/5 text-center">
            <p className="text-lg font-semibold mb-2 text-[#00ff5f]" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Sinal de Negócio</p>
            <p className="text-2xl text-white font-bold mb-2">50% do valor total dos dois projetos</p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-xl bg-white/5 border border-[#00ff5f]/20">
                <p className="text-sm text-gray-400 mb-1">Investimento Padrão</p>
                <p className="text-lg text-white font-bold">Total: R$ 3.000</p>
                <p className="text-sm text-[#00ff5f] font-semibold">Sinal: R$ 1.500</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-[#00ff5f]/20">
                <p className="text-sm text-gray-400 mb-1">Condição Especial</p>
                <p className="text-lg text-white font-bold">Total: R$ 2.400</p>
                <p className="text-sm text-[#00ff5f] font-semibold">Sinal: R$ 1.200</p>
              </div>
            </div>
            </AnimatedCard>
        </div>

        <div id="contato" className="mb-24 scroll-mt-20">
          <AnimatedCard className="p-10 rounded-2xl border-2 border-[#00ff5f]/50 backdrop-blur-md bg-white/5 relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ff5f]/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Pronto para Começar?</h2>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Entre em contato agora e garante sua condição especial de 2025. 
                Comece a gerar leads em apenas 7 dias.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://checkout.nubank.com.br/s8V2wdPR2d5jalzp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-full border-2 border-[#00ff5f] bg-[#00ff5f]/10 hover:bg-[#00ff5f]/20 text-white font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)]"
                  style={{ fontFamily: "var(--font-avgard-demi-bold)" }}
                >
                  Vamos Começar
                </a>
                <a
                  href="https://wa.me/5541984938832"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-full border-2 border-[#00ff5f] bg-transparent hover:bg-[#00ff5f]/10 text-white font-bold text-lg transition-all duration-300 hover:scale-105"
                  style={{ fontFamily: "var(--font-avgard-demi-bold)" }}
                >
                  WhatsApp
                </a>
              </div>
            </div>
            </AnimatedCard>
        </div>

        <div className="mb-24">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Garantias e Suporte</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <AnimatedCard className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 text-center hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Entrega Garantida</h3>
              <p className="text-sm text-gray-300">MVP pronto em 7 dias ou seu dinheiro de volta</p>
            </AnimatedCard>
            <AnimatedCard delay={100} className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 text-center hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Suporte Contínuo</h3>
              <p className="text-sm text-gray-300">Manutenção mensal com atualizações e suporte técnico</p>
            </AnimatedCard>
            <AnimatedCard delay={200} className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 text-center hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Código Proprietário</h3>
              <p className="text-sm text-gray-300">Você é dono do código e pode evoluir quando quiser</p>
            </AnimatedCard>
          </div>
        </div>

        <div className="text-center mb-20">
          <img src="/logowhite.svg" alt="Logo NestLab" className="w-[40%] max-w-[300px] h-auto mx-auto" />
        </div>

      </div>
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full border-2 border-[#00ff5f] bg-black/80 backdrop-blur-md flex items-center justify-center hover:bg-[#00ff5f]/20 hover:scale-110 transition-all duration-300 z-50"
          style={{
            boxShadow: '0 0 20px rgba(0, 255, 95, 0.5)',
          }}
          aria-label="Voltar ao topo"
        >
          <svg className="w-6 h-6 text-[#00ff5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}

