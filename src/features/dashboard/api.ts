import { rpc } from "../../lib/api";
import type { PageResult } from "../../domain/contracts";
export type Metrics = {
  students: number;
  classes: number;
  enrollments: number;
  completed: number;
};
export type Activity = {
  id: number;
  action: string;
  entity_id: string;
  created_at: string;
  display_name: string;
};
export const dashboardApi = {
  metrics: () => rpc<Metrics>("get_dashboard"),
  activity: () =>
    rpc<PageResult<Activity>>("get_recent_activity", { pageSize: 5 }),
};
