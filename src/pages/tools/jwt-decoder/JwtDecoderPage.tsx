import { useEffect, useMemo, useState } from 'react';
import { CircleCheck, CircleX, ShieldQuestion, Trash2 } from 'lucide-react';
import { PasteButton } from '@/components/common/Actions';
import { CodeEditor } from '@/components/common/CodeEditor';
import { CodeOutput, ErrorNote, Pane, Switch, WarningList } from '@/components/common/Panel';
import { ToolShell } from '@/components/tools/ToolShell';
import { toolBySlug } from '@/data/tools';
import { toMessage } from '@/utils/errors';
import { cn } from '@/utils/io';
import { canVerify, decodeJwt, jwtTimeStatus, verifyHmac } from '@/utils/jwt';
import { relativeTime } from '@/utils/timestamp';
import { content, SAMPLE_SECRET, SAMPLE_TOKEN } from './content';

const tool = toolBySlug('jwt-decoder');

export default function JwtDecoderPage() {
  const [token, setToken] = useState(SAMPLE_TOKEN);
  const [secret, setSecret] = useState('');
  const [b64Secret, setB64Secret] = useState(false);
  const [verdict, setVerdict] = useState<{ ok: boolean; text: string } | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => setNow(Date.now()), []);
  useEffect(() => setVerdict(null), [token, secret, b64Secret]);

  const { result, error } = useMemo(() => {
    try {
      return { result: decodeJwt(token), error: '' };
    } catch (e) {
      return { result: null, error: toMessage(e) };
    }
  }, [token]);

  const status = result && now !== null ? jwtTimeStatus(result.payload, now) : null;
  const verify = async () => {
    try {
      const ok = await verifyHmac(token, secret, b64Secret);
      setVerdict({ ok, text: ok ? 'Signature verified. The token was signed with this secret.' : 'Invalid signature. The secret is wrong or the token was changed.' });
    } catch (e) {
      setVerdict({ ok: false, text: toMessage(e) });
    }
  };

  return (
    <ToolShell tool={tool} content={content}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Pane
          title="Encoded token"
          side="in"
          actions={
            <>
              <PasteButton onPaste={setToken} />
              <button type="button" className="btn btn-soft btn-sm" disabled={!token} onClick={() => setToken('')}>
                <Trash2 size={16} aria-hidden /> Clear
              </button>
            </>
          }
        >
          <div className="bg-sunken">
            <CodeEditor id="jwt-input" softWrap label="JSON Web Token" value={token} onChange={setToken} lang="text" height="9rem" placeholder="eyJhbGciOi…" invalid={!!error} describedBy={error ? 'jwt-error' : undefined} />
          </div>
          <div className="grid gap-4 border-t border-line p-4">
            {result && (
              <div className="flex flex-wrap items-center gap-2" role="status">
                <span className="chip">Algorithm <strong className="font-mono text-ink">{result.alg}</strong></span>
                {status && (
                  <span className={cn('chip font-semibold', status.state === 'valid' && 'border-copper/50 text-copper-ink', status.state === 'expired' && 'border-danger/50 text-danger')}>
                    {status.text}
                  </span>
                )}
              </div>
            )}
            {result && canVerify(result.alg) ? (
              <div className="grid gap-3">
                <div>
                  <label htmlFor="jwt-secret" className="label">Secret for {result.alg}</label>
                  <input id="jwt-secret" className="input font-mono text-[0.95rem]" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="The signing secret" spellCheck={false} autoComplete="off" />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" className="btn btn-primary" onClick={verify}>Verify signature</button>
                  <button type="button" className="chip" onClick={() => { setToken(SAMPLE_TOKEN); setSecret(SAMPLE_SECRET); }}>Use the sample secret</button>
                  <Switch label="Secret is Base64" checked={b64Secret} onChange={setB64Secret} />
                </div>
                {verdict && (
                  <p role="status" className={cn('pop-in flex items-start gap-2 rounded-xl px-4 py-3', verdict.ok ? 'bg-copper/10 text-copper-ink' : 'bg-danger/10 text-danger')}>
                    {verdict.ok ? <CircleCheck size={18} aria-hidden className="mt-0.5 shrink-0" /> : <CircleX size={18} aria-hidden className="mt-0.5 shrink-0" />}
                    <span className="font-semibold">{verdict.text}</span>
                  </p>
                )}
              </div>
            ) : result ? (
              <p className="flex items-start gap-2 text-[0.95rem] text-muted">
                <ShieldQuestion size={18} aria-hidden className="mt-0.5 shrink-0" /> {result.alg} signatures need a public key, so they are decoded but not verified here.
              </p>
            ) : null}
          </div>
        </Pane>

        <div className="flex min-w-0 flex-col gap-4">
          <CodeOutput title="Header" code={result?.headerJson ?? ''} lang="json" fileName="jwt-header.json" mime="application/json" height="8.5rem" empty="The decoded header appears here." />
          <CodeOutput title="Payload" code={result?.payloadJson ?? ''} lang="json" fileName="jwt-payload.json" mime="application/json" height="12rem" empty="The decoded payload appears here." />
          {error && <ErrorNote id="jwt-error">{error}</ErrorNote>}
          {result && <WarningList items={result.warnings} />}
        </div>
      </div>

      {result && result.claims.length > 0 && (
        <section className="card mt-4 overflow-hidden" aria-labelledby="claims-title">
          <h2 id="claims-title" className="border-b border-line px-4 py-3 font-sans text-[0.95rem] font-semibold tracking-normal">Claims</h2>
          <table className="rtable w-full text-left text-[0.93rem]">
            <thead className="text-muted">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold">Claim</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Value</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {result.claims.map((c) => (
                <tr key={c.key}>
                  <th scope="row" className="px-4 py-2.5 align-top font-mono font-semibold">{c.key}</th>
                  <td data-label="Value" className="break-all px-4 py-2.5 align-top font-mono">{c.value}</td>
                  <td data-label="Meaning" className="px-4 py-2.5 align-top text-muted">
                    {c.label}
                    {c.time !== undefined && now !== null && <span className="block text-ink">{relativeTime(c.time, now)}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </ToolShell>
  );
}
