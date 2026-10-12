import type { GradeScores, GradeResult } from "./contracts";
export const periods = [
  "monthly",
  "firstPrelim",
  "secondPrelim",
  "midterm",
  "preFinal",
  "final",
] as const;
export const periodLabels = [
  "Monthly",
  "First prelim",
  "Second prelim",
  "Midterm",
  "Pre-final",
  "Final",
];
export function parseScore(value: string): number | null {
  const text = value.trim();
  if (!text) return null;
  if (!/^\d+(?:\.\d{1,2})?$/.test(text))
    throw Error("Enter a score from 0 to 100, with up to two decimal places.");
  const score = Number(text);
  if (!Number.isFinite(score) || score > 100)
    throw Error("Enter a score from 0 to 100.");
  return score;
}
export function computeGrade(scores: GradeScores): GradeResult {
  let sum = 0,
    complete = true;
  for (const key of periods) {
    const n = scores[key];
    if (n === null) {
      complete = false;
      continue;
    }
    if (
      typeof n !== "number" ||
      !Number.isFinite(n) ||
      n < 0 ||
      n > 100 ||
      Math.abs(n * 100 - Math.round(n * 100)) > 1e-8
    )
      throw Error("Invalid grade score.");
    sum += Math.round(n * 100);
  }
  if (!complete)
    return {
      status: "incomplete",
      generalAverage: null,
      classificationAverage: null,
      numericalEquivalent: null,
      remarks: null,
    };
  const cent = Math.floor((sum + 3) / 6),
    tenth = Math.floor((sum + 30) / 60);
  const thresholds: [number, string][] = [
    [965, "1.00"],
    [935, "1.25"],
    [905, "1.50"],
    [875, "1.75"],
    [845, "2.00"],
    [815, "2.25"],
    [785, "2.50"],
    [755, "2.75"],
    [745, "3.00"],
  ];
  const equivalent = thresholds.find(([min]) => tenth >= min)?.[1] ?? "5.00";
  return {
    status: "complete",
    generalAverage: (cent / 100).toFixed(2),
    classificationAverage: (tenth / 10).toFixed(1),
    numericalEquivalent: equivalent,
    remarks: equivalent === "5.00" ? "Failed" : "Passed",
  };
}
