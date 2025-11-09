import gsap from 'gsap';

export const heroIntro = (element: HTMLElement) => {
  gsap.fromTo(
    element,
    { scale: 0.5, opacity: 0, rotationY: -180 },
    {
      scale: 1,
      opacity: 1,
      rotationY: 0,
      duration: 1.5,
      ease: 'power3.out',
    }
  );
};

export const glowEffect = (element: HTMLElement) => {
  gsap.to(element, {
    textShadow: '0 0 20px rgba(34, 211, 238, 0.8), 0 0 40px rgba(34, 211, 238, 0.6)',
    duration: 1,
    repeat: -1,
    yoyo: true,
    ease: 'power1.inOut',
  });
};

export const parallaxBg = (element: HTMLElement, speed: number = 0.5) => {
  const handleScroll = () => {
    const scrolled = window.scrollY;
    gsap.to(element, {
      y: scrolled * speed,
      duration: 0.5,
      ease: 'power1.out',
    });
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
};

export const confettiAnimation = () => {
  const colors = ['#22d3ee', '#06b6d4', '#0891b2', '#0e7490'];
  const confettiCount = 50;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      top: -10px;
      left: ${Math.random() * 100}vw;
      opacity: 0;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(confetti);

    gsap.to(confetti, {
      y: window.innerHeight + 10,
      x: `+=${Math.random() * 200 - 100}`,
      rotation: Math.random() * 720,
      opacity: 1,
      duration: 2 + Math.random() * 2,
      ease: 'power1.in',
      onComplete: () => confetti.remove(),
    });
  }
};

export const slideInFromLeft = (element: HTMLElement, delay: number = 0) => {
  gsap.fromTo(
    element,
    { x: -100, opacity: 0 },
    {
      x: 0,
      opacity: 1,
      duration: 0.8,
      delay,
      ease: 'power2.out',
    }
  );
};

export const fadeInUp = (element: HTMLElement, delay: number = 0) => {
  gsap.fromTo(
    element,
    { y: 50, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.6,
      delay,
      ease: 'power2.out',
    }
  );
};

export const staggerFadeIn = (elements: HTMLElement[], delay: number = 0.1) => {
  gsap.fromTo(
    elements,
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: delay,
      ease: 'power2.out',
    }
  );
};

export const floatingAnimation = (element: HTMLElement) => {
  gsap.to(element, {
    y: '+=20',
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
};
