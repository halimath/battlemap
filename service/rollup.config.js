import typescript from "rollup-plugin-typescript2"
import commonjs from "rollup-plugin-commonjs"
import run from "@rollup/plugin-run"

const dev = process.env.ROLLUP_WATCH === "true"

export default {
    input: "./index.ts",

    output: [
        {
            file: `dist/index.js`,
            format: "cjs",
            sourcemap: true
        },
    ],

    plugins: [
        typescript(),
        commonjs(),
        dev && run(),
    ]
}