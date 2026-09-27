const FOCUSABLE_SELECTOR = 'input:not([type="hidden"]), select, textarea, button, [tabindex]:not([tabindex="-1"])';

export function revealFirstInlineError(errors) {
  const errorKeys = new Set(
    Object.entries(errors || {}).filter(([, message]) => Boolean(message)).map(([field]) => field)
  );
  if (errorKeys.size === 0 || typeof document === 'undefined') return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const target = Array.from(document.querySelectorAll('[data-error-field]'))
        .find(element => errorKeys.has(element.dataset.errorField));
      if (!target) return;

      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      const focusTarget = target.matches(FOCUSABLE_SELECTOR)
        ? target
        : target.querySelector(FOCUSABLE_SELECTOR);
      focusTarget?.focus({ preventScroll: true });
    });
  });
}
