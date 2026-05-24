const recorrenteService = require('../services/recorrenteService');

const criar = async (req, res, next) => {
  try {
    const result = await recorrenteService.criarRecorrente(req.user.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const listar = async (req, res, next) => {
  try {
    const result = await recorrenteService.listarRecorrentes(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const atualizar = async (req, res, next) => {
  try {
    const result = await recorrenteService.atualizarRecorrente(req.params.id, req.user.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const deletar = async (req, res, next) => {
  try {
    const result = await recorrenteService.deletarRecorrente(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const gerar = async (req, res, next) => {
  try {
    const result = await recorrenteService.gerarLancamentos(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { criar, listar, atualizar, deletar, gerar };
