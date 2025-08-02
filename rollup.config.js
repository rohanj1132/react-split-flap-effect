import typescript from "@rollup/plugin-typescript";
import svgr from "@svgr/rollup";
import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import external from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";
import url from "rollup-plugin-url";

import postcssPresetEnv from "postcss-preset-env";

import pkg from "./package.json" with { type: "json" };

export default {
  input: "src/index.ts",
  output: [
    {
      file: pkg.main,
      format: "cjs",
      sourcemap: true
    },
    {
      file: pkg.module,
      format: "es",
      sourcemap: true
    }
  ],
  plugins: [
    external(),
    postcss({
      modules: true,
      plugins: [
        postcssPresetEnv({
          features: {
            "nesting-rules": true
          }
        })
      ]
    }),
    url(),
    svgr(),
    resolve({
      extensions: [".js", ".jsx", ".ts", ".tsx"]
    }),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationDir: "dist",
      exclude: ["**/*.test.tsx", "**/*.test.ts", "src/setupTests.ts"]
    }),
    babel({
      exclude: "node_modules/**",
      extensions: [".js", ".jsx"],
      presets: ["@babel/preset-react"]
    }),
    commonjs()
  ]
};
