import { defineConfig } from 'vite'
import react from '@vitejs/react-refresh' // or whatever your framework plugin is

export default defineConfig({
  base: '/Demo_CleanEmptyCompose/', // Add this exact line with your repo name!
  plugins: [react()],
})
