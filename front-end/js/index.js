const API_BASE_URL = window.location.hostname.includes('vercel') 
    ? '' // Substitua por sua URL real do Vercel
    : 'http://localhost:3000';


// Função auxiliar para fetch com retentativas
async function fetchWithRetry(url, options, retries = 3, delay = 1000, timeout = 10000) {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            console.warn(`Tentativa ${i + 1} falhou: ${error.message}. Tentando novamente em ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Função para obter mensagem de erro
function getErrorMessage(error, defaultMessage = 'Erro desconhecido.') {
    return error && error.message ? error.message : defaultMessage;
}

// Função para mostrar o spinner
function showSpinner(message = 'Processando...') {
    const spinner = document.getElementById('spinner');
    if (spinner) {
        spinner.style.display = 'flex';
        spinner.querySelector('p').textContent = message;
    }
}

// Função para esconder o spinner
function hideSpinner() {
    const spinner = document.getElementById('spinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

// Função para logout
function logout() {
    localStorage.removeItem('token');
    token = null
    window.location.href = './front-end/login/login.html';
}

// Função para verificar disponibilidade do servidor
async function checkServerAvailability() {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/health`, { method: 'GET' }, 3, 1000, 3000);
        if (!response.ok) throw new Error('Servidor indisponível');
        return true;
    } catch (error) {
        console.error('Servidor indisponível:', error.message);
        Toastify({
            text: 'Não foi possível conectar ao servidor. Verifique se o servidor está rodando e tente novamente.',
            duration: 3000,
            gravity: 'top',
            position: 'right',
            backgroundColor: 'red',
        }).showToast();
        return false;
    }
}

// Função para renovar o token
async function refreshToken() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Nenhum token disponível. Faça login novamente.');
        }

        const response = await fetch(`${API_BASE_URL}/api/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Erro ao renovar token' }));
            throw new Error(`Erro ao renovar token: ${err.error || response.statusText}`);
        }

        const data = await response.json();
        console.log('Token renovado com sucesso:', data);
        localStorage.setItem('token', data.token);
        return data.token;
    } catch (error) {
        console.error('Erro ao renovar token:', error.message);
        logout();
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Declaração dos elementos do DOM
    const exportTableCsvBtn = document.getElementById('export-csv');
    const importTableCsvBtn = document.getElementById('import-csv');
    const exportTableBtn = document.getElementById('export-table');
    const importTableBtn = document.getElementById('import-table');
    const spinner = document.getElementById('spinner');
    const exportExcelBtn = document.getElementById('export-excel');
    const exportPdfBtn = document.getElementById('export-pdf');
    const deletar = document.getElementById('Deletar');
    const salvar = document.getElementById('Salvar');
    const fecharFaturamento = document.getElementById('FecharFaturamento');
    const confirmar = document.getElementById('Confirmar');
    const lancamentos = document.getElementById('lancamentos');
    const BtnLancar = document.getElementById('Lancar');
    const X = document.getElementById('close-button');
    const editar = document.getElementById('Editar');
    const userProfile = document.getElementById('user-profile');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const SelecionarTodos = document.getElementById('SelecionarTodos');
    const SaldoAtual = document.getElementById('SaldoAtual');

    // Obter token do localStorage
    let token = localStorage.getItem('token');
    console.log('Token:', token);

    // Verificar se os elementos essenciais existem
    if (!confirmar || !SaldoAtual || !lancamentos || !BtnLancar || !userProfile || !userName || !userEmail) {
        console.error('Um ou mais elementos essenciais não foram encontrados no HTML');
        return;
    }

    // Verificar autenticação
    if (!token) {
        window.location.href = '../front-end/login/login.html';
    } else {
        displayUserProfile();
        loadFinanceiroData();
    }
// Função para verificar se o usuário está logado e carregar os registros
async function checkLoginAndLoad() {
  if (!token) {
      window.location.href = './login/login.html';
      return;
  }
  await listarRegistros();
}

// Função para listar registros
async function listarRegistros() {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/listar`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                window.location.href = 'pages/login/login.html';
                return;
            }
            const errorText = await response.text();
            throw new Error(`Erro ${response.status}: ${errorText || response.statusText}`);
        }

        const registros = await response.json();
        console.log('Registros recebidos:', registros); // Log para depuração

        const resultadosDiv = document.getElementById('resultados');
        resultadosDiv.innerHTML = `
            <table border="1">
                <thead>
                    <tr>
                        <th>Selecionar</th>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Valor</th>
                        <th>Entrada/Saída</th>
                    </tr>
                </thead>
                <tbody>
                    ${registros.map(registro => `
                        <tr>
                            <td><input type="checkbox"></td>
                            <td>${formatarData(registro.data)}</td>
                            <td>${registro.descricao}</td>
                            <td>R$${parseFloat(registro.valor).toFixed(2)}</td>
                            <td>${registro.entradasaida || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        console.error('Erro ao listar:', err);
        Toastify({
            text: 'Erro ao listar registros: ' + err.message,
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: { background: 'red' },
        }).showToast();
    }
}

// Função para salvar registro
async function salvarRegistro() {
    const data = document.getElementById('Data').value;
    const descricao = document.getElementById('Descricao').value;
    const valor = parseFloat(document.getElementById('Valor').value);
    const entradaSaida = document.getElementById('EntradaSaida').value;

    if (!data || !descricao || isNaN(valor) || !entradaSaida) {
        Toastify({
            text: 'Por favor, preencha todos os campos corretamente.',
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: { background: 'red' },
        }).showToast();
        return;
    }

    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/salvar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ data, descricao, valor, entradaSaida })
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                window.location.href = 'pages/login/login.html';
                return;
            }
            const errorText = await response.text();
            throw new Error(`Erro ${response.status}: ${errorText || response.statusText}`);
        }

        const result = await response.json();
        Toastify({
            text: 'Registro salvo com sucesso!',
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: { background: 'green' },
        }).showToast();
        await listarRegistros();
    } catch (err) {
        console.error('Erro ao salvar:', err);
        Toastify({
            text: 'Erro ao salvar: ' + err.message,
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: { background: 'red' },
        }).showToast();
    }
}

    // Função para exibir o perfil do usuário
    function displayUserProfile() {
        try {
            const decodedToken = jwt_decode(token);
            userName.textContent = `${decodedToken.nome} ${decodedToken.sobrenome}`;
            userEmail.textContent = decodedToken.email;
        } catch (err) {
            console.error('Erro ao decodificar token:', err);
            Toastify({
                text: 'Erro ao carregar perfil. Faça login novamente.',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'red',
            }).showToast();
            logout();
        }
    }

    // Função para confirmar e salvar um novo lançamento
    async function Confirmar() {
        const dataInput = document.getElementById('date').value;
        const data = converterParaFormatoBackend(dataInput);
        const descricao = document.getElementById('description').value;
        let valor = Number(document.getElementById('value').value);
        let entradaSaida = document.getElementById('select').value;

        entradaSaida = entradaSaida.trim().charAt(0).toUpperCase() + entradaSaida.trim().slice(1).toLowerCase();
        if (!['Entrada', 'Saída'].includes(entradaSaida)) {
            Toastify({
                text: 'Tipo de entrada/saída deve ser "Entrada" ou "Saída".',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'red',
            }).showToast();
            return;
        }

        if (data === '' || descricao === '' || isNaN(valor) || entradaSaida === '') {
            Toastify({
                text: 'Todos os campos são obrigatórios!',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'red',
            }).showToast();
            return;
        }

        if (entradaSaida === 'Saída') {
            valor = -Math.abs(valor);
        } else {
            valor = Math.abs(valor);
        }

        const tabela = document.getElementById('generator-table').getElementsByTagName('tbody')[0];
        const row = tabela.insertRow();
        const tempId = Date.now();
        row.dataset.id = `temp_${tempId}`;

        const cellCheck = row.insertCell(0);
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'select-row';
        cellCheck.appendChild(checkbox);

        const cell1 = row.insertCell(1);
        const cell2 = row.insertCell(2);
        const cell3 = row.insertCell(3);
        const cell4 = row.insertCell(4);

        cell1.innerHTML = formatarData(data);
        cell1.dataset.originalValue = data;
        cell2.innerHTML = descricao;
        cell3.innerHTML = formatarValor(valor);
        cell3.dataset.originalValue = valor;
        cell4.innerHTML = entradaSaida;
        cell4.dataset.originalValue = entradaSaida;

        console.log('Dados enviados ao backend:', { data, descricao, valor, entradaSaida });

        const salvarDados = async (currentToken) => {
            return fetchWithRetry(`${API_BASE_URL}/api/salvar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ data, descricao, valor, entradaSaida })
            });
        };

        let token = localStorage.getItem('token');
        try {
            showSpinner('Salvando lançamento...');
            let response = await salvarDados(token);

            if (response.status === 401 || response.status === 403) {
                token = await refreshToken();
                response = await salvarDados(token);
            }

            if (!response.ok) {
                const err = await response.json();
                throw new Error(`Erro no servidor: ${response.status} - ${err.error || response.statusText}`);
            }

            const result = await response.json();
            console.log('ID retornado pelo backend:', result.id);
            row.dataset.id = result.id;

            await loadFinanceiroData();
            atualizarSaldo();
            atualizarEstadoBotaoSelecionarTodos();

            Toastify({
                text: result.message || 'Dados confirmados e salvos no banco!',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'green',
            }).showToast();

            document.getElementById('date').value = '';
            document.getElementById('description').value = '';
            document.getElementById('value').value = '';
            document.getElementById('select').value = 'Entrada';
        } catch (error) {
            console.error('Erro ao confirmar:', error);
            Toastify({
                text: 'Erro ao salvar os dados no servidor: ' + error.message,
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'red',
            }).showToast();
            if (row.parentNode) {
                row.remove();
            }
            atualizarEstadoBotaoSelecionarTodos();
        } finally {
            hideSpinner();
        }
    }

    // Função para tornar uma célula editável
    function TornarEditavel(cell, idLinha, cellIndex) {
        const valorOriginal = cell.dataset.originalValue || cell.innerHTML.trim().replace('R$ ', '').replace(',', '.');
        let input;

        cell.dataset.originalValue = valorOriginal;

        if (cellIndex === 1) {
            input = document.createElement('input');
            input.type = 'date';
            try {
                const dateParts = valorOriginal.split('/');
                if (dateParts.length === 3) {
                    const [dia, mes, ano] = dateParts;
                    input.value = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
                } else {
                    input.value = '';
                }
            } catch (e) {
                console.error('Erro ao formatar data:', e);
                input.value = '';
            }
            input.style.width = '100%';
        } else if (cellIndex === 2) {
            input = document.createElement('input');
            input.type = 'text';
            input.value = valorOriginal;
            input.style.width = '100%';
        } else if (cellIndex === 3) {
            input = document.createElement('input');
            input.type = 'number';
            input.value = Math.abs(Number(valorOriginal)) || '';
            input.style.width = '100%';
        } else if (cellIndex === 4) {
            input = document.createElement('select');
            input.style.width = '100%';
            const options = ['Entrada', 'Saída'];
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.text = option;
                if (option === valorOriginal) opt.selected = true;
                input.appendChild(opt);
            });
        } else {
            return;
        }

        cell.innerHTML = '';
        cell.appendChild(input);
        input.focus();

        console.log(`Campo editável criado para célula índice ${cellIndex} com valor: ${valorOriginal}`);
    }

    // Função para editar linhas selecionadas
    function EditarLinhasSelecionadas() {
        const tabela = document.getElementById('generator-table').getElementsByTagName('tbody')[0];
        if (!tabela) {
            console.error('Tabela não encontrada com ID "generator-table" ou não possui tbody');
            Toastify({
                text: 'Erro: Tabela não encontrada.',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'red',
            }).showToast();
            return;
        }

        const checkboxes = tabela.getElementsByClassName('select-row');
        if (!checkboxes || checkboxes.length === 0) {
            console.error('Nenhum checkbox encontrado na tabela');
            Toastify({
                text: 'Erro: Nenhuma linha disponível para edição.',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'red',
            }).showToast();
            return;
        }

        let linhasSelecionadas = 0;

        for (let i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked) {
                linhasSelecionadas++;
                const row = checkboxes[i].parentElement.parentElement;
                const cells = row.cells;
                console.log(`Linha ${i} selecionada, células disponíveis: ${cells.length}`);

                const dataCell = cells[1];
                const dataOriginal = dataCell.innerHTML;
                dataCell.dataset.originalValue = dataOriginal;
                const dataInput = document.createElement('input');
                dataInput.type = 'date';
                dataInput.value = converterParaFormatoBackend(dataOriginal);
                dataCell.innerHTML = '';
                dataCell.appendChild(dataInput);

                const descCell = cells[2];
                const descOriginal = descCell.innerHTML;
                descCell.dataset.originalValue = descOriginal;
                const descInput = document.createElement('input');
                descInput.type = 'text';
                descInput.value = descOriginal;
                descCell.innerHTML = '';
                descCell.appendChild(descInput);

                const valorCell = cells[3];
                const valorOriginal = valorCell.dataset.originalValue || valorCell.innerHTML.replace('R$ ', '').replace(',', '.');
                valorCell.dataset.originalValue = valorOriginal;
                const valorInput = document.createElement('input');
                valorInput.type = 'number';
                valorInput.value = Math.abs(valorOriginal);
                valorCell.innerHTML = '';
                valorCell.appendChild(valorInput);

                const tipoCell = cells[4];
                const tipoOriginal = tipoCell.innerHTML;
                tipoCell.dataset.originalValue = tipoOriginal;
                const tipoSelect = document.createElement('select');
                const opcaoEntrada = document.createElement('option');
                opcaoEntrada.value = 'Entrada';
                opcaoEntrada.text = 'Entrada';
                const opcaoSaida = document.createElement('option');
                opcaoSaida.value = 'Saída';
                opcaoSaida.text = 'Saída';
                tipoSelect.appendChild(opcaoEntrada);
                tipoSelect.appendChild(opcaoSaida);
                tipoSelect.value = tipoOriginal;
                tipoCell.innerHTML = '';
                tipoCell.appendChild(tipoSelect);
            }
        }

        if (linhasSelecionadas === 0) {
            Toastify({
                text: 'Erro: Selecione pelo menos uma linha para editar.',
                duration: 3000,
                gravity: 'top',
                position: 'center',
                backgroundColor: 'red',
            }).showToast();
            return;
        }

        console.log('Linhas selecionadas para edição:', linhasSelecionadas);

        let saveButton = document.querySelector('button#saveEditsBtn');
        if (!saveButton) {
            saveButton = document.createElement('button');
            saveButton.id = 'saveEditsBtn';
            saveButton.textContent = 'Salvar Edições';
            saveButton.onclick = SalvarEdicoes;
            document.body.appendChild(saveButton);
        } else {
            console.log('Botão "Salvar Edições" já existe, não será recriado.');
        }
    }

    // Função para salvar edições
    async function SalvarEdicoes() {
        try {
            console.log('Iniciando SalvarEdicoes...');
            
            const tabela = document.getElementById('generator-table').getElementsByTagName('tbody')[0];
            if (!tabela) {
                console.error('Tabela não encontrada com ID "generator-table" ou não possui tbody');
                Toastify({
                    text: 'Erro: Tabela não encontrada.',
                    duration: 3000,
                    gravity: 'top',
                    position: 'right',
                    backgroundColor: 'red',
                }).showToast();
                return;
            }

            const checkboxes = tabela.getElementsByClassName('select-row');
            if (!checkboxes || checkboxes.length === 0) {
                console.error('Nenhum checkbox encontrado na tabela');
                Toastify({
                    text: 'Erro: Nenhuma linha disponível para salvar.',
                    duration: 3000,
                    gravity: 'top',
                    position: 'right',
                    backgroundColor: 'red',
                }).showToast();
                return;
            }

            const updates = [];

            for (let i = 0; i < checkboxes.length; i++) {
                if (checkboxes[i].checked) {
                    const row = checkboxes[i].parentElement.parentElement;
                    const cells = row.cells;
                    const id = row.dataset.id;
                    if (!id) {
                        console.error(`Linha ${i} não possui dataset.id`);
                        continue;
                    }
                    const edit = { id: id };

                    for (let j = 1; j < cells.length; j++) {
                        const cell = cells[j];
                        const input = cell.querySelector('input') || cell.querySelector('select');
                        if (input) {
                            const novoValor = (input.type === 'select-one') ? input.value : input.value.trim();
                            let valorOriginal = cell.dataset.originalValue;

                            if (novoValor === '') {
                                console.log(`Campo vazio detectado na célula ${j} da linha ${i + 1}`);
                                Toastify({
                                    text: `Por favor, preencha o campo na célula índice ${j} da linha ${i + 1}`,
                                    duration: 3000,
                                    gravity: 'top',
                                    position: 'right',
                                    backgroundColor: 'red',
                                }).showToast();
                                return;
                            }

                            if (j === 1) {
                                const valorOriginalBackend = converterParaFormatoBackend(valorOriginal);
                                console.log(`Linha ${i}, Data - novoValor: ${novoValor}, valorOriginal: ${valorOriginal}, valorOriginalBackend: ${valorOriginalBackend}`);
                                if (novoValor !== valorOriginalBackend) {
                                    if (!novoValor.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                        console.log(`Data inválida na célula ${j} da linha ${i + 1}`);
                                        Toastify({
                                            text: `Data inválida na célula índice ${j} da linha ${i + 1}`,
                                            duration: 3000,
                                            gravity: 'top',
                                            position: 'right',
                                            backgroundColor: 'red',
                                        }).showToast();
                                        return;
                                    }
                                    edit.data = novoValor;
                                    cell.dataset.originalValue = formatarData(novoValor);
                                }
                            } else if (j === 2) {
                                console.log(`Linha ${i}, Descrição - novoValor: ${novoValor}, valorOriginal: ${valorOriginal}`);
                                if (novoValor !== valorOriginal) {
                                    edit.descricao = novoValor;
                                    cell.dataset.originalValue = novoValor;
                                }
                            } else if (j === 3) {
                                let valorEditado = Number(novoValor);
                                if (isNaN(valorEditado)) {
                                    console.log(`Valor inválido na célula ${j} da linha ${i + 1}`);
                                    Toastify({
                                        text: `Valor inválido na célula índice ${j} da linha ${i + 1}`,
                                        duration: 3000,
                                        gravity: 'top',
                                        position: 'right',
                                        backgroundColor: 'red',
                                    }).showToast();
                                    return;
                                }
                                const entradaSaidaCell = cells[4];
                                const entradaSaidaInput = entradaSaidaCell.querySelector('select');
                                const entradaSaida = entradaSaidaInput ? entradaSaidaInput.value : cells[4].dataset.originalValue;
                                if (entradaSaida === 'Saída') {
                                    valorEditado = -Math.abs(valorEditado);
                                } else {
                                    valorEditado = Math.abs(valorEditado);
                                }
                                const valorOriginalNum = Number(valorOriginal);
                                console.log(`Linha ${i}, Valor - novoValor: ${novoValor}, valorEditado: ${valorEditado}, valorOriginal: ${valorOriginalNum}`);
                                if (valorEditado !== valorOriginalNum) {
                                    edit.valor = valorEditado;
                                    cell.dataset.originalValue = valorEditado;
                                    cell.innerHTML = formatarValor(valorEditado);
                                    cell.classList.remove('positive-value', 'negative-value');
                                    if (valorEditado < 0) {
                                        cell.classList.add('negative-value');
                                    } else {
                                        cell.classList.add('positive-value');
                                    }
                                }
                            } else if (j === 4) {
                                console.log(`Linha ${i}, Entrada/Saída - novoValor: ${novoValor}, valorOriginal: ${valorOriginal}`);
                                if (novoValor !== valorOriginal) {
                                    edit.entradaSaida = novoValor;
                                    cell.dataset.originalValue = novoValor;
                                }
                            }
                        }
                    }
                    if (Object.keys(edit).length > 1) {
                        updates.push(edit);
                    }
                }
            }

            if (updates.length === 0) {
                console.log('Nenhuma alteração detectada para salvar.');
                Toastify({
                    text: 'Nenhuma alteração detectada para salvar.',
                    duration: 3000,
                    gravity: 'top',
                    position: 'right',
                    backgroundColor: 'orange',
                }).showToast();
                return;
            }

            console.log('Edições a serem enviadas:', updates);

            let token = localStorage.getItem('token');
            let response = await fetchWithRetry(`${API_BASE_URL}/api/editar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ updates })
            });

            if (response.status === 401 || response.status === 403) {
                console.log('Token inválido ou expirado, tentando renovar...');
                token = await refreshToken();
                response = await fetchWithRetry(`${API_BASE_URL}/api/editar`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ updates })
                });
            }

            if (!response.ok) {
                const err = await response.json();
                throw new Error(`Erro no servidor: ${response.status} - ${err.error || response.statusText}`);
            }

            const result = await response.json();
            console.log('Resultado do back-end:', result);

            console.log('Atualizando a tabela com as edições...');
            for (let i = 0; i < checkboxes.length; i++) {
                if (checkboxes[i].checked) {
                    const row = checkboxes[i].parentElement.parentElement;
                    const cells = row.cells;
                    const edit = updates.find(e => e.id === row.dataset.id);

                    if (edit.data) {
                        cells[1].innerHTML = formatarData(edit.data);
                        cells[1].dataset.originalValue = formatarData(edit.data);
                    }
                    if (edit.descricao) {
                        cells[2].innerHTML = edit.descricao;
                        cells[2].dataset.originalValue = edit.descricao;
                    }
                    if (edit.valor) {
                        cells[3].innerHTML = formatarValor(edit.valor);
                        cells[3].dataset.originalValue = edit.valor;
                    }
                    if (edit.entradaSaida) {
                        cells[4].innerHTML = edit.entradaSaida;
                        cells[4].dataset.originalValue = edit.entradaSaida;
                    }
                }
            }

            Toastify({
                text: result.message || 'Edições salvas com sucesso!',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'green',
            }).showToast();

            await loadFinanceiroData();
            atualizarSaldo();
            const saveButton = document.querySelector('#saveEditsBtn');
            if (saveButton) saveButton.remove();
        } catch (error) {
            console.error('Erro ao salvar edições:', error);
            Toastify({
                text: 'Erro ao salvar as edições no servidor: ' + error.message,
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'red',
            }).showToast();
        }
    }

    // Função para deletar linhas
    async function Deletar() {
        console.log('Início da função Deletar...');

        const serverAvailable = await checkServerAvailability();
        if (!serverAvailable) {
            console.log('Servidor não disponível, abortando...');
            return;
        }

        const tabela = document.getElementById('generator-table').getElementsByTagName('tbody')[0];
        const checkboxes = tabela.getElementsByClassName('select-row');
        const linhasParaDeletar = [];

        for (let i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked) {
                const linha = checkboxes[i].parentElement.parentElement;
                const id = linha.dataset.id;
                if (id) {
                    linhasParaDeletar.push({ elemento: linha, id });
                }
            }
        }

        if (linhasParaDeletar.length === 0) {
            const mensagemDiv = document.createElement('div');
            mensagemDiv.style.position = 'fixed';
            mensagemDiv.style.top = '10px';
            mensagemDiv.style.left = '50%';
            mensagemDiv.style.transform = 'translateX(-50%)';
            mensagemDiv.style.backgroundColor = '#f44336';
            mensagemDiv.style.color = 'white';
            mensagemDiv.style.padding = '10px';
            mensagemDiv.style.zIndex = '1000';

            const mensagemTexto = document.createElement('span');
            mensagemTexto.textContent = 'Por favor, selecione pelo menos uma linha para deletar.';
            mensagemDiv.appendChild(mensagemTexto);

            const fecharBtn = document.createElement('button');
            fecharBtn.textContent = '✕';
            fecharBtn.style.background = 'none';
            fecharBtn.style.border = 'none';
            fecharBtn.style.color = 'white';
            fecharBtn.style.cursor = 'pointer';
            fecharBtn.style.fontSize = '16px';
            fecharBtn.onclick = () => mensagemDiv.remove();
            mensagemDiv.appendChild(fecharBtn);

            document.body.appendChild(mensagemDiv);
            setTimeout(() => {
                mensagemDiv.remove();
            }, 6000);
            return;
        }

        showSpinner('Deletando linhas...');

        const deletarDados = async (currentToken) => {
            const batchSize = 500;
            const results = [];

            try {
                for (let i = 0; i < linhasParaDeletar.length; i += batchSize) {
                    const batch = linhasParaDeletar.slice(i, i + batchSize);
                    const batchPromise = batch.map(linha =>
                        fetchWithRetry(`${API_BASE_URL}/api/deletar`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${currentToken}`
                            },
                            body: JSON.stringify({ id: linha.id })
                        })
                        .then(response => {
                            if (response.status === 401 || response.status === 403) {
                                return refreshToken().then(newToken => {
                                    return fetchWithRetry(`${API_BASE_URL}/api/deletar`, {
                                        method: 'DELETE',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${newToken}`
                                        },
                                        body: JSON.stringify({ id: linha.id })
                                    });
                                }).catch(err => {
                                    throw new Error('Não foi possível renovar o token. Faça login novamente.');
                                });
                            }
                            if (!response.ok) {
                                return response.json().then(err => {
                                    throw new Error(err.error || 'Erro ao deletar no servidor');
                                });
                            }
                            return response.json();
                        })
                        .then(data => {
                            return { success: true, linha, data };
                        })
                        .catch(error => {
                            console.error('Erro ao deletar linha:', linha.id, error.message);
                            return { success: false, linha, error };
                        })
                    );
                    const batchResult = await Promise.all(batchPromise);
                    results.push(...batchResult);
                }
                return results;
            } catch (error) {
                return results.length > 0 ? results : [{ success: false, error: new Error('Erro inesperado durante a deleção') }];
            }
        };

        try {
            const results = await deletarDados(token);
            const successes = results.filter(result => result && result.success);
            const failures = results.filter(result => result && !result.success);

            const successMessage = `Linhas deletadas com sucesso: ${successes.length} de ${linhasParaDeletar.length}`;
            let mensagem = successMessage;

            if (failures.length > 0) {
                const errorMessages = failures.map(result => `ID ${result.linha.id}: ${getErrorMessage(result.error)}`).join('\n');
                mensagem += `\nErro ao deletar as linhas:\n${errorMessages}`;
            }

            const mensagemDiv = document.createElement('div');
            mensagemDiv.style.position = 'fixed';
            mensagemDiv.style.top = '10px';
            mensagemDiv.style.left = '50%';
            mensagemDiv.style.transform = 'translateX(-50%)';
            mensagemDiv.style.backgroundColor = failures.length > 0 ? '#f44336' : '#4CAF50';
            mensagemDiv.style.color = 'white';
            mensagemDiv.style.padding = '10px';
            mensagemDiv.style.zIndex = '1000';

            const mensagemTexto = document.createElement('span');
            mensagemTexto.textContent = mensagem;
            mensagemDiv.appendChild(mensagemTexto);

            const fecharBtn = document.createElement('button');
            fecharBtn.textContent = '✕';
            fecharBtn.style.background = 'none';
            fecharBtn.style.border = 'none';
            fecharBtn.style.color = 'white';
            fecharBtn.style.cursor = 'pointer';
            fecharBtn.style.fontSize = '16px';
            fecharBtn.onclick = () => mensagemDiv.remove();
            mensagemDiv.appendChild(fecharBtn);

            document.body.appendChild(mensagemDiv);
            setTimeout(() => {
                mensagemDiv.remove();
            }, 10000);

            if (successes.length > 0) {
                successes.forEach(result => result.linha.elemento.remove());
            }

            showSpinner('Atualizando tabela...');
            await loadFinanceiroData();
            atualizarSaldo();
            atualizarEstadoBotaoSelecionarTodos();
        } catch (error) {
            console.error('Erro ao deletar:', error);
            const errorMessage = getErrorMessage(error, 'Erro desconhecido ao deletar.');

            const mensagemDiv = document.createElement('div');
            mensagemDiv.style.position = 'fixed';
            mensagemDiv.style.top = '10px';
            mensagemDiv.style.left = '50%';
            mensagemDiv.style.transform = 'translateX(-50%)';
            mensagemDiv.style.backgroundColor = '#f44336';
            mensagemDiv.style.color = 'white';
            mensagemDiv.style.padding = '10px';
            mensagemDiv.style.zIndex = '1000';

            const mensagemTexto = document.createElement('span');
            mensagemTexto.textContent = 'Erro ao deletar as linhas no servidor: ' + errorMessage;
            mensagemDiv.appendChild(mensagemTexto);

            const fecharBtn = document.createElement('button');
            fecharBtn.textContent = '✕';
            fecharBtn.style.background = 'none';
            fecharBtn.style.border = 'none';
            fecharBtn.style.color = 'white';
            fecharBtn.style.cursor = 'pointer';
            fecharBtn.style.fontSize = '16px';
            fecharBtn.onclick = () => mensagemDiv.remove();
            mensagemDiv.appendChild(fecharBtn);

            document.body.appendChild(mensagemDiv);
            setTimeout(() => {
                mensagemDiv.remove();
            }, 10000);
        } finally {
            hideSpinner();
        }
    }

    // Função para fechar faturamento
    function FecharFaturamento() {
        const tabelaResposta = document.getElementById('resposta-table')?.getElementsByTagName('tbody')[0];
        if (tabelaResposta) {
            const row = tabelaResposta.insertRow();
            const valorResultado = SaldoAtual.innerText || '0';
            row.insertCell(0).innerHTML = valorResultado;
            Toastify({
                text: 'Faturamento fechado',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'green',
            }).showToast();
        } else {
            console.warn('Tabela de resposta não encontrada');
        }
    }

// Função auxiliar para formatar a data
function formatarData(dataISO) {
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Mês começa em 0
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}
    // Função para converter data para formato backend
    function converterParaFormatoBackend(data) {
        try {
            if (!data) return null;
            if (data.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return data;
            }
            const [dia, mes, ano] = data.split('/');
            if (dia && mes && ano) {
                return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
            }
            throw new Error('Formato de data inválido');
        } catch (error) {
            console.error('Erro ao converter data para formato backend:', error, 'Data:', data);
            return null;
        }
    }

    // Função para formatar valor
    function formatarValor(valor) {
        try {
            const numero = Number(valor);
            if (isNaN(numero)) {
                console.warn('Valor inválido para formatação:', valor);
                return valor;
            }
            const formato = `R$${Math.abs(numero).toFixed(2).replace('.', ',')}`;
            return numero < 0 ? `-${formato}` : formato;
        } catch (error) {
            console.error('Erro ao formatar valor:', error, 'Valor:', valor);
            return valor;
        }
    }

    // Função para atualizar saldo
    function atualizarSaldo() {
        const tabela = document.getElementById('generator-table').getElementsByTagName('tbody')[0];
        const rows = tabela.getElementsByTagName('tr');
        let saldo = 0;

        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].cells;
            const valor = Number(cells[3].dataset.originalValue);
            saldo += valor;
        }

        SaldoAtual.innerHTML = `Saldo Atual: ${formatarValor(saldo)}`;
    }

    // Função para atualizar estado do botão "Selecionar Todos"
    function atualizarEstadoBotaoSelecionarTodos() {
        const tabela = document.getElementById('generator-table').getElementsByTagName('tbody')[0];
        const checkboxes = tabela ? tabela.getElementsByClassName('select-row') : [];
        const selecionarTodos = document.getElementById('SelecionarTodos');

        if (!selecionarTodos) {
            console.error('Botão "selecionarTodosBtn" não encontrado');
            return;
        }

        if (!checkboxes || checkboxes.length === 0) {
            selecionarTodos.disabled = true;
            selecionarTodos.textContent = 'Selecionar Todos';
            return;
        }

        selecionarTodos.disabled = false;
        const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
        selecionarTodos.textContent = allChecked ? 'Desmarcar Todos' : 'Selecionar Todos';

        console.log('Estado do botão SelecionarTodos atualizado. Checkboxes encontrados:', checkboxes.length);
    }

    // Função para selecionar/desmarcar todas as linhas
    function selecionarTodos() {
        const tabela = document.getElementById('generator-table').getElementsByTagName('tbody')[0];
        const checkboxes = tabela ? tabela.getElementsByClassName('select-row') : [];
        const selecionarTodosBtn = document.getElementById('SelecionarTodos');

        if (!selecionarTodosBtn || !checkboxes || checkboxes.length === 0) {
            console.error('Botão "selecionarTodosBtn" ou checkboxes "select-row" não encontrados');
            return;
        }

        const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
        const newState = !allChecked;

        Array.from(checkboxes).forEach(checkbox => {
            checkbox.checked = newState;
        });

        atualizarEstadoBotaoSelecionarTodos();
    }

    // Função para exportar tabela para CSV
    function exportTableCsv() {
        showSpinner('Exportando tabela para CSV...');
        try {
            const tabela = document.getElementById('generator-table');
            if (!tabela) {
                throw new Error('Tabela não encontrada com ID "generator-table"');
            }
            const tbody = tabela.getElementsByTagName('tbody')[0];
            const rows = tbody.getElementsByTagName('tr');
            const csv = [];
            const headers = ['Data', 'Descrição', 'Valor', 'Entrada/Saída'];
            csv.push(headers.map(h => `"${h}"`).join(','));
    
            for (let row of rows) {
                if (row.dataset.id && !row.dataset.id.startsWith('temp_')) {
                    const cells = row.cells;
                    const valor = cells[3].dataset.originalValue || cells[3].innerHTML.replace('R$ ', '').replace(',', '.');
                    if (isNaN(Number(valor))) {
                        throw new Error(`Valor inválido na linha com ID ${row.dataset.id}`);
                    }
                    // Converter a data de formato ISO (2025-04-29T03:00:00.000Z) para YYYY-MM-DD
                    let dataValue = cells[1].dataset.originalValue;
                    if (dataValue.includes('T')) {
                        dataValue = new Date(dataValue).toISOString().split('T')[0]; // Converte para YYYY-MM-DD
                    } else if (dataValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                        dataValue = converterParaFormatoBackend(dataValue); // Converte DD/MM/YYYY para YYYY-MM-DD
                    }
                    const rowData = [
                        dataValue,
                        cells[2].innerHTML,
                        valor,
                        cells[4].innerHTML
                    ];
                    csv.push(rowData.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
                }
            }
    
            if (csv.length <= 1) {
                throw new Error('Nenhum dado confirmado para exportar.');
            }
    
            const csvContent = '\uFEFF' + csv.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const dataAtual = new Date().toISOString().slice(0, 10);
            a.download = `lancamentos_${dataAtual}.csv`;
            a.click();
            URL.revokeObjectURL(url);
    
            Toastify({
                text: `Tabela exportada com sucesso! ${csv.length - 1} linhas exportadas.`,
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'green',
            }).showToast();
        } catch (error) {
            console.error('Erro ao exportar tabela para CSV:', error);
            Toastify({
                text: 'Erro ao exportar tabela: ' + error.message,
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'red',
            }).showToast();
        } finally {
            hideSpinner();
        }
    }



// Função para importar tabela de CSV
async function importTableCsv() {
    showSpinner('Importando tabela de CSV...');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) {
            hideSpinner();
            Toastify({ text: 'Nenhum arquivo selecionado!', duration: 3000, gravity: 'top', position: 'right', backgroundColor: 'red' }).showToast();
            document.body.removeChild(fileInput);
            return;
        }
        if (!file.name.endsWith('.csv')) {
            hideSpinner();
            Toastify({ text: 'Por favor, selecione um arquivo CSV!', duration: 3000, gravity: 'top', position: 'right', backgroundColor: 'red' }).showToast();
            document.body.removeChild(fileInput);
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            hideSpinner();
            Toastify({ text: 'O arquivo é muito grande (máximo 5MB).', duration: 3000, gravity: 'top', position: 'right', backgroundColor: 'red' }).showToast();
            document.body.removeChild(fileInput);
            return;
        }

        Papa.parse(file, {
            complete: async function (results) {
                try {
                    const linhas = results.data;
                    if (linhas.length <= 1) {
                        throw new Error('O arquivo CSV está vazio ou não contém dados válidos.');
                    }

                    const headersEsperados = ['Data', 'Descrição', 'Valor', 'Entrada/Saída'];
                    const headers = linhas[0].map(h => h.trim());
                    if (!headersEsperados.every((h, i) => h === headers[i])) {
                        throw new Error('Cabeçalhos do CSV inválidos. Esperado: ' + headersEsperados.join(', '));
                    }

                    const dados = linhas.slice(1).filter(linha => linha.length >= 4 && linha.some(val => val.trim()));
                    if (dados.length === 0) {
                        throw new Error('Nenhum dado válido encontrado no CSV.');
                    }

                    if (!confirm(`Deseja importar ${dados.length} lançamentos? Dados existentes com as mesmas informações (data, descrição, valor e tipo) serão ignorados, e os demais serão adicionados.`)) {
                        hideSpinner();
                        document.body.removeChild(fileInput);
                        return;
                    }

                    function isValidDate(dateString) {
                        const [year, month, day] = dateString.split('-').map(Number);
                        const date = new Date(year, month - 1, day);
                        return (
                            date.getFullYear() === year &&
                            date.getMonth() + 1 === month &&
                            date.getDate() === day
                        );
                    }

                    const lancamentos = [];
                    const errors = [];

                    for (const [index, linha] of dados.entries()) {
                        try {
                            let [data, descricao, valorStr, entradaSaida] = linha.map(val => val.trim());
                            // Validar campos obrigatórios com logs detalhados
                            if (!data) {
                                throw new Error('Campo "Data" está ausente ou vazio.');
                            }
                            if (!descricao) {
                                throw new Error('Campo "Descrição" está ausente ou vazio.');
                            }
                            if (!valorStr) {
                                throw new Error('Campo "Valor" está ausente ou vazio.');
                            }
                            if (!entradaSaida) {
                                throw new Error('Campo "Entrada/Saída" está ausente ou vazio.');
                            }

                            if (!data.match(/^\d{4}-\d{2}-\d{2}$/) || !isValidDate(data)) {
                                throw new Error(`Data inválida: ${data}. Deve ser no formato YYYY-MM-DD.`);
                            }

                            if (typeof descricao !== 'string' || descricao.length > 255) {
                                throw new Error('Descrição inválida: deve ser uma string com no máximo 255 caracteres.');
                            }

                            const valor = Number(valorStr.replace(',', '.'));
                            if (isNaN(valor)) {
                                throw new Error(`Valor inválido: ${valorStr}. Deve ser um número.`);
                            }

                            const normalizedEntradaSaida = entradaSaida.toLowerCase() === 'entrada' ? 'Entrada' : 
                                                          entradaSaida.toLowerCase() === 'saída' ? 'Saída' : entradaSaida;
                            if (!['Entrada', 'Saída'].includes(normalizedEntradaSaida)) {
                                throw new Error(`Entrada/Saída inválida: ${entradaSaida}. Deve ser "Entrada" ou "Saída".`);
                            }

                            const valorFinal = normalizedEntradaSaida === 'Saída' ? -Math.abs(valor) : Math.abs(valor);
                            lancamentos.push({ data, descricao, valor: valorFinal, entradaSaida: normalizedEntradaSaida });
                        } catch (error) {
                            console.error(`Erro no lançamento ${index + 1}:`, error.message, { linha });
                            errors.push(`Lançamento ${index + 1} (Descrição: ${linha[1] || 'N/A'}): ${error.message}`);
                        }
                    }

                    if (lancamentos.length === 0) {
                        throw new Error('Nenhum lançamento válido para importar. Verifique os erros no console.');
                    }

                    let currentToken = localStorage.getItem('token');
                    let response;
                    try {
                        response = await fetchWithRetry(`${API_BASE_URL}/api/importar`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${currentToken}`
                            },
                            body: JSON.stringify({ lancamentos })
                        });
                    } catch (fetchError) {
                        console.error('Erro de rede:', fetchError);
                        throw new Error(`Erro de rede: ${fetchError.message}`);
                    }

                    if (response.status === 401 || response.status === 403) {
                        console.log('Token inválido ou expirado, renovando...');
                        try {
                            currentToken = await refreshToken();
                            response = await fetchWithRetry(`${API_BASE_URL}/api/importar`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${currentToken}`
                                },
                                body: JSON.stringify({ lancamentos })
                            });
                        } catch (refreshError) {
                            throw new Error(`Falha ao renovar token: ${refreshError.message}`);
                        }
                    }

                    const result = await response.json();
                    if (!response.ok) {
                        errors.push(...(result.errors || [`Erro HTTP ${response.status}: ${result.error || 'Erro desconhecido'}`]));
                        throw new Error('Falha na importação.');
                    }

                    // Recarregar os dados do backend (inclui registros antigos e novos)
                    await loadFinanceiroData();
                    atualizarSaldo();

                    if (errors.length > 0 || result.errors?.length > 0) {
                        const allErrors = [...errors, ...(result.errors || [])];
                        const errorMessage = allErrors.slice(0, 5).join('\n') + (allErrors.length > 5 ? `\n...e mais ${allErrors.length - 5} erros.` : '');
                        Toastify({
                            text: `Importação concluída com erros. ${result.insertedIds?.length || 0} de ${lancamentos.length} lançamentos importados.\n${errorMessage}`,
                            duration: 10000,
                            gravity: 'top',
                            position: 'right',
                            backgroundColor: 'orange',
                        }).showToast();
                        console.error('Erros durante a importação:\n' + allErrors.join('\n'));
                    } else {
                        Toastify({
                            text: `Tabela importada com sucesso! ${result.insertedIds.length} lançamentos novos adicionados.`,
                            duration: 3000,
                            gravity: 'top',
                            position: 'right',
                            backgroundColor: 'green',
                        }).showToast();
                    }
                } catch (error) {
                    console.error('Erro geral ao importar tabela:', error);
                    Toastify({
                        text: 'Erro ao importar tabela: ' + error.message,
                        duration: 3000,
                        gravity: 'top',
                        position: 'right',
                        backgroundColor: 'red',
                    }).showToast();
                } finally {
                    hideSpinner();
                    document.body.removeChild(fileInput);
                }
            },
            header: false,
            skipEmptyLines: true,
            encoding: 'utf-8'
        });
    });

    fileInput.click();
}

    // Função para exportar tabela para JSON
function exportTableToJSON() {
        showSpinner('Exportando tabela para JSON...');
    
        const tableBody = document.getElementById('generator-table').getElementsByTagName('tbody')[0];
        const rows = tableBody.getElementsByTagName('tr');
        const data = [];
    
        for (let row of rows) {
            if (row.dataset.id && !row.dataset.id.startsWith('temp_')) {
                const cells = row.cells;
                // Converter a data de DD/MM/YYYY para YYYY-MM-DD
                let dataValue = cells[1].dataset.originalValue;
                if (dataValue.includes('T')) {
                    // Se for formato ISO (ex.: 2025-01-01T03:00:00.000Z), converter diretamente
                    dataValue = new Date(dataValue).toISOString().split('T')[0];
                } else {
                    dataValue = converterParaFormatoBackend(dataValue);
                }
                const rowData = {
                    data: dataValue,
                    descricao: cells[2].innerHTML,
                    valor: Number(cells[3].dataset.originalValue),
                    entradaSaida: cells[4].innerHTML
                };
                data.push(rowData);
            }
        }
    
        try {
            if (data.length === 0) {
                throw new Error('Nenhum dado confirmado para exportar.');
            }
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'lancamentos.json';
            a.click();
            URL.revokeObjectURL(url);
    
            Toastify({
                text: 'Tabela exportada com sucesso!',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'green',
            }).showToast();
        } catch (error) {
            console.error('Erro ao exportar tabela:', error);
            Toastify({
                text: 'Erro ao exportar tabela: ' + error.message,
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'red',
            }).showToast();
        } finally {
            hideSpinner();
        }
}

    // Função para importar tabela de JSON
async function importTableFromJSON(event) {
        showSpinner('Importando tabela...');
        const file = event.target.files[0];
        if (!file) {
            hideSpinner();
            Toastify({
                text: 'Nenhum arquivo selecionado!',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'red',
            }).showToast();
            return;
        }
        if (!file.name.endsWith('.json')) {
            hideSpinner();
            Toastify({
                text: 'Por favor, selecione um arquivo JSON!',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'red',
            }).showToast();
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            hideSpinner();
            Toastify({
                text: 'O arquivo é muito grande (máximo 5MB).',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'red',
            }).showToast();
            return;
        }
    
        const reader = new FileReader();
        reader.onload = async function (e) {
            try {
                const data = JSON.parse(e.target.result);
                if (!Array.isArray(data)) {
                    throw new Error('O arquivo JSON deve conter uma lista de lançamentos.');
                }
                if (data.length === 0) {
                    throw new Error('O arquivo JSON está vazio.');
                }
                if (data.length > 100) {
                    throw new Error('Não é permitido importar mais de 100 lançamentos de uma vez.');
                }
                if (!confirm(`Deseja importar ${data.length} lançamentos? Dados existentes com as mesmas informações (data, descrição, valor e tipo) serão ignorados, e os demais serão adicionados.`)) {
                    hideSpinner();
                    return;
                }
    
                function isValidDate(dateString) {
                    const [year, month, day] = dateString.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    return (
                        date.getFullYear() === year &&
                        date.getMonth() + 1 === month &&
                        date.getDate() === day
                    );
                }
    
                const lancamentos = [];
                const errors = [];
    
                for (const [index, item] of data.entries()) {
                    try {
                        // Validar campos obrigatórios com logs detalhados
                        if (!item.data) {
                            throw new Error('Campo "data" está ausente ou vazio.');
                        }
                        if (!item.descricao) {
                            throw new Error('Campo "descricao" está ausente ou vazio.');
                        }
                        if (isNaN(item.valor)) {
                            throw new Error('Campo "valor" está ausente ou não é um número válido.');
                        }
                        if (!item.entradaSaida) {
                            throw new Error('Campo "entradaSaida" está ausente ou vazio.');
                        }
    
                        if (!item.data.match(/^\d{4}-\d{2}-\d{2}$/) || !isValidDate(item.data)) {
                            throw new Error(`Data inválida: ${item.data}. Deve ser no formato YYYY-MM-DD.`);
                        }
    
                        if (typeof item.descricao !== 'string' || item.descricao.length > 255) {
                            throw new Error('Descrição inválida: deve ser uma string com no máximo 255 caracteres.');
                        }
    
                        const valor = Number(item.valor);
                        if (isNaN(valor)) {
                            throw new Error(`Valor inválido: ${item.valor}. Deve ser um número.`);
                        }
    
                        const normalizedEntradaSaida = item.entradaSaida.trim().toLowerCase() === 'entrada' ? 'Entrada' :
                                                       item.entradaSaida.trim().toLowerCase() === 'saída' ? 'Saída' :
                                                       item.entradaSaida.trim();
                        if (!['Entrada', 'Saída'].includes(normalizedEntradaSaida)) {
                            throw new Error(`Entrada/Saída inválida: ${item.entradaSaida}. Deve ser "Entrada" ou "Saída".`);
                        }
    
                        const valorFinal = normalizedEntradaSaida === 'Saída' ? -Math.abs(valor) : Math.abs(valor);
                        
                        lancamentos.push({
                            data: item.data,
                            descricao: item.descricao,
                            valor: valorFinal,
                            entradaSaida: normalizedEntradaSaida
                        });
                    } catch (error) {
                        console.error(`Erro ao validar lançamento ${index + 1}:`, error.message, { item });
                        errors.push(`Lançamento ${index + 1} (Descrição: ${item.descricao || 'N/A'}): ${error.message}`);
                    }
                }
    
                if (lancamentos.length === 0) {
                    throw new Error('Nenhum lançamento válido para importar. Verifique os erros no console.');
                }
    
                let currentToken = localStorage.getItem('token');
                let response;
                console.log('Enviando requisição para /api/importar:', { lancamentos });
    
                try {
                    response = await fetchWithRetry(`${API_BASE_URL}/api/importar`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${currentToken}`
                        },
                        body: JSON.stringify({ lancamentos })
                    });
                } catch (fetchError) {
                    console.error('Erro de rede:', fetchError);
                    throw new Error(`Erro de rede: ${fetchError.message}`);
                }
    
                if (response.status === 401 || response.status === 403) {
                    console.log('Token inválido ou expirado, renovando...');
                    try {
                        currentToken = await refreshToken();
                        response = await fetchWithRetry(`${API_BASE_URL}/api/importar`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${currentToken}`
                            },
                            body: JSON.stringify({ lancamentos })
                        });
                    } catch (refreshError) {
                        throw new Error(`Falha ao renovar token: ${refreshError.message}`);
                    }
                }
    
                const result = await response.json();
                if (!response.ok) {
                    errors.push(...(result.errors || [`Erro HTTP ${response.status}: ${result.error || 'Erro desconhecido'}`]));
                    throw new Error('Falha na importação.');
                }
    
                // Recarregar os dados do backend (inclui registros antigos e novos)
                await loadFinanceiroData();
                atualizarSaldo();
    
                if (errors.length > 0 || result.errors?.length > 0) {
                    const allErrors = [...errors, ...(result.errors || [])];
                    const errorMessage = allErrors.slice(0, 5).join('\n') + (allErrors.length > 5 ? `\n...e mais ${allErrors.length - 5} erros.` : '');
                    Toastify({
                        text: `Importação concluída com erros. ${result.insertedIds?.length || 0} de ${lancamentos.length} lançamentos importados.\n${errorMessage}`,
                        duration: 10000,
                        gravity: 'top',
                        position: 'right',
                        backgroundColor: 'orange',
                    }).showToast();
                    console.error('Erros durante a importação:\n' + allErrors.join('\n'));
                } else {
                    Toastify({
                        text: `Tabela importada com sucesso! ${result.insertedIds.length} lançamentos novos adicionados.`,
                        duration: 3000,
                        gravity: 'top',
                        position: 'right',
                        backgroundColor: 'green',
                    }).showToast();
                }
            } catch (error) {
                console.error('Erro geral ao importar tabela:', error);
                Toastify({
                    text: 'Erro ao importar tabela: ' + error.message,
                    duration: 3000,
                    gravity: 'top',
                    position: 'right',
                    backgroundColor: 'red',
                }).showToast();
            } finally {
                hideSpinner();
                document.getElementById('file-input').value = '';
            }
        };
        reader.readAsText(file);
}
    

    // Função para carregar dados financeiros
async function loadFinanceiroData() {
        try {
            console.log('Carregando dados financeiros...');
            const response = await fetchWithRetry(`${API_BASE_URL}/api/listar?t=${Date.now()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.status === 401 || response.status === 403) {
                console.log('Token inválido ou expirado, renovando...');
                const newToken = await refreshToken();
                const retryResponse = await fetchWithRetry(`${API_BASE_URL}/api/listar?t=${Date.now()}`, {
                    headers: {
                        'Authorization': `Bearer ${newToken}`
                    }
                });
                if (!retryResponse.ok) {
                    throw new Error(`Erro ao carregar dados após renovação do token: ${retryResponse.status}`);
                }
                response = retryResponse;
            }

            if (!response.ok) {
                throw new Error(`Erro ao carregar dados: ${response.status} - ${response.statusText}`);
            }

            const lancamentos = await response.json();
            console.log('Dados recebidos do backend:', lancamentos);

            const tbody = document.getElementById('generator-table').getElementsByTagName('tbody')[0];
            tbody.innerHTML = '';

            lancamentos.forEach(lancamento => {
                const row = tbody.insertRow();
                row.dataset.id = lancamento.id;

                const cellCheck = row.insertCell(0);
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'select-row';
                cellCheck.appendChild(checkbox);

                const cell1 = row.insertCell(1);
                const cell2 = row.insertCell(2);
                const cell3 = row.insertCell(3);
                const cell4 = row.insertCell(4);

                cell1.innerHTML = formatarData(lancamento.data);
                cell1.dataset.originalValue = lancamento.data;
                cell2.innerHTML = lancamento.descricao;
                cell3.innerHTML = formatarValor(lancamento.valor);
                cell3.dataset.originalValue = lancamento.valor;
                cell4.innerHTML = lancamento.entradaSaida;

                if (lancamento.entradaSaida === 'Saída') {
                    cell4.style.color = 'red';
                } else if (lancamento.entradaSaida === 'Entrada') {
                    cell4.style.color = 'green';
                }

                if (lancamento.valor < 0) {
                    cell3.classList.add('negative-value');
                } else {
                    cell3.classList.add('positive-value');
                }
                cell4.dataset.originalValue = lancamento.entradaSaida;
            });

            atualizarEstadoBotaoSelecionarTodos();
            atualizarSaldo();
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
            Toastify({
                text: 'Erro ao carregar os dados financeiros: ' + err.message,
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'red',
            }).showToast();
        }
}

    // Função para imprimir a tabela
function printTable() {
        const table = document.getElementById('generator-table');
        if (!table) {
            console.error('Tabela não encontrada com ID "generator-table"');
            Toastify({
                text: 'Erro: Tabela não encontrada.',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'red',
            }).showToast();
            return;
        }
        showSpinner('Preparando impressão...');

        const printWindow = window.open('', '_blank');
        const clonedTable = table.cloneNode(true);
        const rows = clonedTable.querySelectorAll('tr');
        rows.forEach(row => {
            row.deleteCell(0);
        });
        printWindow.document.write(`
            <html>
                <head>
                    <title>Impressão de Lançamentos</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .positive-value { color: green; }
                        .negative-value { color: red; }
                        @media print {
                            body { margin: 0; }
                            table { page-break-inside: auto; }
                        }
                    </style>
                </head>
                <body>
                    <h2>Lançamentos Financeiros</h2>
                    <table>
                        ${clonedTable.outerHTML}
                    </table>
                </body>
            </html>
        `);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
            hideSpinner();
        }, 500);
 }

    // Eventos
    if (exportTableCsvBtn) {
        exportTableCsvBtn.addEventListener('click', exportTableCsv);
    } else {
        console.error('Botão com ID "export-table-csv" não encontrado');
    }

    if (importTableCsvBtn) {
        importTableCsvBtn.addEventListener('click', () => {
            if (confirm('Deseja importar a tabela? Isso pode sobrescrever dados existentes.')) {
                importTableCsv();
            }
        });
    } else {
        console.error('Botão com ID "import-table-csv" não encontrado');
    }

    if (exportTableBtn) {
        exportTableBtn.addEventListener('click', exportTableToJSON);
    } else {
        console.error('Botão com ID "export-table" não encontrado');
    }

    if (importTableBtn) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'file-input';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        importTableBtn.addEventListener('click', () => {
            if (confirm('Deseja importar a tabela? Isso pode sobrescrever dados existentes.')) {
                fileInput.click();
            }
        });

        fileInput.addEventListener('change', importTableFromJSON);
    } else {
        console.error('Botão com ID "import-table" não encontrado');
    }

    exportPdfBtn.addEventListener('click', function() {
        const table = document.getElementById('generator-table');
        if (!table) {
            console.error('Tabela não encontrada com ID "generator-table"');
            return;
        }
        showSpinner('Gerando PDF...');

        html2canvas(table, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            let pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            let heightLeft = pdfHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();

            while (heightLeft >= 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }

            pdf.save('tabela.pdf');
            hideSpinner();
        }).catch(error => {
            console.error('Erro ao gerar PDF:', error);
            Toastify({
                text: 'Erro ao gerar PDF. Verifique o console para mais detalhes.',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'red',
            }).showToast();
            hideSpinner();
        });
    });

    exportExcelBtn.addEventListener('click', function() {
        const table = document.getElementById('generator-table');
        if (!table) {
            console.error('Tabela não encontrada com ID "generator-table"');
            return;
        }

        showSpinner('Gerando Excel...');

        const wb = XLSX.utils.book_new();
        const wsData = [];
        wsData.unshift(['Nome', userName.textContent]);
        wsData.unshift(['Email', userEmail.textContent]);
        wsData.unshift([SaldoAtual.textContent]);

        const headers = [];
        const headerRow = table.querySelectorAll('thead tr th');
        headerRow.forEach(header => {
            headers.push(header.innerText);
        });
        wsData.push(headers);

        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const rowData = [];
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                if (cell.querySelector('input[type="checkbox"]')) {
                    rowData.push('');
                } else {
                    rowData.push(cell.innerText);
                }
            });
            wsData.push(rowData);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Lançamentos');

        ws['!cols'] = [
            { wch: 20 },
            { wch: 15 },
            { wch: 30 },
            { wch: 20 },
            { wch: 20 }
        ];
        ws['!rows'] = [
            { hpx: 20 },
            { hpx: 20 },
            { hpx: 20 }
        ];

        try {
            XLSX.writeFile(wb, 'lancamentos.xlsx');
            hideSpinner();
        } catch (error) {
            console.error('Erro ao gerar Excel:', error);
            Toastify({
                text: 'Erro ao gerar Excel. Verifique o console para mais detalhes.',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'red',
            }).showToast();
            hideSpinner();
        }
    });

    const printBtn = document.getElementById('print-table');
    if (printBtn) {
        printBtn.addEventListener('click', printTable);
    } else {
        console.error('Botão com ID "print-table" não encontrado');
    }

    const editarBtn = document.getElementById('editarLinhasBtn');
    if (editarBtn) {
        editarBtn.addEventListener('click', EditarLinhasSelecionadas);
    } else {
        console.error('Botão com ID "editarLinhasBtn" não encontrado');
    }

    BtnLancar.addEventListener('click', function() {
        lancamentos.style.display = 'block';
    });

    X.addEventListener('click', () => {
        lancamentos.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === lancamentos) {
            lancamentos.style.display = 'none';
        }
    });

    editar.addEventListener('click', EditarLinhasSelecionadas);
    confirmar.addEventListener('click', Confirmar);
    deletar.addEventListener('click', Deletar);
    fecharFaturamento.addEventListener('click', FecharFaturamento);
    SelecionarTodos.addEventListener('click', selecionarTodos);
});