/**
 * Trek Together mark: nested contour rings (elevation) with a blaze-orange trail
 * threading across and a start node — the whole product in a glyph. Colors come
 * from tokens so it recolors with the theme.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      role="img"
      aria-label="Trek Together"
    >
      <title>Trek Together</title>
      {/* Contour rings */}
      <path
        d="M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6Z"
        className="stroke-primary/35"
        strokeWidth="1.4"
      />
      <path
        d="M12 6.6a5.4 5.4 0 1 0 0 10.8 5.4 5.4 0 0 0 0-10.8Z"
        className="stroke-primary/60"
        strokeWidth="1.4"
      />
      {/* Trail across the terrain */}
      <path
        d="M4.5 15.5c2.4.2 3.1-2.3 5-2.6 2.2-.34 2.8 2.1 5 1.6 1.9-.44 2.3-3.1 4.8-3"
        className="stroke-trail"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Start node */}
      <circle cx="4.5" cy="15.5" r="1.7" className="fill-trail" />
    </svg>
  );
}
