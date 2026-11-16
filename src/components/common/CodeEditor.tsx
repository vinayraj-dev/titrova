import { useMemo, useRef, useState, type CSSProperties, type DragEvent } from 'react';
import { highlight, type Lang } from '@/utils/highlight';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  lang: Lang;
  placeholder?: string;
  /** CSS height, e.g. "22rem". */
  height?: string;
  /** Called on Ctrl+Enter / ⌘+Enter. */
  onRun?: () => void;
  describedBy?: string;
  invalid?: boolean;
  /** Wrap long lines (plain text such as tokens and URLs). */
  softWrap?: boolean;
}

const MAX_DROP_BYTES = 5 * 1024 * 1024;

/**
 * A lightweight code editor: a transparent <textarea> over a syntax-highlighted <pre>.
 * It is a real textarea, so the keyboard, screen readers, undo and mobile input all behave natively.
 * Text files can be dropped onto it; they are read locally and never uploaded.
 */
export function CodeEditor({ id, label, value, onChange, lang, placeholder, height = '22rem', onRun, describedBy, invalid, softWrap }: Props) {
  const preRef = useRef<HTMLPreElement>(null);
  const [drag, setDrag] = useState(false);
  const html = useMemo(() => highlight(value, lang), [value, lang]);

  const onDrop = (e: DragEvent<HTMLTextAreaElement>) => {
    const file = e.dataTransfer.files?.[0];
    setDrag(false);
    if (!file) return;
    e.preventDefault();
    if (file.size > MAX_DROP_BYTES) return;
    file.text().then(onChange).catch(() => {});
  };

  return (
    <div className={softWrap ? 'editor editor-wrap' : 'editor'} data-drag={drag} style={{ '--h': height } as CSSProperties}>
      <pre ref={preRef} className="editor-hl" aria-hidden="true">
        <code dangerouslySetInnerHTML={{ __html: html + '\n' }} />
      </pre>
      <textarea
        id={id}
        className="editor-input"
        aria-label={label}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        value={value}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        wrap={softWrap ? 'soft' : 'off'}
        onChange={(e) => onChange(e.target.value)}
        onScroll={(e) => {
          if (!preRef.current) return;
          preRef.current.scrollTop = e.currentTarget.scrollTop;
          preRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }}
        onKeyDown={(e) => {
          if (onRun && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onRun();
          }
        }}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            setDrag(true);
          }
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      />
    </div>
  );
}
