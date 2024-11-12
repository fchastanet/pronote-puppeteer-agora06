import express from 'express'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()
const publicDir = path.join(process.cwd(), process.env.PUBLIC_DIR)
const port = process.env?.ASSETS_PORT ?? 3000
const app = express()
app.use(express.static(publicDir))

app.listen(port, '0.0.0.0', () => {
  console.log(`WebServer running at http://127.0.0.1:${port}/`)
})
