/**
 * Motion configuration, shared variants, and animation tokens for SMKN 1 Sorong.
 * Optimized for mobile-first performance on budget-to-midrange Android devices.
 * Animate ONLY transform and opacity to maintain 60 FPS without layout thrashing.
 */

// Timing tokens (in seconds)
export const DURATION_MICRO = 0.15; // 150ms - button taps, icon micro-scales
export const DURATION_FAST = 0.22;  // 220ms - tabs, pill transitions, badges
export const DURATION_NORMAL = 0.3; // 300ms - card entries, modals
export const DURATION_PAGE = 0.35;  // 350ms - page cross-fade and slide

// Gentle natural easings
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;
export const SPRING_SNAPPY = { type: 'spring', stiffness: 450, damping: 32 } as const;
export const SPRING_GENTLE = { type: 'spring', stiffness: 320, damping: 28 } as const;

/**
 * Page level transitions (fade + 12px vertical slide).
 * Use with AnimatePresence mode="wait".
 */
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION_PAGE,
      ease: EASE_OUT_EXPO,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * Staggered container for card lists.
 * Staggers children smoothly; capped by list design to avoid animating > 12 items.
 */
export const staggerContainerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.03,
    },
  },
};

/**
 * Card item entrance variant for staggered lists.
 */
export const fadeInUpVariants = {
  initial: {
    opacity: 0,
    y: 14,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION_NORMAL,
      ease: EASE_OUT_EXPO,
    },
  },
};

/**
 * Pop-in variant for badges, status chips, and counters.
 */
export const popBadgeVariants = {
  initial: {
    opacity: 0,
    scale: 0.82,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 420,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.15 },
  },
};

/**
 * Button tap micro-interaction (whileTap scale 0.97).
 */
export const buttonTapProps = {
  whileTap: { scale: 0.97 },
  transition: { duration: DURATION_MICRO },
};

/**
 * Nav active pill sliding transition (shared layoutId).
 */
export const navPillTransition = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
};

/**
 * Modal / Dialog box variants.
 */
export const dialogVariants = {
  initial: {
    opacity: 0,
    scale: 0.94,
    y: 14,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: DURATION_NORMAL,
      ease: EASE_OUT_EXPO,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: {
      duration: 0.18,
      ease: 'easeIn',
    },
  },
};

/**
 * Backdrop overlay variants for dialogs and sheets.
 */
export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DURATION_FAST } },
  exit: { opacity: 0, transition: { duration: DURATION_MICRO } },
};
