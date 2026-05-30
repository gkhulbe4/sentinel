import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  target: "node22",
  clean: true,
  // Bundle the internal TS workspace packages (they ship source, not built JS);
  // leave real npm deps (fastify, ioredis, @prisma/client, …) external.
  noExternal: [/^@sentinel\//],
});
