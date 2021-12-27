import { defineConfig } from "vite"

export default defineConfig({
    server: {
        proxy: {
            "/edit": {
                target: "http://localhost:8080",
                ws: true
            },
            "/view": {
                target: "http://localhost:8080",
                ws: true
            },
        }
    }
})
