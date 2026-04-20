import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

const useAutoLogout = (timeout = 30 * 60 * 1000) => {
  const { logout, user } = useAuth(); // get user
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      logout();
    }, timeout);
  };

  useEffect(() => {
    // 🚫 Do nothing if not logged in
    if (!user) return;

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keypress",
      "scroll",
      "touchstart",
    ];

    const handleUserActivity = () => resetTimer();

    activityEvents.forEach((event) =>
      window.addEventListener(event, handleUserActivity),
    );

    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      activityEvents.forEach((event) =>
        window.removeEventListener(event, handleUserActivity),
      );
    };
  }, [timeout, logout, user]);

  return null;
};

export default useAutoLogout;
