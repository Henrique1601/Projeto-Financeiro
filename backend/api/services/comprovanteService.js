const { pool } = require('../config/database');
const { run, getAll, getOne } = require('../utils/queryHelpers');

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

function gerarSignature(publicId) {
  const timestamp = Math.round(Date.now() / 1000);
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
  });
  const signature = cloudinary.utils.api_sign_request(
    { public_id: publicId, timestamp },
    API_SECRET
  );
  return { signature, timestamp, api_key: API_KEY, cloud_name: CLOUD_NAME };
}

const criarComprovante = async (userId, data) => {
  const { lancamento_id, url, public_id, nome_arquivo } = data;
  if (!lancamento_id || !url || !public_id) throw new Error('lancamento_id, url e public_id são obrigatórios.');
  const result = await pool.query(
    `INSERT INTO comprovantes (lancamento_id, user_id, url, public_id, nome_arquivo)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [lancamento_id, userId, url, public_id, nome_arquivo || null]
  );
  return result.rows[0];
};

const listarComprovantes = async (lancamentoId, userId) => {
  return getAll(
    'SELECT * FROM comprovantes WHERE lancamento_id = $1 AND user_id = $2 ORDER BY created_at',
    [lancamentoId, userId]
  );
};

const deletarComprovante = async (id, userId) => {
  const comp = await getOne('SELECT * FROM comprovantes WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!comp) throw new Error('Comprovante não encontrado.');
  if (CLOUD_NAME && API_KEY && API_SECRET) {
    try {
      const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
      await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
        body: JSON.stringify({ public_id: comp.public_id }),
      });
    } catch (err) {
      console.error('Erro ao deletar do Cloudinary:', err.message);
    }
  }
  await run('DELETE FROM comprovantes WHERE id = $1', [id]);
  return { message: 'Comprovante removido.' };
};

module.exports = { gerarSignature, criarComprovante, listarComprovantes, deletarComprovante };