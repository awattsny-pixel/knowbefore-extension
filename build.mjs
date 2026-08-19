import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const options = {
  entryPoints: [
    "src/content/index.ts",
    "src/background/serviceWorker.ts",
    "src/popup/popup.tsx",
  ],
  bundle: true,
  outdir: "dist",
  outbase: "src",
  format: "esm",
  target: "chrome110",
  sourcemap: true,
  minify: !watch,
  logLevel: "info",
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("watching for changes…");
} else {
  await esbuild.build(options);
}
