import { z } from 'zod';
import roster from './officials.yaml';

/**
 * Optional: Digital Ground Game is canvassing for this official's opponent.
 * Presence of the block means "yes"; both sub-fields are required when present.
 */
const DggCanvassSchema = z.object({
  eventName: z.string().min(1),
  signupUrl: z.string().url(),
});

const OfficialSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  position: z.string().min(1),
  photo: z.string().min(1),
  source: z.string().optional(),
  license: z.string().optional(),
  dggCanvass: DggCanvassSchema.optional(),
});

export type Official = z.infer<typeof OfficialSchema>;

const parsed = z.array(OfficialSchema).min(1).safeParse(roster);

if (!parsed.success) {
  // Fail loudly at startup rather than rendering a broken board.
  console.error(parsed.error.format());
  throw new Error('officials.yaml failed validation — see console for details');
}

const ids = new Set<string>();
for (const o of parsed.data) {
  if (ids.has(o.id)) throw new Error(`officials.yaml: duplicate id "${o.id}"`);
  ids.add(o.id);
}

export const OFFICIALS: readonly Official[] = parsed.data;

export const OFFICIALS_BY_ID: ReadonlyMap<string, Official> = new Map(
  OFFICIALS.map((o) => [o.id, o]),
);

/** Resolve a roster photo path to a URL served from /public. */
export function photoUrl(photo: string): string {
  return `${import.meta.env.BASE_URL}${photo}`.replace(/([^:])\/\//g, '$1/');
}
