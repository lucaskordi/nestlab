"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export default function Orcamento3dPage() {
  const [mounted, setMounted] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
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
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      <div className="relative h-screen bg-black overflow-hidden" style={{ position: 'fixed', width: '100%', height: '100vh', overflow: 'hidden' }}>
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
    <div className="relative min-h-screen bg-black">
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
          <h1 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>
            Desenvolvimento de Site Institucional para<br />Menarim Sementes
          </h1>
          <p className="text-lg text-gray-300">
            Soluções completas em identidade e tecnologia para negócios modernos.
          </p>
        </div>

        <div className="mb-24">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Características do Website</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Responsivo para todos os tamanhos de tela</h3>
            </div>
            <div className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Código em React, o que há de mais avançado e veloz</h3>
            </div>
            <div className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Seguindo a Identidade Visual da Marca e respeitando padronizações</h3>
            </div>
            <div className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Otimizado para Google e demais motores de busca</h3>
            </div>
          </div>
        </div>

        <div className="mb-24">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Prazos de Entrega</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 text-center hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Entrega inicial de layout</h3>
              <p className="text-2xl text-[#00ff5f]">Até 10 Dias</p>
            </div>
            <div className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 text-center hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Entrega final do código</h3>
              <p className="text-2xl text-[#00ff5f]">Até 15 Dias</p>
            </div>
          </div>
        </div>

        <div className="mb-24">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Investimento e Formas de Pagamento</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 rounded-2xl border-2 border-[#00ff5f]/30 backdrop-blur-md bg-white/5 relative overflow-hidden hover:border-[#00ff5f]/50 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_40px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff5f]/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Investimento</h3>
                </div>
                <p className="text-center mb-6"><span className="text-4xl text-[#00ff5f] font-bold">R$ 1.300</span></p>
                <p className="text-sm font-semibold mb-2 text-[#00ff5f]">Pagamento:</p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• R$ 650 na contratação</li>
                  <li>• R$ 650 após entrega final</li>
                </ul>
              </div>
            </div>
            <div className="p-8 rounded-2xl border-2 border-[#00ff5f]/30 backdrop-blur-md bg-white/5 relative overflow-hidden hover:border-[#00ff5f]/50 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_40px_rgba(0,255,95,0.5)] transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff5f]/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Formas de Pagamento</h3>
                </div>
                <ul className="space-y-3 text-gray-300 text-base">
                  <li className="text-center">• Transferência, PIX ou boleto bancário</li>
                  <li className="text-center">• Parcelamento disponível: até 12x no cartão de crédito, com acréscimo da taxa da maquininha</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-24">
          <div className="p-6 rounded-2xl border border-[#00ff5f]/20 backdrop-blur-md bg-white/5 hover:border-[#00ff5f]/40 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,95,0.5)] transition-all duration-300">
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00ff5f] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="#00ff5f" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ fontFamily: "var(--font-avgard-demi-bold)" }}>Custos Operacionais</h3>
            </div>
            <p className="text-gray-300 mb-2 text-center">Servidor e domínio: responsabilidade do cliente</p>
            <ul className="text-gray-300 text-sm space-y-1 text-center">
              <li>• Servidor: ~R$ 45/mês</li>
              <li>• Domínio: ~R$ 40/ano</li>
            </ul>
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
