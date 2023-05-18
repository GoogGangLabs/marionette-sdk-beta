import typescript from "rollup-plugin-typescript2";
import { uglify } from "rollup-plugin-uglify";
import nodePolyfills from "rollup-plugin-polyfill-node";
import nodeResolver from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

export default [
  {
    input: "./src/index.ts",
    output: [
      {
        file: "./lib/index.cjs",
        format: "cjs",
      },
      {
        file: "./lib/index.mjs",
        format: "esm",
      },
    ],
    plugins: [
      typescript({
        clean: true,
        useTsconfigDeclarationDir: true,
      }),
      uglify(),
      nodePolyfills(),
    ],
  },
  {
    input: "./src/iife.ts",
    output: {
      file: "./lib/index.min.js",
      format: "iife",
      name: "MarionetteClient",
    },
    plugins: [
      typescript({
        clean: true,
        useTsconfigDeclarationDir: true,
      }),
      uglify(),
      nodeResolver(),
      commonjs(),
      nodePolyfills(),
      terser(),
    ],
  },
];
