"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";

interface Props {
  suggestions: string[];
  selected: string[];
  onAdd: (skill: string) => void;
  placeholder: string;
  addLabel: string;
  inputClassName: string;
}

/** Searchable skill input. Keyboard: ↑ ↓ to move, Enter to add, Esc to close. Skills outside the list can still be added. */
export function SkillPicker({ suggestions, selected, onAdd, placeholder, addLabel, inputClassName }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const available = suggestions.filter((s) => !selected.includes(s) && s.toLowerCase().includes(q));
    // Names that start with the query are the likeliest choice
    return [...available.filter((s) => s.toLowerCase().startsWith(q)), ...available.filter((s) => !s.toLowerCase().startsWith(q))];
  }, [query, suggestions, selected]);
  const showList = open && matches.length > 0;

  useEffect(() => {
    if (showList && active >= 0) list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [showList, active]);

  const add = (raw: string) => {
    const typed = raw.trim();
    if (!typed) return;
    // Reuse the employer's spelling, because job matching compares exact names
    const known = suggestions.find((s) => s.toLowerCase() === typed.toLowerCase()) ?? typed;
    if (!selected.includes(known)) onAdd(known);
    setQuery("");
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const last = matches.length - 1;
      setActive((a) => (e.key === "ArrowDown" ? Math.min(last, a + 1) : Math.max(0, a - 1)));
    } else if (e.key === "Enter") {
      // Enter must add the skill, not submit the surrounding form
      e.preventDefault();
      add(showList && active >= 0 ? matches[active] : query);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <div className="flex gap-2" dir="ltr">
      <div className="relative flex-1">
        <input value={query} placeholder={placeholder} autoComplete="off" className={inputClassName} onKeyDown={onKeyDown}
          role="combobox" aria-label={placeholder} aria-autocomplete="list" aria-expanded={showList} aria-controls={id}
          aria-activedescendant={showList && active >= 0 ? `${id}-${active}` : undefined}
          onFocus={() => setOpen(true)} onBlur={() => { setOpen(false); setActive(-1); }}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(-1); }} />
        {showList && (
          <ul ref={list} id={id} role="listbox" className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-[0_12px_32px_-12px_rgb(15_23_42/0.25)]">
            {matches.map((skill, i) => (
              <li key={skill} id={`${id}-${i}`} data-i={i} role="option" aria-selected={i === active}
                // Keeps focus in the input, so the list stays usable after a click
                onMouseDown={(e) => e.preventDefault()} onClick={() => add(skill)} onMouseEnter={() => setActive(i)}
                className={`flex h-10 cursor-pointer items-center rounded-lg px-3 text-sm ${i === active ? "bg-surface-2" : ""}`}>{skill}</li>
            ))}
          </ul>
        )}
      </div>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(query)} className="h-11 shrink-0 rounded-lg border border-line px-4 text-sm font-semibold hover:border-primary">{addLabel}</button>
    </div>
  );
}
