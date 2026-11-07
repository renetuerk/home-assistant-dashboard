import { z } from "zod";
import { MAX_LOG_LINES } from "./activity-log";

export const summaryInputSchema = z.object({
  log: z.array(z.string().max(200)).max(MAX_LOG_LINES),
  hours: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12), z.literal(24)]),
});