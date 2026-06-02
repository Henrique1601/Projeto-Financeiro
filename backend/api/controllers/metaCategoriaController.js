const metaCategoriaService = require('../services/metaCategoriaService');

const criar = async (req, res) => {
  try {
    const meta = await metaCategoriaService.criarMeta(req.user.id, req.body);
    res.status(201).json(meta);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const listar = async (req, res) => {
  try {
    const metas = await metaCategoriaService.listarMetas(req.user.id, req.query.mes);
    res.json(metas);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const atualizar = async (req, res) => {
  try {
    const result = await metaCategoriaService.atualizarMeta(req.params.id, req.user.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deletar = async (req, res) => {
  try {
    const result = await metaCategoriaService.deletarMeta(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { criar, listar, atualizar, deletar };
