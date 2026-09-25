module.exports = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Geist via the `geist` package (see app/layout.tsx); Tailwind's
      // stock slate/emerald/amber/rose palette already matches the
      // Stitch-generated design system's hex values, so no custom
      // color tokens are needed here.
      fontFamily: { sans: ['var(--font-geist-sans)', 'sans-serif'] },
    },
  },
  plugins: [],
};
