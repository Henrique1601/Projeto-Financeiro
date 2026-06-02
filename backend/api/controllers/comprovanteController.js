const comprovanteService = require('../services/comprovanteService');

const signature = async (req, res, next) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) return res.status(501).json({ error: 'Cloudinary não configurado.' });
    const { public_id } = req.body;
    if (!public_id) return res.status(400).json({ error: 'public_id é obrigatório.' });
    const result = comprovanteService.gerarSignature(public_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const criar = async (req, res, next) => {
  try {
    const result = await comprovanteService.criarComprovante(req.user.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const listar = async (req, res, next) => {
  try {
    const result = await comprovanteService.listarComprovantes(req.params.lancamento_id, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const deletar = async (req, res, next) => {
  try {
    const result = await comprovanteService.deletarComprovante(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { signature, criar, listar, deletar };