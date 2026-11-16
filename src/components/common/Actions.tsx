import { useRef, useState } from 'react';
import { Check, ClipboardPaste, Copy, Download } from 'lucide-react';
import { isSingleFile } from '@/data/site';
import { cn, copyText, downloadText } from '@/utils/io';
import { useAnnounce } from './Announcer';

export function CopyButton({ text, label = 'Copy', className, disabled }: { text: string; label?: string; className?: string; disabled?: boolean }) {
  const [done, setDone] = useState(false);
  const announce = useAnnounce();
  const timer = useRef<ReturnType<typeof setTimeout>>();
  return (
    <button
      type="button"
      className={cn('btn btn-soft btn-sm burst', className)}
      data-on={done}
      disabled={disabled || !text}
      onClick={async () => {
        const ok = await copyText(text);
        announce(ok ? 'Copied to clipboard' : 'Copy failed. Select the text and copy it manually.');
        if (!ok) return;
        setDone(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setDone(false), 1600);
      }}
    >
      {done ? <Check size={16} aria-hidden className="pop-in text-copper-ink" /> : <Copy size={16} aria-hidden />}
      {done ? 'Copied' : label}
    </button>
  );
}

export function DownloadButton({
  text,
  fileName,
  mime,
  label = 'Download',
  className,
  disabled,
}: {
  text: string;
  fileName: string;
  mime?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}) {
  const announce = useAnnounce();
  return (
    <button
      type="button"
      className={cn('btn btn-soft btn-sm', className)}
      disabled={disabled || !text}
      title={`Download ${fileName}`}
      onClick={() => {
        if (isSingleFile) {
          announce(`Downloads are switched off in this preview. On the live site this saves ${fileName}.`);
          return;
        }
        downloadText(fileName, text, mime);
        announce(`Downloaded ${fileName}`);
      }}
    >
      <Download size={16} aria-hidden />
      {label}
    </button>
  );
}

/** Reads the clipboard when the browser allows it; otherwise explains what to do. */
export function PasteButton({ onPaste, className }: { onPaste: (text: string) => void; className?: string }) {
  const announce = useAnnounce();
  return (
    <button
      type="button"
      className={cn('btn btn-soft btn-sm', className)}
      onClick={async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            onPaste(text);
            announce('Pasted from clipboard');
          } else announce('The clipboard is empty');
        } catch {
          announce('Your browser blocked clipboard access. Click the editor and press Ctrl+V or ⌘V.');
        }
      }}
    >
      <ClipboardPaste size={16} aria-hidden />
      Paste
    </button>
  );
}
