const { salvarLancamento, listarLancamentos, deletarLancamento, editarLancamentos, importarLancamentos } = require('../services/financeiroService');

const salvar = async (req, res, next) => {
  try {
    const result = await salvarLancamento(req.user.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const listar = async (req, res, next) => {
  try {
    const rows = await listarLancamentos(req.user.id);
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
};

const deletar = async (req, res, next) => {
  try {
    const { id } = req.body;
    const result = await deletarLancamento(req.user.id, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const editar = async (req, res, next) => {
  try {
    const { updates } = req.body;
    const result = await editarLancamentos(req.user.id, updates);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const importar = async (req, res, next) => {
  try {
    const { lancamentos } = req.body;
    const result = await importarLancamentos(req.user.id, lancamentos);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { salvar, listar, deletar, editar, importar };
