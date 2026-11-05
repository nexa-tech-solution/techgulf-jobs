/** Runs a task once the page has loaded and the browser is free. Returns a cancel function. */
export function whenIdle(task: () => void, timeout = 4000) {
  let cancelled = false;
  let cancelIdle = () => {};
  const schedule = () => {
    if (cancelled) return;
    // Safari has no requestIdleCallback
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(task, { timeout });
      cancelIdle = () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(task, 1500);
      cancelIdle = () => clearTimeout(id);
    }
  };
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", schedule);
    cancelIdle();
  };
}
