/** Height of the fixed bar, in rem — screens that mount it must reserve this. */
export const CHIRON_HEIGHT_REM = 2.25;

const CHIRON_TEXT =
  "High scores in these traits have been found to statistically increase a " +
  'person’s likelihood of committing crimes, cause social distress, and ' +
  'create severe problems for organizations, especially if found in people ' +
  'who are in leadership positions. People who score high on these traits ' +
  'also tend to be less compassionate, agreeable, empathetic, and satisfied ' +
  'with their lives, and less likely to believe they and others are good.';

/**
 * A fixed, cable-news-style ticker pinned to the very top of the viewport.
 * Being `fixed`, it never participates in a screen's own layout math — screens
 * that mount it just need to reserve `CHIRON_HEIGHT_REM` of top space.
 */
export function Chiron() {
  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex h-9 items-stretch overflow-hidden border-b border-blood/40 bg-void/95 backdrop-blur-sm"
      role="status"
    >
      <span className="sr-only">{CHIRON_TEXT}</span>

      <span className="flex shrink-0 items-center bg-blood px-3 font-display text-xs font-bold uppercase tracking-wider text-bone">
        Alert
      </span>

      <div className="relative flex-1 overflow-hidden" aria-hidden="true">
        <div className="dtom-ticker absolute inset-y-0 flex w-max items-center whitespace-nowrap text-xs text-ash">
          <span className="px-8">{CHIRON_TEXT}</span>
          <span className="px-8">{CHIRON_TEXT}</span>
        </div>
      </div>
    </div>
  );
}
