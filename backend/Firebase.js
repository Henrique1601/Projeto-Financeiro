const express = require('express');
const app1 = express();
const cors = require('cors');
  
// Importa o Firebase Admin SDK
const admin = require('firebase-admin');
  
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyCFgpbxv2OjMl-pnylvLHOZEdXlyK3PhjE",
    authDomain: "personalinvoicing-7e68a.firebaseapp.com",
    projectId: "personalinvoicing-7e68a",
    storageBucket: "personalinvoicing-7e68a.firebasestorage.app",
    messagingSenderId: "454451156177",
    appId: "1:454451156177:web:7b5dacfcd084801cdea1f0",
    measurementId: "G-ZG72RPR6F0"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  
// Configuração do Firebase Admin (você precisará do arquivo de credenciais)
const serviceAccount = require('./path-to-your-service-account-key.json'); // Substitua pelo caminho correto
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Inicializa o Firestore
const db = admin.firestore();
const faturamentoCollection = db.collection('faturamento');

// Habilita o CORS
app1.use(cors({
  origin: 'http://127.0.0.1:5501' // Substitua pelo endereço do seu frontend
}));

// Configura o servidor para aceitar JSON
app.use(express.json());

// Endpoint para salvar dados
app.post('/salvar', async (req, res) => {
  const { data, descricao, valor, entradaSaida } = req.body;
  
  console.log('Dados recebidos:', { data, descricao, valor, entradaSaida });

  if (!data || !descricao || !valor || !entradaSaida) {
    return res.status(400).send('Todos os campos são obrigatórios');
  }

  // Verifica se data está no formato correto
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return res.status(400).send('Data deve estar no formato YYYY-MM-DD');
  }

  // Verifica se valor é um número
  if (isNaN(valor)) {
    return res.status(400).send('Valor deve ser um número válido');
  }

  // Verifica se entradaSaida é válido
  if (entradaSaida !== 'Entrada' && entradaSaida !== 'Saída') {
    return res.status(400).send('Tipo deve ser "Entrada" ou "Saída"');
  }

  try {
    const docRef = await faturamentoCollection.add({
      data,
      descricao,
      valor: Number(valor), // Converte para número
      entradaSaida,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(200).json({ id: docRef.id });
  } catch (error) {
    console.error('Erro ao salvar no Firestore:', error);
    res.status(500).send('Erro ao salvar no banco');
  }
});

// Endpoint para deletar dados
app.delete('/deletar', async (req, res) => {
  const { id } = req.body;

  try {
    const docRef = faturamentoCollection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json('Registro não encontrado');
    }

    await docRef.delete();
    res.status(200).json({ message: 'Registro deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar no Firestore:', error);
    res.status(500).json('Erro ao deletar no banco');
  }
});

// Endpoint para editar dados
app.put('/editar', async (req, res) => {
  const { id, data, descricao, valor, entradaSaida } = req.body;

  if (!id) {
    return res.status(400).json('ID é obrigatório para edição');
  }

  try {
    const docRef = faturamentoCollection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json('Registro não encontrado');
    }

    await docRef.update({
      data,
      descricao,
      valor: Number(valor),
      entradaSaida,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ message: 'Registro atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar no Firestore:', error);
    res.status(500).json('Erro ao atualizar no banco');
  }
});

// Inicia o servidor
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});