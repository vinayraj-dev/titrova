import { useMemo, useRef, useState } from 'react';
import { Fingerprint, Plus, Trash2, X } from 'lucide-react';
import { CodeOutput, ErrorNote, InfoNote, Pane, Segmented, Switch, WarningList } from '@/components/common/Panel';
import { ToolShell } from '@/components/tools/ToolShell';
import { toolBySlug } from '@/data/tools';
import { toMessage } from '@/utils/errors';
import { FIELD_TYPES, generateTestData, type FieldSpec, type FieldType, type OutputMode } from '@/utils/testData';
import { content, OBJECT_PRESETS, VALUE_HINTS } from './content';

const tool = toolBySlug('apex-test-data-generator');

interface Row extends FieldSpec {
  id: number;
}

const toRows = (fields: FieldSpec[], startId: number): Row[] => fields.map((f, i) => ({ ...f, id: startId + i }));
const initialPreset = OBJECT_PRESETS[0];

export default function TestDataPage() {
  const nextId = useRef(100);
  const [objectName, setObjectName] = useState(initialPreset.objectName);
  const [rows, setRows] = useState<Row[]>(() => toRows(initialPreset.fields, 1));
  const [count, setCount] = useState('5');
  const [mode, setMode] = useState<OutputMode>('factory');
  const [doInsert, setDoInsert] = useState(true);

  const update = (id: number, patch: Partial<Row>) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const { result, error } = useMemo(() => {
    try {
      return { result: generateTestData({ objectName, fields: rows, count: Number(count), mode, doInsert }), error: '' };
    } catch (e) {
      return { result: null, error: toMessage(e) };
    }
  }, [objectName, rows, count, mode, doInsert]);

  return (
    <ToolShell tool={tool} content={content}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Pane
          title="Record definition"
          side="in"
          meta={`${rows.length} ${rows.length === 1 ? 'field' : 'fields'}`}
          actions={
            <button type="button" className="btn btn-soft btn-sm" disabled={!rows.length} onClick={() => setRows([])}>
              <Trash2 size={16} aria-hidden /> Clear fields
            </button>
          }
        >
          <div className="grid gap-5 p-4">
            <div>
              <p className="label">Start from an object</p>
              <div className="flex flex-wrap gap-2">
                {OBJECT_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className="chip"
                    aria-pressed={objectName === p.objectName}
                    onClick={() => {
                      const start = nextId.current;
                      nextId.current += p.fields.length;
                      setObjectName(p.objectName);
                      setRows(toRows(p.fields, start));
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-3 sm:grid-cols-[minmax(0,1fr)_9rem] sm:gap-4">
              <div>
                <label htmlFor="object-name" className="label">Object API name</label>
                <input
                  id="object-name"
                  className="input font-mono text-[0.95rem]"
                  value={objectName}
                  placeholder="Account or Invoice__c"
                  spellCheck={false}
                  autoComplete="off"
                  onChange={(e) => setObjectName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="record-count" className="label">Records</label>
                <input
                  id="record-count"
                  className="input font-mono"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={10000}
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                />
              </div>
            </div>

            <fieldset>
              <legend className="label">Fields</legend>
              <ul className="grid gap-2.5">
                {rows.map((row, i) => {
                  const canBeUnique = row.type === 'String' || row.type === 'Email';
                  return (
                    <li key={row.id} className="pop-in grid gap-2 rounded-2xl border border-line bg-sunken/60 p-2.5">
                      <div className="grid grid-cols-[minmax(0,1fr)_8.25rem] gap-2">
                        <input
                          className="input font-mono text-[0.9rem]"
                          aria-label={`Field ${i + 1} API name`}
                          placeholder="Field API name"
                          value={row.name}
                          spellCheck={false}
                          autoComplete="off"
                          onChange={(e) => update(row.id, { name: e.target.value })}
                        />
                        <select
                          className="input"
                          aria-label={`Field ${i + 1} type`}
                          value={row.type}
                          onChange={(e) => {
                            const type = e.target.value as FieldType;
                            update(row.id, { type, value: type === 'Boolean' ? 'true' : '', unique: false });
                          }}
                        >
                          {FIELD_TYPES.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        {row.type === 'Boolean' ? (
                          <select className="input min-w-0 flex-1" aria-label={`Field ${i + 1} sample value`} value={row.value.toLowerCase() === 'false' ? 'false' : 'true'} onChange={(e) => update(row.id, { value: e.target.value })}>
                            <option>true</option>
                            <option>false</option>
                          </select>
                        ) : (
                          <input
                            className="input min-w-0 flex-1 text-[0.95rem]"
                            aria-label={`Field ${i + 1} sample value`}
                            placeholder={VALUE_HINTS[row.type]}
                            value={row.value}
                            spellCheck={false}
                            autoComplete="off"
                            onChange={(e) => update(row.id, { value: e.target.value })}
                          />
                        )}
                        {canBeUnique && (
                          <button
                            type="button"
                            className="chip min-h-[2.75rem] shrink-0 !rounded-xl !px-2.5"
                            aria-pressed={!!row.unique}
                            title="Add the loop counter so every record gets a different value"
                            onClick={() => update(row.id, { unique: !row.unique })}
                          >
                            <Fingerprint size={15} aria-hidden /> Unique
                          </button>
                        )}
                        <button
                          type="button"
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                          aria-label={`Remove field ${row.name || i + 1}`}
                          onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                        >
                          <X size={18} aria-hidden />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {!rows.length && <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-muted">No fields yet. Add a field to start building a record.</p>}
              <button
                type="button"
                className="btn btn-soft mt-3"
                onClick={() => setRows((prev) => [...prev, { id: nextId.current++, name: '', type: 'String', value: '' }])}
              >
                <Plus size={17} aria-hidden /> Add field
              </button>
            </fieldset>

            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <Segmented
                label="Generate"
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'factory', label: 'Factory class' },
                  { value: 'testSetup', label: '@TestSetup class' },
                  { value: 'snippet', label: 'Snippet' },
                ]}
              />
              {mode === 'snippet' && <Switch label="Add insert statement" checked={doInsert} onChange={setDoInsert} />}
            </div>
          </div>
        </Pane>

        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <CodeOutput
            title="Apex test data"
            code={result?.code ?? ''}
            lang="apex"
            fileName={result?.fileName ?? 'TestData.cls'}
            height="30rem"
            meta={result ? `${result.code.trimEnd().split('\n').length} lines` : undefined}
            empty="Describe a record on the left. The Apex to create it appears here."
          />
          {error && <ErrorNote>{error}</ErrorNote>}
          {result && <WarningList items={result.warnings} />}
          <InfoNote>
            Generated sample data may need adjusting for your org’s required fields, validation rules and relationships.
          </InfoNote>
        </div>
      </div>
    </ToolShell>
  );
}
