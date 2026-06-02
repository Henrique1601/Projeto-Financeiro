const compartilharService = require('../services/compartilharService');

exports.criar = async (req, res, next) => {
  try {
    const result = await compartilharService.criarCompartilhar(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.buscar = async (req, res, next) => {
  try {
    const dados = await compartilharService.buscarCompartilhar(req.params.token);
    res.json(dados);
  } catch (err) {
    next(err);
  }
};

exports.listar = async (req, res, next) => {
  try {
    const lista = await compartilharService.listarCompartilhados(req.user.id);
    res.json(lista);
  } catch (err) {
    next(err);
  }
};

exports.deletar = async (req, res, next) => {
  try {
    await compartilharService.deletarCompartilhar(req.params.token, req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
