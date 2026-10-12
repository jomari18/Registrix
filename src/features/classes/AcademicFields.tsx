import { SelectField } from "../../components/SelectField";
import { courses } from "../../domain/validation";
export function AcademicFields({
  course,
  year,
  semester,
  onChange,
  includeAll = false,
}: {
  course: string;
  year: string;
  semester: string;
  onChange: (key: string, value: string) => void;
  includeAll?: boolean;
}) {
  return (
    <>
      <SelectField
        label="Course"
        value={course}
        onChange={(e) => onChange("course", e.target.value)}
      >
        {includeAll && <option value="">All courses</option>}
        {courses.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </SelectField>
      <SelectField
        label="Year level"
        value={year}
        onChange={(e) => onChange("year_level", e.target.value)}
      >
        {includeAll && <option value="">All years</option>}
        {[1, 2, 3, 4].map((y) => (
          <option key={y} value={y}>
            Year {y}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Semester"
        value={semester}
        onChange={(e) => onChange("semester", e.target.value)}
      >
        {includeAll && <option value="">All semesters</option>}
        <option value="1st">First semester</option>
        <option value="2nd">Second semester</option>
        <option value="summer">Summer</option>
      </SelectField>
    </>
  );
}
