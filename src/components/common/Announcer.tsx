import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';

const Ctx = createContext<(message: string) => void>(() => {});

/** Short confirmations ("Copied") that are both shown and read out by screen readers. */
export const useAnnounce = () => useContext(Ctx);

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; id: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const announce = useCallback((text: string) => {
    setMsg({ text, id: Date.now() });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2400);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <Ctx.Provider value={announce}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-0 z-[80] flex justify-center px-4"
        style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {msg && (
          <div key={msg.id} className="pop-in flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-paper shadow-panel">
            <Check size={16} aria-hidden className="text-onink" />
            {msg.text}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}
