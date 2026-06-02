const desafioService = require('../services/desafioService');

const criar = async (req, res, next) => {
  try {
    const result = await desafioService.criarDesafio(req.user.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const listar = async (req, res, next) => {
  try {
    const result = await desafioService.listarDesafios(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const atualizar = async (req, res, next) => {
  try {
    const result = await desafioService.atualizarDesafio(req.params.id, req.user.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const deletar = async (req, res, next) => {
  try {
    const result = await desafioService.deletarDesafio(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const verificar = async (req, res, next) => {
  try {
    const result = await desafioService.verificarDesafios(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { criar, listar, atualizar, deletar, verificar };
