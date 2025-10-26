// Use explicit requires so Turbopack/PostCSS picks up the correct plugin
// implementation (some environments expect the @tailwindcss/postcss adapter).
module.exports = {
  plugins: [
    // prefer the official PostCSS adapter if available
  // Use the Tailwind package directly as the PostCSS plugin here. If you see
  // a runtime warning asking for `@tailwindcss/postcss`, we can switch back
  // to the adapter, but that may require platform native bindings for
  // `lightningcss` on Windows. Using `tailwindcss` directly avoids that.
  require('tailwindcss'),
    require('autoprefixer'),
  ],
}
