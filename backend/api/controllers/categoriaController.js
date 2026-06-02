const categoriaService = require('../services/categoriaService');

const listar = async (req, res) => {
  try {
    const categorias = await categoriaService.listarCategorias(req.user.id);
    res.json(categorias);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const criar = async (req, res) => {
  try {
    const categoria = await categoriaService.criarCategoria(req.user.id, req.body);
    res.status(201).json(categoria);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const atualizar = async (req, res) => {
  try {
    const result = await categoriaService.atualizarCategoria(req.params.id, req.user.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deletar = async (req, res) => {
  try {
    const result = await categoriaService.deletarCategoria(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

const reordenar = async (req, res) => {
  try {
    const result = await categoriaService.reordenarCategorias(req.user.id, req.body.order);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { listar, criar, atualizar, deletar, reordenar };
