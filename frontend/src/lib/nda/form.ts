export type Party = {
  name: string;
  title: string;
  company: string;
  noticeAddress: string;
};

export type NdaFormData = {
  purpose: string;
  /** ISO date (YYYY-MM-DD), as produced by `<input type="date">`. */
  effectiveDate: string;
  mndaTermType: "expires" | "untilTerminated";
  /** Kept as the raw input string so the field can be edited freely. */
  mndaTermYears: string;
  confidentialityTermType: "years" | "perpetual";
  confidentialityTermYears: string;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  parties: [Party, Party];
};

const emptyParty: Party = { name: "", title: "", company: "", noticeAddress: "" };

/** Defaults mirror the pre-filled values in the Common Paper cover page. */
export const defaultNdaFormData: NdaFormData = {
  purpose: "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: "",
  mndaTermType: "expires",
  mndaTermYears: "1",
  confidentialityTermType: "years",
  confidentialityTermYears: "1",
  governingLaw: "",
  jurisdiction: "",
  modifications: "",
  parties: [{ ...emptyParty }, { ...emptyParty }],
};

/** Today's date in the user's local time zone, as YYYY-MM-DD. */
export function todayIsoDate(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
