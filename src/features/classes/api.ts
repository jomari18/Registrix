import { rpc } from "../../lib/api";
import type { PageResult } from "../../domain/contracts";
import type { AcademicClass, Enrollment, Subject } from "../../domain/records";
export const classesApi = {
  list: (request: unknown) =>
    rpc<PageResult<AcademicClass>>("list_classes", request),
  get: (id: string) => rpc<AcademicClass>("get_class", { id }),
  catalog: (request: unknown) =>
    rpc<PageResult<Subject>>("list_catalog", request),
  roster: (request: unknown) =>
    rpc<PageResult<Enrollment>>("get_grade_sheet", request),
};
