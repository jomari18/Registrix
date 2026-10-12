import { rpc } from "../../lib/api";
import type { PageResult } from "../../domain/contracts";
import type { Staff } from "../../domain/records";
export const accountsApi = {
  list: (request: unknown) => rpc<PageResult<Staff>>("list_staff", request),
};
