import { useEffect, useRef } from "react";

//const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
//const IDLE_TIMEOUT = 10 * 1000; 10 sec
const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export default function useIdleLogout(logout, enabled = true) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        logout();
      }, IDLE_TIMEOUT);
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true })
    );

    resetTimer();

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [logout, enabled]);
}