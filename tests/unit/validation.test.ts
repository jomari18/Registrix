import { it, expect } from "vitest";
import {
  normalizeStudentNumber,
  validateStudent,
  validateClass,
  validateSubject,
} from "../../src/domain/validation";
it("normalizes numbers and accepts duplicate Unicode names with optional middle initial", () => {
  expect(normalizeStudentNumber(" demo-001 ")).toBe("DEMO-001");
  expect(
    validateStudent({
      student_no: "DEMO-001",
      surname: "Dela Cruz–Ñaña",
      first_name: "José María",
      middle_initial: "",
      gender: "other",
    }),
  ).toBeNull();
});
it("supports future consecutive academic years while rejecting invalid section/year", () => {
  const v = {
    course: "BSCS",
    year_level: 1,
    semester: "1st",
    section: "A",
    school_year: "2030-2031",
    subject_id: "20000000-0000-4000-8000-000000000001",
  };
  expect(validateClass(v)).toBeNull();
  for (const patch of [
    { school_year: "2030-2032" },
    { section: "Z" },
    { year_level: 5 },
  ])
    expect(validateClass({ ...v, ...patch })).toBeTruthy();
});
it("rejects unresolvable subject metadata or invalid units", () => {
  expect(
    validateSubject({
      code: "CC101",
      description: "Introduction to Computing",
      units: 3,
      course: "BSCS",
      year_level: 1,
      semester: "1st",
    }),
  ).toBeNull();
  expect(
    validateSubject({
      code: "CC101",
      description: "Intro",
      units: -1,
      course: "BSCS",
      year_level: 1,
      semester: "1st",
    }),
  ).toBeTruthy();
});
