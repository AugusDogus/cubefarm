// Register skill figures without changing their source or the shared kernel.
window.cubeFarmFigures = {};
window.hairline = (figure) => {
  window.cubeFarmFigures[figure.name] = figure;
};

// The game page owns motion preferences, just as the standalone bench does.
(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync = () => HL.setReducedMotion(motion.matches);
  sync();
  motion.addEventListener('change', sync);
})();
