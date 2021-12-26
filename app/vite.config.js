import { defineConfig } from "vite"

export default defineConfig({
    server: {
        proxy: {
            "/map": {
                target: "http://localhost:8080",
                ws: true
            },
        }
    }
})
