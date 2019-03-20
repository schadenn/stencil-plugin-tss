import pkg from "./package.json";
import copy from 'rollup-plugin-copy';

export default {
  input: "dist/index.js",

  external: ["path"],
  plugins: [
      copy({
        "src/rewriteStencil.js": "dist/rewriteStencil.js",
        "src/styled.ts": "dist/styled.ts"
      })
  ],

  output: [
    {
      format: "cjs",
      file: pkg.main
    },
    {
      format: "es",
      file: pkg.module
    }
  ]
};
