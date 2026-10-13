"use client";

import type { HTMLInputTypeAttribute, ReactNode } from "react";
import type { NdaFormData, Party } from "@/lib/nda/form";

type Props = {
  data: NdaFormData;
  onChange: (data: NdaFormData) => void;
};

const inputClass =
  "mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none";

function Hint({ children }: { children: ReactNode }) {
  return <span className="block text-xs font-normal text-zinc-500">{children}</span>;
}

function TextField({ label, hint, value, onChange, rows, type = "text", autoComplete }: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  /** Renders a multi-line textarea with this many rows. */
  rows?: number;
  type?: HTMLInputTypeAttribute;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-800">
      {label}
      {hint && <Hint>{hint}</Hint>}
      {rows ? (
        <textarea className={inputClass} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          className={inputClass}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

function Section({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
      <legend className="px-1 text-sm font-semibold text-zinc-900">{legend}</legend>
      {children}
    </fieldset>
  );
}

function ChoiceGroup({ legend, hint, children }: { legend: string; hint: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-2 text-sm">
      <legend className="font-medium text-zinc-800">
        {legend}
        <Hint>{hint}</Hint>
      </legend>
      {children}
    </fieldset>
  );
}

/** A radio button, optionally followed by extra controls (e.g. a year count) for that option. */
function RadioOption({ name, label, checked, onSelect, children }: {
  name: string;
  label: string;
  checked: boolean;
  onSelect: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2">
        <input type="radio" name={name} checked={checked} onChange={onSelect} />
        {label}
      </label>
      {children}
    </div>
  );
}

function YearsInput({ label, value, disabled, onChange }: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <input
        type="number"
        min={1}
        step={1}
        inputMode="numeric"
        aria-label={label}
        className="w-16 rounded-md border border-zinc-300 px-2 py-1 text-sm disabled:bg-zinc-100 disabled:text-zinc-400"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className={disabled ? "text-zinc-400" : undefined}>year(s) from Effective Date</span>
    </>
  );
}

export function NdaForm({ data, onChange }: Props) {
  const set = <K extends keyof NdaFormData>(key: K, value: NdaFormData[K]) => onChange({ ...data, [key]: value });

  const setParty = (index: 0 | 1, key: keyof Party, value: string) => {
    const parties: [Party, Party] = [...data.parties];
    parties[index] = { ...parties[index], [key]: value };
    set("parties", parties);
  };

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <Section legend="Agreement terms">
        <TextField
          label="Purpose"
          hint="How Confidential Information may be used"
          rows={3}
          value={data.purpose}
          onChange={(v) => set("purpose", v)}
        />

        <TextField
          label="Effective Date"
          type="date"
          value={data.effectiveDate}
          onChange={(v) => set("effectiveDate", v)}
        />

        <ChoiceGroup legend="MNDA Term" hint="The length of this MNDA">
          <RadioOption
            name="mndaTermType"
            label="Expires after"
            checked={data.mndaTermType === "expires"}
            onSelect={() => set("mndaTermType", "expires")}
          >
            <YearsInput
              label="MNDA term in years"
              value={data.mndaTermYears}
              disabled={data.mndaTermType !== "expires"}
              onChange={(v) => set("mndaTermYears", v)}
            />
          </RadioOption>
          <RadioOption
            name="mndaTermType"
            label="Continues until terminated"
            checked={data.mndaTermType === "untilTerminated"}
            onSelect={() => set("mndaTermType", "untilTerminated")}
          />
        </ChoiceGroup>

        <ChoiceGroup legend="Term of Confidentiality" hint="How long Confidential Information is protected">
          <RadioOption
            name="confidentialityTermType"
            label="For"
            checked={data.confidentialityTermType === "years"}
            onSelect={() => set("confidentialityTermType", "years")}
          >
            <YearsInput
              label="Confidentiality term in years"
              value={data.confidentialityTermYears}
              disabled={data.confidentialityTermType !== "years"}
              onChange={(v) => set("confidentialityTermYears", v)}
            />
          </RadioOption>
          <RadioOption
            name="confidentialityTermType"
            label="In perpetuity"
            checked={data.confidentialityTermType === "perpetual"}
            onSelect={() => set("confidentialityTermType", "perpetual")}
          />
        </ChoiceGroup>

        <TextField
          label="Governing Law"
          hint="State whose laws govern the MNDA, e.g. Delaware"
          value={data.governingLaw}
          onChange={(v) => set("governingLaw", v)}
        />

        <TextField
          label="Jurisdiction"
          hint="City or county and state whose courts hear disputes, e.g. New Castle, DE"
          value={data.jurisdiction}
          onChange={(v) => set("jurisdiction", v)}
        />

        <TextField
          label="MNDA Modifications"
          hint="Optional changes to the Standard Terms"
          rows={2}
          value={data.modifications}
          onChange={(v) => set("modifications", v)}
        />
      </Section>

      {([0, 1] as const).map((index) => {
        const party = data.parties[index];
        return (
          <Section key={index} legend={`Party ${index + 1}`}>
            <TextField
              label="Company"
              autoComplete="organization"
              value={party.company}
              onChange={(v) => setParty(index, "company", v)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Signatory name"
                autoComplete="name"
                value={party.name}
                onChange={(v) => setParty(index, "name", v)}
              />
              <TextField
                label="Title"
                autoComplete="organization-title"
                value={party.title}
                onChange={(v) => setParty(index, "title", v)}
              />
            </div>
            <TextField
              label="Notice address"
              hint="Email or postal address"
              value={party.noticeAddress}
              onChange={(v) => setParty(index, "noticeAddress", v)}
            />
          </Section>
        );
      })}
    </form>
  );
}
