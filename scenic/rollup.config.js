import typescript from "rollup-plugin-typescript2"
import commonjs from "rollup-plugin-commonjs"

import { name } from "./package.json"

export default {
    input: "./index.ts",

    output: [
        {
            file: `dist/index.esm.js`,
            name: name,
            format: "esm",
            sourcemap: true
        },
        {
            file: `dist/index.js`,
            format: "cjs",
            sourcemap: true
        },
    ],

    plugins: [
        typescript(),
        commonjs(),
    ]
}