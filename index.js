require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(express.static(path.join(__dirname)));

// Rota explícita para a raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const result = await cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
      if (error) return res.status(500).json({ error: error.message });
      res.json({ url: result.secure_url });
    });
    result.end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  try {
    // Aguarda um pequeno intervalo para garantir que o servidor esteja pronto
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Importa o módulo 'open' dinamicamente
    const { default: open } = await import('open');
    // Abre o navegador com a URL do servidor
    await open(`http://localhost:${PORT}`);
    console.log('Navegador aberto automaticamente!');
    console.log('Pressione Ctrl+C para encerrar o servidor');
  } catch (error) {
    console.error('Erro ao abrir o navegador:', error.message);
  }
});

// Tratamento para erro de porta já em uso
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\u001b[31mA porta ${PORT} já está em uso.\u001b[0m`);
    console.error('Encerre o processo que está usando a porta ou escolha outra porta no arquivo .env.');
    process.exit(1);
  } else {
    console.error('Erro ao iniciar o servidor:', err);
    process.exit(1);
  }
});

// Tratamento para manter o processo em execução
process.stdin.resume();

// Tratamento adequado para sinais de encerramento
process.on('SIGINT', () => {
  console.log('\nServidor encerrado pelo usuário');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nServidor encerrado');
  server.close(() => {
    process.exit(0);
  });
});

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  console.error('Erro não tratado:', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promessa rejeitada não tratada:', reason);
  server.close(() => {
    process.exit(1);
  });
});
