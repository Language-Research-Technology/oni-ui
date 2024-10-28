module.exports = {
  future: {},
  mode: 'jit',
  purge: ['./src/**/*.html', './src/**/*.{js,jsx,ts,tsx,vue}'],
  theme: {
    extend: {},
  },
  variants: {},
  plugins: [require('@tailwindcss/line-clamp')],
};
