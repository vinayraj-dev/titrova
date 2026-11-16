import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { TOOLS } from '@/data/tools';
import { prefersReducedMotion } from '@/hooks/pointerFx';
import { highlight, type Lang } from '@/utils/highlight';
import { cn } from '@/utils/io';
import { jsonToApex } from '@/utils/jsonToApex';
import { buildPackageXml } from '@/utils/packageXml';
import { analyzeBatch } from '@/utils/salesforceId';
import { formatSoql } from '@/utils/soql';
import { generateTestData } from '@/utils/testData';

interface Scene {
  slug: string;
  inLang: Lang;
  outLang: Lang;
  input: string;
  output: string;
}

/**
 * Every output shown here is produced live by the same functions the tools use —
 * the demo cannot drift away from what the product really does.
 */
function buildScenes(): Scene[] {
  const json = `{\n  "orderId": "A-1042",\n  "total": 249.5,\n  "paid": true,\n  "lines": [\n    { "sku": "LAB-01", "quantity": 2 }\n  ]\n}`;
  const soql =
    "select Id, Name, (select LastName from Contacts) from Account where Industry = 'Technology' and AnnualRevenue > 1000000 order by Name limit 20";
  const ids = '001A0000006Vm9r\n0035g00000XyZaB\n5005g00000AbCdE\n006A000000QwErT';
  return [
    {
      slug: 'json-to-apex',
      inLang: 'json',
      outLang: 'apex',
      input: json,
      output: jsonToApex(json, { rootClassName: 'OrderResponse', parseMethod: false }).code.split('\n').slice(4).join('\n').trimEnd(),
    },
    { slug: 'soql-formatter', inLang: 'soql', outLang: 'soql', input: soql, output: formatSoql(soql).formatted },
    {
      slug: 'salesforce-id-converter',
      inLang: 'text',
      outLang: 'text',
      input: ids,
      output: analyzeBatch(ids).map((r) => r.id18).join('\n'),
    },
    {
      slug: 'package-xml-builder',
      inLang: 'text',
      outLang: 'xml',
      input: 'ApexClass\n  every class (*)\n\nLightningComponentBundle\n  accountList\n  accountTile\n\nAPI version 62.0',
      output: buildPackageXml(
        [
          { name: 'ApexClass', members: [], wildcard: true },
          { name: 'LightningComponentBundle', members: ['accountList', 'accountTile'], wildcard: false },
        ],
        '62.0',
      ).xml.trimEnd(),
    },
    {
      slug: 'apex-test-data-generator',
      inLang: 'text',
      outLang: 'apex',
      input: 'Object    Contact\nRecords   200\n\nLastName  String  Test Contact\nEmail     Email   qa@example.com\nActive__c Boolean true',
      output: generateTestData({
        objectName: 'Contact',
        count: 200,
        mode: 'snippet',
        doInsert: true,
        fields: [
          { name: 'LastName', type: 'String', value: 'Test Contact', unique: true },
          { name: 'Email', type: 'Email', value: 'qa@example.com', unique: true },
          { name: 'Active__c', type: 'Boolean', value: 'true' },
        ],
      }).code.trimEnd(),
    },
  ];
}

type Phase = 'type' | 'react' | 'out' | 'hold';

export function Reactor() {
  const scenes = useMemo(buildScenes, []);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('hold');
  const [typed, setTyped] = useState(Number.MAX_SAFE_INTEGER);
  const [lines, setLines] = useState(Number.MAX_SAFE_INTEGER);
  const [auto, setAuto] = useState(true);
  const [ready, setReady] = useState(false); // animation is allowed (mounted, motion OK)
  const [visible, setVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  const scene = scenes[idx];
  const tool = TOOLS.find((t) => t.slug === scene.slug)!;
  const outLines = useMemo(() => highlight(scene.output, scene.outLang).split('\n'), [scene]);
  const running = ready && auto && visible;

  const play = (i: number) => {
    setIdx(i);
    setTyped(0);
    setLines(0);
    setPhase('type');
  };
  const showStill = (i: number) => {
    setIdx(i);
    setTyped(Number.MAX_SAFE_INTEGER);
    setLines(Number.MAX_SAFE_INTEGER);
    setPhase('hold');
  };

  useEffect(() => {
    if (prefersReducedMotion()) return;
    // The first scene is shown complete (good for the first paint); cycling starts from its "hold" phase.
    setReady(true);
    if (typeof IntersectionObserver === 'undefined' || !rootRef.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(rootRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    let t: ReturnType<typeof setTimeout>;
    if (phase === 'type') {
      const step = Math.max(1, Math.ceil(scene.input.length / 36));
      t = typed >= scene.input.length ? setTimeout(() => setPhase('react'), 260) : setTimeout(() => setTyped((n) => n + step), 42);
    } else if (phase === 'react') {
      t = setTimeout(() => {
        setLines(0);
        setPhase('out');
      }, 620);
    } else if (phase === 'out') {
      t = lines >= outLines.length ? setTimeout(() => setPhase('hold'), 0) : setTimeout(() => setLines((n) => Math.min(outLines.length, n + 2)), 110);
    } else {
      t = setTimeout(() => play((idx + 1) % scenes.length), 3200);
    }
    return () => clearTimeout(t);
  }, [running, phase, typed, lines, idx, scene, outLines.length, scenes.length]);

  const inputHtml = highlight(scene.input.slice(0, typed), scene.inLang);
  const showOutput = phase === 'out' || phase === 'hold';

  return (
    <div ref={rootRef} className="card overflow-hidden rounded-[1.75rem] shadow-panel">
      <div className="flex items-center gap-2 border-b border-line bg-surface px-2 py-2 sm:px-3">
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto" role="group" aria-label="Choose a demo">
          {scenes.map((s, i) => {
            const t = TOOLS.find((x) => x.slug === s.slug)!;
            const on = i === idx;
            return (
              <button
                key={s.slug}
                type="button"
                aria-pressed={on}
                onClick={() => (running ? play(i) : showStill(i))}
                className={cn(
                  'relative flex h-11 shrink-0 items-center gap-2 overflow-hidden rounded-xl px-3 text-sm font-semibold transition-colors duration-300',
                  on ? 'bg-ink text-paper' : 'text-muted hover:bg-sunken hover:text-ink',
                )}
              >
                <t.icon size={16} aria-hidden />
                <span className={cn(!on && 'sr-only xl:not-sr-only')}>{t.short}</span>
                {on && running && (
                  <span key={idx} aria-hidden className="progress-fill absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-iodine to-copper" style={{ '--dur': '6.6s' } as React.CSSProperties} />
                )}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            if (auto) showStill(idx);
            setAuto((a) => !a);
          }}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line text-muted transition-colors hover:text-ink"
          aria-label={auto ? 'Pause the demo' : 'Play the demo'}
        >
          {auto ? <Pause size={17} aria-hidden /> : <Play size={17} aria-hidden />}
        </button>
      </div>

      <p className="sr-only">
        Demonstration: the {tool.name} turns {tool.from} into {tool.to}.
      </p>
      <div className="grid bg-sunken lg:grid-cols-[minmax(0,1fr)_14px_minmax(0,1.15fr)]" aria-hidden="true">
        <div className="relative h-[13.5rem] overflow-hidden p-4 sm:p-5 lg:h-[20rem]">
          <span className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-iodine-ink">
            <span className="h-2 w-2 rounded-full bg-iodine" /> {tool.from}
          </span>
          <pre className="font-mono text-[12px] leading-[1.6] sm:text-[13px]" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            <code className={cn(phase === 'type' && running && 'caret')} dangerouslySetInnerHTML={{ __html: inputHtml }} />
          </pre>
        </div>
        <div className="tube h-[14px] lg:h-auto" data-active={phase === 'react' && running}>
          {[0, 1, 2, 3].map((n) => (
            <i key={n} style={{ '--n': n } as React.CSSProperties} />
          ))}
        </div>
        <div className="relative h-[17.5rem] overflow-hidden bg-surface p-4 sm:p-5 lg:h-[20rem]">
          <span className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-copper-ink">
            <span className="h-2 w-2 rounded-full bg-copper" /> {tool.to}
          </span>
          <pre className="overflow-hidden font-mono text-[12px] leading-[1.6] sm:text-[13px]">
            {showOutput &&
              outLines.slice(0, lines).map((html, i) => (
                <code key={`${idx}-${i}`} className={cn('block whitespace-pre', running && 'line-in')} dangerouslySetInnerHTML={{ __html: html || ' ' }} />
              ))}
          </pre>
          {phase === 'react' && running && (
            <div className="absolute inset-0 grid place-items-center">
              <span className="reagent-text font-display text-lg font-semibold">Running in your browser</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-4 py-3 sm:px-5">
        <p className="text-sm text-muted">This is the real engine running, not a recording.</p>
        <Link to={tool.path} className="btn btn-primary btn-sm group">
          Open the {tool.name.replace(' Class Generator', ' generator')}
          <ArrowRight size={16} aria-hidden className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
