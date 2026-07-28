import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  publicDir: "public",
  worker: {
    format: "es",
  },
  build: {
    outDir: "site",
    emptyOutDir: true,
    target: "es2022",
    rollupOptions: {
      input: {
        app: resolve(import.meta.dirname, "app.html"),
      },
      output: {
        manualChunks: {
          transformers: ["@huggingface/transformers"],
          diarization: ["diarization-js", "onnxruntime-web"],
          docx: ["docx"],
        },
      },
    },
  },
});
