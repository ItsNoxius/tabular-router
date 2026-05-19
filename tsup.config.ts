import { defineConfig } from "tsup";
import { solidPlugin } from "esbuild-plugin-solid";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    persist: "src/persist.ts",
    store: "src/store.ts",
    types: "src/types.ts",
  },
  format: ["esm"],
  target: "es2022",
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ["solid-js", "solid-js/store", "solid-js/web"],
  esbuildPlugins: [solidPlugin()],
});
