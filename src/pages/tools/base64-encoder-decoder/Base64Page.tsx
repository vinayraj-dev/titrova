import { useMemo, useState } from 'react';
import { Download, FileUp, Trash2 } from 'lucide-react';
import { useAnnounce } from '@/components/common/Announcer';
import { PasteButton } from '@/components/common/Actions';
import { CodeEditor } from '@/components/common/CodeEditor';
import { CodeOutput, ErrorNote, InfoNote, Pane, Segmented, Switch } from '@/components/common/Panel';
import { ToolShell } from '@/components/tools/ToolShell';
import { isSingleFile } from '@/data/site';
import { toolBySlug } from '@/data/tools';
import { bytesToBase64, decodeBase64, encodeBase64, toHex } from '@/utils/base64';
import { toMessage } from '@/utils/errors';
import { content } from './content';

const tool = toolBySlug('base64-encoder-decoder');
const MAX_FILE = 10 * 1024 * 1024;

export default function Base64Page() {
  const announce = useAnnounce();
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [text, setText] = useState('Hello from Titrova! Héllo, नमस्ते, 👋');
  const [urlSafe, setUrlSafe] = useState(false);
  const [padding, setPadding] = useState(true);
  const [file, setFile] = useState<{ name: string; type: string; bytes: Uint8Array } | null>(null);
  const [dataUri, setDataUri] = useState(false);
  const [fileError, setFileError] = useState('');

  const out = useMemo(() => {
    try {
      if (mode === 'encode') {
        if (file) {
          const b64 = bytesToBase64(file.bytes, { urlSafe, padding });
          return { code: dataUri ? `data:${file.type || 'application/octet-stream'};base64,${bytesToBase64(file.bytes)}` : b64, error: '', binary: null };
        }
        if (!text) return { code: '', error: '', binary: null };
        return { code: encodeBase64(text, { urlSafe, padding }), error: '', binary: null };
      }
      if (!text.trim()) return { code: '', error: '', binary: null };
      const d = decodeBase64(text);
      return d.text !== null ? { code: d.text, error: '', binary: null } : { code: '', error: '', binary: d.bytes };
    } catch (e) {
      return { code: '', error: toMessage(e), binary: null };
    }
  }, [mode, text, urlSafe, padding, file, dataUri]);

  const pickFile = (f: File | undefined) => {
    setFileError('');
    if (!f) return;
    if (f.size > MAX_FILE) {
      setFileError('Files up to 10 MB can be encoded here.');
      return;
    }
    f.arrayBuffer().then((buf) => setFile({ name: f.name, type: f.type, bytes: new Uint8Array(buf) }));
  };

  const downloadBinary = (bytes: Uint8Array) => {
    if (isSingleFile) return announce('Downloads are switched off in this preview.');
    const url = URL.createObjectURL(new Blob([bytes as BlobPart]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'decoded.bin';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce('Downloaded decoded.bin');
  };

  return (
    <ToolShell tool={tool} content={content}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Pane
          title={mode === 'encode' ? 'Text to encode' : 'Base64 to decode'}
          side="in"
          actions={
            <>
              <PasteButton onPaste={(t) => { setFile(null); setText(t); }} />
              <button type="button" className="btn btn-soft btn-sm" onClick={() => { setText(''); setFile(null); }}>
                <Trash2 size={16} aria-hidden /> Clear
              </button>
            </>
          }
        >
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-line p-4">
            <Segmented label="Mode" value={mode} onChange={(m) => { setMode(m); setFile(null); if (out.code && !out.error) setText(out.code); }} options={[{ value: 'encode', label: 'Encode' }, { value: 'decode', label: 'Decode' }]} />
            {mode === 'encode' && (
              <label className="btn btn-soft cursor-pointer">
                <FileUp size={17} aria-hidden /> Encode a file
                <input type="file" className="sr-only" onChange={(e) => pickFile(e.target.files?.[0])} />
              </label>
            )}
          </div>
          {file ? (
            <div className="grid min-h-[12rem] place-items-center bg-sunken p-6 text-center">
              <div>
                <p className="font-semibold">{file.name}</p>
                <p className="text-sm text-muted">{file.bytes.length.toLocaleString('en-US')} bytes, read on your device</p>
                <button type="button" className="btn btn-soft btn-sm mt-3" onClick={() => setFile(null)}>Back to text</button>
              </div>
            </div>
          ) : (
            <div className="bg-sunken">
              <CodeEditor id="b64-input" softWrap label={mode === 'encode' ? 'Text to encode' : 'Base64 to decode'} value={text} onChange={setText} lang="text" height="12rem" placeholder={mode === 'encode' ? 'Type or paste text' : 'Paste Base64, for example SGVsbG8='} invalid={!!out.error} describedBy={out.error ? 'b64-error' : undefined} />
            </div>
          )}
          {mode === 'encode' && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-line p-4">
              <Switch label="URL-safe" checked={urlSafe} onChange={setUrlSafe} />
              <Switch label="Padding (=)" checked={padding} onChange={setPadding} />
              {file && <Switch label="As data URI" checked={dataUri} onChange={setDataUri} />}
            </div>
          )}
        </Pane>
        <div className="flex min-w-0 flex-col gap-4">
          {out.binary ? (
            <Pane title="Decoded bytes" side="out" meta={`${out.binary.length.toLocaleString('en-US')} bytes, binary`} actions={<button type="button" className="btn btn-soft btn-sm" onClick={() => downloadBinary(out.binary!)}><Download size={16} aria-hidden /> Download file</button>}>
              <pre tabIndex={0} aria-label="Hexadecimal preview" className="code-pre min-h-[12rem] whitespace-pre-wrap break-all bg-sunken p-4">{toHex(out.binary, 256)}</pre>
            </Pane>
          ) : (
            <CodeOutput
              title={mode === 'encode' ? 'Base64' : 'Decoded text'}
              code={out.code}
              lang="text"
              fileName={mode === 'encode' ? 'encoded.txt' : 'decoded.txt'}
              height="16rem"
              meta={out.code ? `${out.code.length.toLocaleString('en-US')} characters` : undefined}
              empty={mode === 'encode' ? 'Type text or choose a file. The Base64 appears here.' : 'Paste Base64 on the left. The decoded text appears here.'}
            />
          )}
          {(out.error || fileError) && <ErrorNote id="b64-error">{out.error || fileError}</ErrorNote>}
          <InfoNote>In Apex: EncodingUtil.base64Encode(Blob.valueOf(text)) and EncodingUtil.base64Decode(value).toString().</InfoNote>
        </div>
      </div>
    </ToolShell>
  );
}
