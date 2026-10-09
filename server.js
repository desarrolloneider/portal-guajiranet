// Passenger (cPanel) necesita un archivo .js como punto de arranque, no un
// comando como "next start". Este archivo levanta Next.js de forma
// programática y lo deja escuchando en el puerto que Passenger le indique.
const { createServer } = require('http');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const manejar = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  createServer((req, res) => manejar(req, res)).listen(PORT, () => {
    console.log('Next.js listo en el puerto ' + PORT);
  });
});
