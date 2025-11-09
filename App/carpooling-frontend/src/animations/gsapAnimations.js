import gsap from 'gsap';

export const animateHeroTitle = (element) => {
  gsap.fromTo(
    element,
    {
      opacity: 0,
      y: -50,
      scale: 0.8,
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1.2,
      ease: 'power3.out',
    }
  );
};

export const animateBackground = (elements) => {
  gsap.to(elements, {
    y: '+=30',
    rotation: '+=5',
    duration: 3,
    ease: 'sine.inOut',
    stagger: 0.2,
    repeat: -1,
    yoyo: true,
  });
};

export const animateCarEntry = (element) => {
  gsap.fromTo(
    element,
    {
      x: -window.innerWidth,
      opacity: 0,
    },
    {
      x: 0,
      opacity: 1,
      duration: 2,
      ease: 'power2.out',
    }
  );
};

export const animateGlow = (element) => {
  gsap.to(element, {
    textShadow: '0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.6)',
    duration: 1.5,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
};

export const animateParticles = (particles) => {
  particles.forEach((particle, index) => {
    gsap.to(particle, {
      y: `+=${Math.random() * 100 - 50}`,
      x: `+=${Math.random() * 100 - 50}`,
      opacity: Math.random() * 0.5 + 0.3,
      duration: Math.random() * 3 + 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: index * 0.1,
    });
  });
};

export const successAnimation = (element) => {
  gsap.fromTo(
    element,
    {
      scale: 0,
      rotation: -180,
    },
    {
      scale: 1,
      rotation: 0,
      duration: 0.6,
      ease: 'back.out(1.7)',
    }
  );
};

export const fadeOutSplash = (element, onComplete) => {
  gsap.to(element, {
    opacity: 0,
    scale: 0.8,
    duration: 0.8,
    ease: 'power2.in',
    onComplete,
  });
};
