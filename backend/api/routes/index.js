const { authenticate } = require('../middleware/auth');
const { ensureDbInit } = require('../config/database');
const authCtrl = require('../controllers/authController');
const financeiroCtrl = require('../controllers/financeiroController');
const express = require('express');
const router = express.Router();

router.post('/register', ensureDbInit, authCtrl.register);
router.post('/login', ensureDbInit, authCtrl.login);
router.post('/refresh-token', ensureDbInit, authCtrl.refresh);

router.post('/salvar', authenticate, ensureDbInit, financeiroCtrl.salvar);
router.get('/listar', authenticate, ensureDbInit, financeiroCtrl.listar);
router.delete('/deletar', authenticate, ensureDbInit, financeiroCtrl.deletar);
router.put('/editar', authenticate, ensureDbInit, financeiroCtrl.editar);
router.post('/importar', authenticate, ensureDbInit, financeiroCtrl.importar);

router.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

module.exports = router;
