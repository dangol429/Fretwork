import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Vite's default 5173 sits inside a Hyper-V reserved TCP range on this
    // machine (5173-5272) and fails to bind with EACCES. 5320 is outside every
    // reserved range and clear of the other dev servers running locally.
    port: 5320,
  },
});
