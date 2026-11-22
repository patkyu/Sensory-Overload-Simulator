/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Height-based breakpoints so the scene screen fits on one screen without scrolling.
      screens: {
        // Scene left / panel right when the screen is wider than it is tall (desktop, landscape phone/tablet).
        side: { raw: '(min-width: 640px) and (min-aspect-ratio: 5/4)' },
        // Listed after `side` so these height rules win when both match.
        short: { raw: '(max-height: 800px)' },
        tiny: { raw: '(max-height: 500px)' },
      },
      colors: {
        ink: '#14213d',      // body text, 15:1 on paper
        paper: '#fbf7ef',    // page background
        calm: '#2a6f63',     // primary buttons (white text 6:1)
        stop: '#b3261e',     // stop button (white text 6.5:1)
        muted: '#4a5468',    // secondary text (7:1 on paper)
      },
      minHeight: { tap: '48px' },
      minWidth: { tap: '48px' },
    },
  },
  plugins: [],
};
