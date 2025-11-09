export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: 'easeInOut' }
};

export const slideIn = {
  left: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  right: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  up: {
    initial: { y: 100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  down: {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

export const scaleIn = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
};

export const messageVariant = (isOwn: boolean) => ({
  initial: { x: isOwn ? 100 : -100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { type: 'spring', stiffness: 300, damping: 30 }
});

export const buttonHover = {
  scale: 1.05,
  transition: { duration: 0.2 }
};

export const buttonTap = {
  scale: 0.95
};
