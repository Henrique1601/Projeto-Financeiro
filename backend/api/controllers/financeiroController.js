const { salvarLancamento, listarLancamentos, deletarLancamento, editarLancamentos, importarLancamentos, importarAuto, exportarXlsx } = require('../services/financeiroService');
const { sendReport } = require('../services/emailService');

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
    const id = req.body.id || req.query.id;
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

const importarAutoHandler = async (req, res, next) => {
  try {
    const { fileType, content } = req.body;
    const result = await importarAuto(req.user.id, fileType, content);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const exportarXlsxHandler = async (req, res, next) => {
  try {
    const { lancamentos } = req.body;
    if (!lancamentos || !Array.isArray(lancamentos) || lancamentos.length === 0) {
      return res.status(400).json({ error: 'Nenhum lançamento para exportar.' });
    }
    const buffer = await exportarXlsx(lancamentos);
    const dataStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="financeiro_${dataStr}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

const exportarEmailHandler = async (req, res, next) => {
  try {
    const { lancamentos, periodoLabel } = req.body;
    if (!lancamentos || !Array.isArray(lancamentos) || lancamentos.length === 0) {
      return res.status(400).json({ error: 'Nenhum lançamento para exportar.' });
    }
    const profile = await (require('../services/authService').getUserProfile)(req.user.id);
    const result = await sendReport(profile.email, lancamentos, periodoLabel || 'personalizado');
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { salvar, listar, deletar, editar, importar, importarAuto: importarAutoHandler, exportarXlsx: exportarXlsxHandler, exportarEmail: exportarEmailHandler };
