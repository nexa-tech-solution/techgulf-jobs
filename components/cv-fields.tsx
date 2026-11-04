"use client";

export interface EntryField<T> {
  key: keyof T & string;
  label: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  /** Dates and years read left to right, even on Arabic pages. */
  ltr?: boolean;
}

interface Props<T> {
  title: string;
  sub?: string;
  fields: EntryField<T>[];
  entries: T[];
  blank: T;
  onChange: (entries: T[]) => void;
  addLabel: string;
  removeLabel: string;
  inputClassName: string;
}

/** A CV section the user can add several entries to, such as jobs or degrees. */
export function CvEntries<T extends Record<string, string>>({ title, sub, fields, entries, blank, onChange, addLabel, removeLabel, inputClassName }: Props<T>) {
  const update = (index: number, key: keyof T, value: string) =>
    onChange(entries.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry)));

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 md:p-6">
      <h2 className="font-semibold">{title}</h2>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      {entries.map((entry, index) => (
        <div key={index} className="mt-4 rounded-xl border border-line p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className={`block ${field.multiline ? "sm:col-span-2" : ""}`}>
                <span className="mb-1.5 block text-sm font-medium">{field.label}</span>
                {field.multiline ? (
                  <textarea rows={3} required={field.required} value={entry[field.key]} placeholder={field.placeholder} onChange={(e) => update(index, field.key, e.target.value)}
                    className={`${inputClassName} h-auto py-2`} />
                ) : (
                  <input required={field.required} dir={field.ltr ? "ltr" : undefined} value={entry[field.key]} placeholder={field.placeholder} onChange={(e) => update(index, field.key, e.target.value)}
                    className={inputClassName} />
                )}
              </label>
            ))}
          </div>
          <button type="button" onClick={() => onChange(entries.filter((_, i) => i !== index))} className="mt-3 text-sm font-medium text-danger hover:underline">{removeLabel}</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...entries, blank])} className="mt-4 h-11 rounded-lg border border-line px-4 text-sm font-semibold hover:border-primary">+ {addLabel}</button>
    </section>
  );
}
