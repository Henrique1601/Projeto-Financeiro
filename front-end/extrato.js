// Token de autenticação
let token = localStorage.getItem('token');

// Determinar a URL da API com base no ambiente
const API_BASE_URL = window.location.hostname.includes('vercel')
    ? 'https://projeto-financeiro-vert.vercel.app'
    : 'http://localhost:3000';

// Lista completa de lançamentos (para filtragem)
let lancamentosCompletos = [];

// Lista de lançamentos filtrados (para uso no cálculo do faturamento)
let lancamentosFiltrados = [];

// Função auxiliar para fetch com retentativas (copiada do index.js)
async function fetchWithRetry(url, options, retries = 3, delay = 1000, timeout = 15000) {
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

// Função para renovar o token (copiada do index.js)
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

// Função para logout (copiada do index.js)
function logout() {
    localStorage.removeItem('token');
    token = null;
    window.location.href = '../login/login.html';
}

// Função para formatar a data (alinhada com index.js)
function formatarData(dataISO) {
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Mês começa em 0
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// Função para formatar valor (alinhada com index.js)
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

// Carregar os dados do extrato ao abrir a página
document.addEventListener('DOMContentLoaded', async () => {
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

    // Função para coletar dados para os gráficos
    function collectChartData() {
        if (!lancamentosFiltrados || lancamentosFiltrados.length === 0) {
            console.error('Nenhum lançamento filtrado disponível para gerar gráficos');
            return null;
        }

        const dataByMonth = {};
        const expensesByCategory = {};
        const saldoByMonth = {};

        lancamentosFiltrados.forEach(lancamento => {
            const date = new Date(lancamento.data).toISOString().split('T')[0]; // Converter para YYYY-MM-DD
            const description = lancamento.descricao;
            const value = parseFloat(lancamento.valor); // Valor numérico
            const type = lancamento.entradaSaida; // Entrada ou Saída

            // Extrair mês e ano (ex.: "MM/YYYY")
            const [year, month] = date.split('-');
            const monthYear = `${month}/${year}`;

            // Inicializar dados por mês
            if (!dataByMonth[monthYear]) {
                dataByMonth[monthYear] = { Entrada: 0, Saída: 0 };
            }
            if (!saldoByMonth[monthYear]) {
                saldoByMonth[monthYear] = 0;
            }

            // Somar valores por tipo (Entrada/Saída)
            if (type === 'Entrada') {
                dataByMonth[monthYear].Entrada += value;
            } else if (type === 'Saída') {
                dataByMonth[monthYear].Saída += Math.abs(value); // Usar valor absoluto para Saídas
            }

            // Somar despesas por categoria (usando descrição como categoria)
            if (type === 'Saída') {
                expensesByCategory[description] = (expensesByCategory[description] || 0) + Math.abs(value);
            }

            // Atualizar saldo por mês
            saldoByMonth[monthYear] += value;
        });

        return { dataByMonth, expensesByCategory, saldoByMonth };
    }

    // Função para gerar gráficos
    function generateCharts() {
        showSpinner('Gerando gráficos...');
        const chartType = document.getElementById('chartType')?.value || 'bar';
        const chartData = collectChartData();
        if (!chartData) {
            hideSpinner();
            Toastify({
                text: 'Erro: Nenhum dado disponível para gerar gráficos.',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'red',
            }).showToast();
            return;
        }

        const { dataByMonth, expensesByCategory, saldoByMonth } = chartData;
        const chartsContainer = document.querySelector('.charts-container');
        const barCanvas = document.getElementById('chartsCanvas');
        const pieCanvas = document.getElementById('pieChart');
        const lineCanvas = document.getElementById('lineChart') || document.createElement('canvas');

        if (!barCanvas || !pieCanvas || !chartsContainer) {
            console.error('Canvas ou container de gráficos não encontrado');
            hideSpinner();
            Toastify({
                text: 'Erro: Elementos de gráficos não encontrados.',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'red',
            }).showToast();
            return;
        }

        // Configurar o canvas de linha, se ainda não existe
        if (!lineCanvas.id) {
            lineCanvas.id = 'lineChart';
            chartsContainer.appendChild(lineCanvas);
        }

        // Mostrar o container de gráficos
        chartsContainer.style.display = 'block';

        // Destruir gráficos anteriores, se existirem
        if (barCanvas.chart) {
            barCanvas.chart.destroy();
        }
        if (pieCanvas.chart) {
            pieCanvas.chart.destroy();
        }
        if (lineCanvas.chart) {
            lineCanvas.chart.destroy();
        }

        // Preparar dados para o gráfico de barras (Entradas vs. Saídas por mês)
        const months = Object.keys(dataByMonth).sort((a, b) => {
            const [monthA, yearA] = a.split('/');
            const [monthB, yearB] = b.split('/');
            return new Date(yearA, monthA - 1) - new Date(yearB, monthB - 1);
        });
        const entradas = months.map(month => dataByMonth[month].Entrada);
        const saidas = months.map(month => dataByMonth[month].Saída);

        // Preparar dados para o gráfico de pizza (Distribuição de despesas por categoria)
        const categories = Object.keys(expensesByCategory);
        const categoryValues = Object.values(expensesByCategory);

        // Preparar dados para o gráfico de linha (Saldo por mês)
        const saldoMonths = Object.keys(saldoByMonth).sort((a, b) => {
            const [monthA, yearA] = a.split('/');
            const [monthB, yearB] = b.split('/');
            return new Date(yearA, monthA - 1) - new Date(yearB, monthB - 1);
        });
        const saldos = saldoMonths.map(month => saldoByMonth[month]);

        // Gráfico de barras
        barCanvas.chart = new Chart(barCanvas, {
            type: chartType, // Usa o tipo selecionado
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Entradas',
                        data: entradas,
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                    },
                    {
                        label: 'Saídas',
                        data: saidas,
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Valor (R$)',
                        },
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Mês',
                        },
                    },
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Entradas e Saídas por Mês',
                    },
                },
            },
        });

        // Gráfico de pizza
        pieCanvas.chart = new Chart(pieCanvas, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    data: categoryValues,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)',
                        'rgba(255, 159, 64, 0.5)',
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                    ],
                    borderWidth: 1,
                }],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Distribuição de Despesas por Categoria',
                    },
                },
            },
        });

        // Gráfico de linha
        lineCanvas.chart = new Chart(lineCanvas, {
            type: 'line',
            data: {
                labels: saldoMonths,
                datasets: [{
                    label: 'Saldo',
                    data: saldos,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    fill: true,
                }],
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Saldo (R$)',
                        },
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Mês',
                        },
                    },
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Evolução do Saldo por Mês',
                    },
                },
            },
        });

        hideSpinner();
    }

    // Adicionar evento ao botão de gerar gráficos
    const generateChartsBtn = document.getElementById('generate-charts');
    if (generateChartsBtn) {
        generateChartsBtn.addEventListener('click', generateCharts);
    } else {
        console.error('Botão com ID "generate-charts" não encontrado');
    }

    // Botão para exportar gráfico como imagem
    const exportChartBtn = document.getElementById('export-chart');
    if (exportChartBtn) {
        exportChartBtn.addEventListener('click', () => {
            const canvas = document.getElementById('chartsCanvas'); // Ou 'pieChart' para o gráfico de pizza
            if (canvas) {
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = 'grafico-lancamentos.png';
                link.click();
            } else {
                Toastify({
                    text: 'Erro: Gráfico não encontrado para exportação.',
                    duration: 3000,
                    gravity: 'top',
                    position: 'right',
                    backgroundColor: 'red',
                }).showToast();
            }
        });
    }

    // Função para carregar o extrato
    async function carregarExtrato() {
        try {
            showSpinner('Carregando extrato...');
            let response = await fetchWithRetry(`${API_BASE_URL}/api/listar?t=${Date.now()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401 || response.status === 403) {
                console.log('Token inválido ou expirado, renovando...');
                token = await refreshToken();
                response = await fetchWithRetry(`${API_BASE_URL}/api/listar?t=${Date.now()}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }

            if (!response.ok) {
                throw new Error(`Erro ao carregar dados: ${response.status} - ${response.statusText}`);
            }

            lancamentosCompletos = await response.json();
            console.log('Lançamentos carregados:', lancamentosCompletos);
            lancamentosFiltrados = lancamentosCompletos;
            exibirExtrato(lancamentosCompletos);
            hideSpinner();
        } catch (err) {
            console.error('Erro ao carregar extrato:', err);
            hideSpinner();
            Toastify({
                text: 'Erro ao carregar o extrato: ' + err.message,
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'red',
            }).showToast();
        }
    }

    // Função para preencher o filtro de ano dinamicamente
    function preencherFiltroAno() {
        const filtroAno = document.getElementById('filtroAno');
        const anos = new Set();
        lancamentosCompletos.forEach(lancamento => {
            const ano = new Date(lancamento.data).getFullYear(); // Extrai o ano do formato ISO
            anos.add(ano);
        });
        console.log('Anos encontrados:', Array.from(anos));
        Array.from(anos).sort().forEach(ano => {
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            filtroAno.appendChild(option);
        });
    }

    // Função para exibir o extrato na tabela
    function exibirExtrato(lancamentos) {
        const tableBody = document.getElementById('extrato-table').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = ''; // Limpa a tabela
        lancamentos.forEach(lancamento => {
            const row = tableBody.insertRow(); // Cria uma nova linha no <tbody>
            row.insertCell(0).innerHTML = formatarData(lancamento.data); // Adiciona célula para a data
            row.insertCell(1).innerHTML = lancamento.descricao; // Adiciona célula para a descrição
            const valorCell = row.insertCell(2); // Adiciona célula para o valor
            valorCell.innerHTML = formatarValor(lancamento.valor);
            valorCell.className = lancamento.entradaSaida === 'Entrada' ? 'valor-entrada' : 'valor-saida';
            row.insertCell(3).innerHTML = lancamento.entradaSaida; // Adiciona célula para Entrada/Saída
        });
        lancamentosFiltrados = lancamentos;
    }

    // Função para aplicar os filtros
    function aplicarFiltros() {
        const filtroData = document.getElementById('filtroData').value;
        const filtroMes = document.getElementById('filtroMes').value;
        const filtroAno = document.getElementById('filtroAno').value;
        const filtroTipo = document.getElementById('filtroTipo').value;

        lancamentosFiltrados = lancamentosCompletos.filter(lancamento => {
            const data = new Date(lancamento.data);
            const ano = data.getFullYear().toString();
            const mes = String(data.getMonth() + 1).padStart(2, '0'); // Mês começa em 0
            const dataFormatada = data.toISOString().split('T')[0]; // YYYY-MM-DD

            if (filtroData && dataFormatada !== filtroData) {
                return false;
            }

            if (filtroMes && mes !== filtroMes) {
                return false;
            }

            if (filtroAno && ano !== filtroAno) {
                return false;
            }

            if (filtroTipo && lancamento.entradaSaida !== filtroTipo) {
                return false;
            }

            return true;
        });

        exibirExtrato(lancamentosFiltrados);
        document.getElementById('faturamento-resultado').innerHTML = '';
        generateCharts(); // Atualiza os gráficos automaticamente
    }

    // Função para limpar os filtros
    function limparFiltros() {
        document.getElementById('filtroData').value = '';
        document.getElementById('filtroMes').value = '';
        document.getElementById('filtroAno').value = '';
        document.getElementById('filtroTipo').value = '';
        exibirExtrato(lancamentosCompletos);
        document.getElementById('faturamento-resultado').innerHTML = '';
    }

    // Função para calcular o faturamento
    function calcularFaturamento() {
        if (lancamentosFiltrados.length === 0) {
            document.getElementById('faturamento-resultado').innerHTML = 'Nenhum lançamento encontrado para calcular o faturamento.';
            return;
        }

        let totalEntradas = 0;
        let totalSaidas = 0;

        lancamentosFiltrados.forEach(lancamento => {
            if (lancamento.entradaSaida === 'Entrada') {
                totalEntradas += Number(lancamento.valor);
            } else if (lancamento.entradaSaida === 'Saída') {
                totalSaidas += Number(lancamento.valor);
            }
        });

        const faturamento = totalEntradas + totalSaidas;
        const resultado = `Faturamento: R$${faturamento.toFixed(2).replace('.', ',')} (Entradas: R$${totalEntradas.toFixed(2).replace('.', ',')}, Saídas: R$${Math.abs(totalSaidas).toFixed(2).replace('.', ',')})`;
        document.getElementById('faturamento-resultado').innerHTML = resultado;
    }

    // Função para voltar à página index.html
    function voltar() {
        window.location.href = '../index.html';
    }

    // Verificar autenticação
    if (!token) {
        window.location.href = '../login/login.html';
    } else {
        // Carregar extrato e preencher filtro de ano
        await carregarExtrato();
        preencherFiltroAno();

        document.getElementById('chartType')?.addEventListener('change', generateCharts);
        document.getElementById('aplicarFiltros')?.addEventListener('click', aplicarFiltros);
        document.getElementById('limparFiltros')?.addEventListener('click', limparFiltros);
        document.getElementById('calcularFaturamento')?.addEventListener('click', calcularFaturamento);
        document.getElementById('voltar')?.addEventListener('click', voltar);
    }
});