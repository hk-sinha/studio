"use client";
import { useEffect, useState } from "react";
import { Reorder, useDragControls } from "motion/react";
import { DEFAULT_ABOUT, fetchAboutSettings, saveAboutSettings, type CertificationItem, type EducationItem } from "@/lib/data";
import { btn } from "@/components/ui/button";
import { CircleNotch, DotsSixVertical, Plus, Trash } from "@/components/ui/icons";
import { ConfirmButton, errorText, iconBtn, useToast } from "./ui";

// Rows need stable keys while being reordered and edited; strip them before saving.
type Row<T> = T & { key: string };
let n = 0;
const withKey = <T,>(item: T): Row<T> => ({ ...item, key: `r${++n}` });
const strip = <T extends object>({ key: _k, ...rest }: Row<T>) => rest as unknown as T;

interface Col { name: string; label: string; placeholder: string; width: string }

const EDU_COLS: Col[] = [
  { name: "period", label: "Period", placeholder: "2022 - present", width: "md:w-40" },
  { name: "title", label: "Qualification", placeholder: "Bachelor of Computer Applications", width: "md:flex-1" },
  { name: "place", label: "Institution", placeholder: "Career Point University", width: "md:w-64" },
];
const CERT_COLS: Col[] = [
  { name: "year", label: "Year", placeholder: "2024", width: "md:w-28" },
  { name: "title", label: "Certification", placeholder: "Introduction to Generative AI Studio", width: "md:flex-1" },
  { name: "issuer", label: "Issuer", placeholder: "Simplilearn", width: "md:w-56" },
];

/** Education and certifications shown on the About page. */
export function EducationTab() {
  const notify = useToast();
  const [edu, setEdu] = useState<Row<EducationItem>[]>([]);
  const [certs, setCerts] = useState<Row<CertificationItem>[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAboutSettings()
      .catch((e) => {
        notify(errorText(e), "error");
        return DEFAULT_ABOUT;
      })
      .then((a) => {
        setEdu(a.education.map(withKey));
        setCerts(a.certifications.map(withKey));
      })
      .finally(() => setLoading(false));
  }, [notify]);

  const touch = () => { setDirty(true); setError(""); };

  async function save() {
    // A row without a title would vanish on load, so ask for it instead.
    if ([...edu, ...certs].some((r) => !r.title.trim())) return setError("Every row needs a qualification or certification name. Fill it in or remove the row.");
    setBusy(true);
    try {
      await saveAboutSettings({
        education: edu.map((r) => strip(r)).map((e) => ({ period: e.period.trim(), title: e.title.trim(), place: e.place.trim() })),
        certifications: certs.map((r) => strip(r)).map((c) => ({ year: c.year.trim(), title: c.title.trim(), issuer: c.issuer.trim() })),
      });
      setDirty(false);
      notify("Education saved. The About page updates on the next load.");
    } catch (e) {
      notify(errorText(e), "error");
    }
    setBusy(false);
  }

  if (loading) return <div className="flex flex-col gap-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton h-14 rounded-btn" />)}</div>;

  return (
    <div className="flex flex-col gap-12">
      <div>
        <h1 className="display text-[clamp(36px,4.6vw,56px)]">Education</h1>
        <p className="mt-3 max-w-[64ch] text-muted">Shown on the About page under Education &amp; training, in this order. Drag rows by the handle to reorder.</p>
      </div>

      <Section<EducationItem>
        title="Education"
        cols={EDU_COLS}
        rows={edu}
        setRows={(r) => { setEdu(r); touch(); }}
        blank={{ period: "", title: "", place: "" }}
        addLabel="Add education"
      />
      <Section<CertificationItem>
        title="Certifications"
        cols={CERT_COLS}
        rows={certs}
        setRows={(r) => { setCerts(r); touch(); }}
        blank={{ year: "", title: "", issuer: "" }}
        addLabel="Add certification"
      />

      <div className="sticky bottom-4 flex flex-wrap items-center gap-4 rounded-card border border-line-strong bg-ink-900/95 p-4 backdrop-blur">
        <button onClick={save} disabled={busy || !dirty} className={btn("primary")}>
          {busy ? <>Saving <CircleNotch weight="light" size={18} className="animate-spin" /></> : "Save education"}
        </button>
        <span className={`text-sm ${error ? "text-[#FF8A8E]" : "text-muted"}`}>{error || (dirty ? "Unsaved changes" : "All changes saved")}</span>
      </div>
    </div>
  );
}

function Section<T extends object>({ title, cols, rows, setRows, blank, addLabel }: {
  title: string;
  cols: Col[];
  rows: Row<T>[];
  setRows: (r: Row<T>[]) => void;
  blank: T;
  addLabel: string;
}) {
  const edit = (key: string, name: string, value: string) => setRows(rows.map((r) => (r.key === key ? { ...r, [name]: value } : r)));
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-medium text-muted">{title} ({rows.length})</h2>
      {rows.length === 0 ? (
        <p className="rounded-card border border-dashed border-line-strong p-6 text-sm text-muted">No {title.toLowerCase()} yet. The section is hidden on the About page while empty.</p>
      ) : (
        <Reorder.Group axis="y" values={rows} onReorder={setRows} className="flex flex-col gap-2">
          {rows.map((r) => <RowItem key={r.key} row={r} cols={cols} onEdit={edit} onRemove={() => setRows(rows.filter((x) => x.key !== r.key))} />)}
        </Reorder.Group>
      )}
      <button onClick={() => setRows([...rows, withKey(blank)])} className={btn("ghost", "sm", "self-start")}>
        <Plus weight="light" size={16} /> {addLabel}
      </button>
    </section>
  );
}

function RowItem<T extends object>({ row, cols, onEdit, onRemove }: { row: Row<T>; cols: Col[]; onEdit: (key: string, name: string, value: string) => void; onRemove: () => void }) {
  const controls = useDragControls();
  const values = row as unknown as Record<string, string>;
  return (
    <Reorder.Item value={row} dragListener={false} dragControls={controls} className="flex items-start gap-2 rounded-btn border border-line bg-ink-900 p-2" whileDrag={{ scale: 1.01 }}>
      <button onPointerDown={(e) => controls.start(e)} aria-label="Drag to reorder" className="mt-[22px] grid size-9 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted hover:text-fg active:cursor-grabbing">
        <DotsSixVertical weight="light" size={20} />
      </button>
      <div className="flex flex-1 flex-col gap-2 md:flex-row">
        {cols.map((c) => (
          <label key={c.name} className={`flex flex-col gap-1 ${c.width}`}>
            <span className="text-[12px] text-muted">{c.label}</span>
            <input value={values[c.name] ?? ""} placeholder={c.placeholder} onChange={(e) => onEdit(row.key, c.name, e.target.value)} className="field-input py-2 text-sm" maxLength={120} />
          </label>
        ))}
      </div>
      <ConfirmButton onConfirm={onRemove} ariaLabel="Remove row" armedLabel="Remove?" className={`${iconBtn} mt-[22px] shrink-0`}>
        <Trash weight="light" size={16} />
      </ConfirmButton>
    </Reorder.Item>
  );
}
