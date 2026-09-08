import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { AppState } from "react-native";

// Recompute on every entry, foreground transition, and local midnight.
export function useCategoryClock() {
  const [now, setNow] = useState(() => new Date());
  useFocusEffect(
    useCallback(() => {
      let timer: ReturnType<typeof setTimeout>;
      const update = () => {
        clearTimeout(timer);
        const current = new Date();
        setNow(current);
        const midnight = new Date(
          current.getFullYear(),
          current.getMonth(),
          current.getDate() + 1,
        );
        timer = setTimeout(
          update,
          midnight.getTime() - current.getTime() + 100,
        );
      };
      update();
      const listener = AppState.addEventListener("change", (state) => {
        if (state === "active") update();
      });
      return () => {
        clearTimeout(timer);
        listener.remove();
      };
    }, []),
  );
  return now;
}
