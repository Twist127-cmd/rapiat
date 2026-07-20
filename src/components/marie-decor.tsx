/**
 * Decorative beach layer for the "Mode Marie" theme. Rendered once at the app
 * root; CSS hides it entirely outside the Marie theme and disables its motion
 * under `prefers-reduced-motion`. Purely ornamental — `aria-hidden` and
 * non-interactive so it never interferes with the UI or screen readers.
 */
export function MarieDecor() {
  return (
    <div className="marie-decor" aria-hidden="true">
      <span className="marie-sun" />
      <span className="marie-fish marie-fish--1">🐠</span>
      <span className="marie-fish marie-fish--2">🐟</span>
      <span className="marie-whale">🐳</span>
      <span className="marie-palm">🌴</span>
      <div className="marie-waves" />
    </div>
  );
}
