const paths = {
  sliders: "M4 6h5m4 0h7M4 12h10m4 0h2M4 18h2m4 0h10M9 3v6m5 0v6M6 15v6",
  close: "m6 6 12 12M18 6 6 18",
  left: "M20 4H4v16h16zM10 4v16m6-12-3 4 3 4",
  right: "M20 4H4v16h16zM14 4v16M8 8l3 4-3 4",
  expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
  undo: "M9 4 4 9l5 5M4 9h10a6 6 0 0 1 0 12",
  redo: "m15 4 5 5-5 5m5-5H10a6 6 0 0 0 0 12",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  upload: "M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5",
  compare: "M12 3v18M3 6h6v12H3zm12 0h6v12h-6z",
  code: "m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18",
  external: "M14 3h7v7m0-7L10 14m-1-9H3v16h16v-6",
} as const;

export function Icon({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
