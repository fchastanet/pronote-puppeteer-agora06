import path from 'path';
import fs from 'fs';

export default class IndexController {
  #staticPath
  #timestamp

  constructor(staticPath) {
    this.#staticPath = staticPath
    this.#timestamp = Date.now()
  }
 
  // Serve index.html with timestamp replacement
  async index(req, res) {
    const indexPath = path.join(this.#staticPath, 'index.html')
    console.log('access request:', 'index.html')
    fs.readFile(indexPath, 'utf8', (err, data) => {
      if (err) {
        res.status(500).send('Error reading index.html')
        return
      }
      const updatedData = data.replace(/@timestamp@/g, this.#timestamp)
      res.send(updatedData)
    })
  }
}