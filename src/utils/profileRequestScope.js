export function createProfileRequestScope() {
  let active = true;
  return {
    isActive: () => active,
    cancel: () => { active = false; },
    async run(request, onSuccess, onFailure, onFinally) {
      try {
        const value = await request();
        if (active) onSuccess(value);
      } catch (error) {
        if (active) onFailure?.(error);
      } finally {
        if (active) onFinally?.();
      }
    },
  };
}
