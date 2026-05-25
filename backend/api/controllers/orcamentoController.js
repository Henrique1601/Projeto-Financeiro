const orcamentoService = require('../services/orcamentoService');

const criar = async (req, res) => {
  try {
    const orcamento = await orcamentoService.criarOrcamento(req.user.id, req.body);
    res.status(201).json(orcamento);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const listar = async (req, res) => {
  try {
    const orcamentos = await orcamentoService.listarOrcamentos(req.user.id, req.query.mes);
    res.json(orcamentos);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deletar = async (req, res) => {
  try {
    await orcamentoService.deletarOrcamento(req.params.id, req.user.id);
    res.json({ message: 'Orçamento removido.' });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

const verificar = async (req, res) => {
  try {
    const alertas = await orcamentoService.verificarAlertas(req.user.id);
    res.json(alertas);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { criar, listar, deletar, verificar };
