import * as path from "node:path";
import express from "express";
import * as process from "process";

export default class HttpServer {
  #port
  #staticPath
  
  constructor(port = 3000, staticPath = "./public") {
    this.#port = port;
    this.#staticPath = path.join(process.cwd(), staticPath);
    
    this.toBool = [() => true, () => false];
  }

  start() {
    const app = express();

    // Serve static files from the current directory
    app.use(express.static(this.#staticPath));

    // Serve index.html
    app.get('/', (req, res) => {
      res.sendFile(path.join(this.#staticPath, 'index.html'));
    });

    // Serve metrics.json
    app.get('/metrics.json', (req, res) => {
      res.sendFile(path.join(this.#staticPath, 'metrics.json'));
    });

    app.listen(this.#port, '0.0.0.0', () => {
      console.log(`Server running at http://127.0.0.1:${this.#port}/`);
    });
  }
}
