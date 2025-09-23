import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Required for GitHub Pages when the site is served from a subpath
  // https://vite.dev/guide/static-deploy.html#github-pages
  base: '/gradient_descent_visualiser/',
})
