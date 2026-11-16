import { useMemo, useState } from 'react';
import { Check, Plus, Search, Trash2, X } from 'lucide-react';
import { CodeOutput, ErrorNote, Pane, Switch, WarningList } from '@/components/common/Panel';
import { ToolShell } from '@/components/tools/ToolShell';
import { METADATA_TYPES, PRESETS } from '@/data/metadataTypes';
import { toolBySlug } from '@/data/tools';
import { toMessage } from '@/utils/errors';
import { cn } from '@/utils/io';
import { buildPackageXml, parseMembers, validateApiVersion, type PackageTypeSelection } from '@/utils/packageXml';
import { content } from './content';

const tool = toolBySlug('package-xml-builder');
const catalogue = new Map(METADATA_TYPES.map((t) => [t.name, t]));
const DEFAULT_VERSION = '65.0';
const initialSelection: PackageTypeSelection[] = PRESETS[0].types.slice(0, 2).map((t) => ({ ...t, members: [...t.members] }));

function TypeEditor({
  sel,
  onChange,
  onRemove,
}: {
  sel: PackageTypeSelection;
  onChange: (next: PackageTypeSelection) => void;
  onRemove: () => void;
}) {
  const meta = catalogue.get(sel.name);
  const [draft, setDraft] = useState('');
  const canWildcard = meta ? meta.wildcard : true;
  const add = () => {
    const names = parseMembers(draft);
    if (!names.length) return;
    onChange({ ...sel, members: [...new Set([...sel.members, ...names])] });
    setDraft('');
  };
  const inputId = `members-${sel.name}`;

  return (
    <li className="pop-in rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="font-mono text-[0.98rem] font-semibold">{sel.name}</p>
        <p className="text-sm text-muted">{meta ? meta.label : 'Custom entry, not in the catalogue'}</p>
        <button type="button" className="btn btn-ghost btn-sm ml-auto !min-h-[2.25rem] !px-2" onClick={onRemove} aria-label={`Remove ${sel.name}`}>
          <X size={17} aria-hidden />
        </button>
      </div>
      {canWildcard ? (
        <Switch label="Include every component (*)" checked={sel.wildcard} onChange={(wildcard) => onChange({ ...sel, wildcard })} />
      ) : (
        <p className="mt-1 text-sm text-iodine-ink">This type has no wildcard. Name each member.</p>
      )}
      <div className="mt-1 flex gap-2">
        <label htmlFor={inputId} className="sr-only">Member names for {sel.name}</label>
        <input
          id={inputId}
          className="input font-mono text-[0.92rem]"
          placeholder={meta ? meta.example : 'MemberName'}
          value={draft}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
        />
        <button type="button" className="btn btn-soft shrink-0" onClick={add} aria-label={`Add member to ${sel.name}`}>
          <Plus size={17} aria-hidden /> Add
        </button>
      </div>
      {meta?.note && <p className="mt-2 text-sm text-muted">{meta.note}</p>}
      {sel.members.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={`${sel.name} members`}>
          {sel.members.map((m) => (
            <li key={m} className="pop-in inline-flex max-w-full items-center gap-1 rounded-lg bg-sunken py-1 pl-2.5 pr-1 font-mono text-sm">
              <span className="truncate">{m}</span>
              <button
                type="button"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted hover:bg-ink/10 hover:text-ink"
                aria-label={`Remove ${m}`}
                onClick={() => onChange({ ...sel, members: sel.members.filter((x) => x !== m) })}
              >
                <X size={14} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function PackageXmlPage() {
  const [version, setVersion] = useState(DEFAULT_VERSION);
  const [selections, setSelections] = useState<PackageTypeSelection[]>(initialSelection);
  const [search, setSearch] = useState('');
  const [preset, setPreset] = useState<string | null>(null);

  const selected = new Set(selections.map((s) => s.name));
  const term = search.trim().toLowerCase();
  const matches = METADATA_TYPES.filter((t) => !term || t.name.toLowerCase().includes(term) || t.label.toLowerCase().includes(term));
  const customName = search.trim();
  const canAddCustom = /^[A-Za-z][A-Za-z0-9]*$/.test(customName) && !METADATA_TYPES.some((t) => t.name.toLowerCase() === term) && !selected.has(customName);

  const toggle = (name: string) => {
    setPreset(null);
    setSelections((prev) =>
      prev.some((s) => s.name === name)
        ? prev.filter((s) => s.name !== name)
        : [...prev, { name, members: [], wildcard: catalogue.get(name)?.wildcard ?? true }],
    );
  };

  const versionError = validateApiVersion(version);
  const { result, error } = useMemo(() => {
    if (!selections.length) return { result: null, error: '' };
    try {
      return { result: buildPackageXml(selections, version), error: '' };
    } catch (e) {
      return { result: null, error: toMessage(e) };
    }
  }, [selections, version]);

  return (
    <ToolShell tool={tool} content={content}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Pane
          title="Metadata types"
          side="in"
          meta={`${selections.length} selected`}
          actions={
            <button
              type="button"
              className="btn btn-soft btn-sm"
              disabled={!selections.length}
              onClick={() => {
                setSelections([]);
                setPreset(null);
              }}
            >
              <Trash2 size={16} aria-hidden /> Clear selection
            </button>
          }
        >
          <div className="grid gap-5 p-4">
            <div>
              <p className="label">Start from a preset</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="chip"
                    aria-pressed={preset === p.id}
                    title={p.description}
                    onClick={() => {
                      setPreset(p.id);
                      setSelections(p.types.map((t) => ({ ...t, members: [...t.members] })));
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="type-search" className="label">Search metadata types</label>
              <div className="relative">
                <Search size={17} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="type-search"
                  type="search"
                  className="input pl-10"
                  placeholder="For example Flow, layout or permission"
                  value={search}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <ul className="mt-2 grid max-h-[13.5rem] gap-1 overflow-y-auto rounded-xl border border-line bg-sunken p-1.5 sm:grid-cols-2" aria-label="Metadata type catalogue">
                {matches.map((t) => {
                  const on = selected.has(t.name);
                  return (
                    <li key={t.name}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(t.name)}
                        className={cn(
                          'flex min-h-[2.75rem] w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors duration-200',
                          on ? 'bg-ink text-paper' : 'bg-surface hover:bg-copper/10',
                        )}
                      >
                        <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-md border', on ? 'border-copper bg-copper text-white' : 'border-line')}>
                          {on && <Check size={13} aria-hidden className="pop-in" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-[0.85rem] font-semibold">{t.name}</span>
                          <span className={cn('block truncate text-xs', on ? 'text-paper/70' : 'text-muted')}>{t.label}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
                {canAddCustom && (
                  <li className="sm:col-span-2">
                    <button
                      type="button"
                      className="flex min-h-[2.75rem] w-full items-center gap-2 rounded-lg border border-dashed border-copper bg-surface px-3 py-1.5 text-left font-semibold text-copper-ink"
                      onClick={() => {
                        toggle(customName);
                        setSearch('');
                      }}
                    >
                      <Plus size={16} aria-hidden /> Add “{customName}” as a metadata type
                    </button>
                  </li>
                )}
                {!matches.length && !canAddCustom && (
                  <li className="px-3 py-4 text-sm text-muted sm:col-span-2">No type matches. Type an exact metadata type name (letters and numbers only) to add it.</li>
                )}
              </ul>
              <p className="mt-2 text-sm text-muted">
                This list covers {METADATA_TYPES.length} commonly used types, not the full Metadata API. Add any other type by name.
              </p>
            </div>

            <div className="max-w-[14rem]">
              <label htmlFor="api-version" className="label">API version</label>
              <input
                id="api-version"
                className="input font-mono"
                inputMode="decimal"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                aria-invalid={!!versionError}
                aria-describedby="api-version-hint"
              />
              <p id="api-version-hint" className={cn('mt-1.5 text-sm', versionError ? 'text-danger' : 'text-muted')}>
                {versionError ?? 'Match your project or org.'}
              </p>
            </div>

            {selections.length > 0 && (
              <div>
                <p className="label">Members for each selected type</p>
                <ul className="grid gap-3">
                  {selections.map((sel) => (
                    <TypeEditor
                      key={sel.name}
                      sel={sel}
                      onChange={(next) => setSelections((prev) => prev.map((s) => (s.name === sel.name ? next : s)))}
                      onRemove={() => toggle(sel.name)}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Pane>

        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <CodeOutput
            title="package.xml"
            code={result?.xml ?? ''}
            lang="xml"
            fileName="package.xml"
            mime="application/xml"
            height="30rem"
            meta={result ? `${result.typeCount} ${result.typeCount === 1 ? 'type' : 'types'}, ${result.memberCount} ${result.memberCount === 1 ? 'member' : 'members'}` : undefined}
            empty="Select a preset or a metadata type on the left. Your package.xml builds itself here as you go."
          />
          {error && selections.length > 0 && <ErrorNote>{error}</ErrorNote>}
          {result && <WarningList items={result.warnings} />}
        </div>
      </div>
    </ToolShell>
  );
}
