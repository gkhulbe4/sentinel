import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  target: "node22",
  clean: true,
  // Bundle the internal TS workspace packages (they ship source, not built JS);
  // leave real npm deps (fastify, ioredis, …) external.
  noExternal: [/^@sentinel\//],
  // Prisma's runtime uses dynamic require() and loads a native query engine, so it
  // must NOT be bundled into the ESM output — keep it external and load it from
  // node_modules at runtime. (Reached transitively via @sentinel/db.)
  external: ["@prisma/client", ".prisma/client"],
});
