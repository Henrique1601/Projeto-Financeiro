let token = localStorage.getItem('token');

const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        return 'http://localhost:3000';
    }
    if (hostname.includes('projeto-financeiro-frontend') || hostname.includes('vercel')) {
        return 'https://financeiro-backend.vercel.app';
    }
    return '';
};

const API_BASE_URL = getApiBaseUrl();

let lancamentosCompletos = [];
let lancamentosFiltrados = [];

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
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function refreshToken() {
    const response = await fetch(`${API_BASE_URL}/api/refresh-token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) throw new Error('Erro ao renovar token');
    const data = await response.json();
    localStorage.setItem('token', data.token);
    token = data.token;
    return data.token;
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '../login/login.html';
}

function formatarData(dataISO) {
    if (!dataISO) return '';
    try {
        const data = new Date(dataISO);
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
    } catch {
        return dataISO;
    }
}

function formatarValor(valor) {
    try {
        const numero = Number(valor);
        if (isNaN(numero)) return valor;
        const sinal = numero < 0 ? '-' : '';
        return `${sinal}R$${Math.abs(numero).toFixed(2).replace('.', ',')}`;
    } catch {
        return valor;
    }
}

function showSpinner(message = 'Processando...') {
    const spinner = document.getElementById('spinner');
    if (spinner) {
        spinner.style.display = 'flex';
        spinner.querySelector('p').textContent = message;
    }
}

function hideSpinner() {
    const spinner = document.getElementById('spinner');
    if (spinner) spinner.style.display = 'none';
}

function showToast(message, type = 'error') {
    Toastify({
        text: message,
        duration: 3000,
        gravity: 'top',
        position: 'right',
        style: { background: type === 'success' ? '#10b981' : '#ef4444' },
    }).showToast();
}

function collectChartData() {
    if (!lancamentosFiltrados || lancamentosFiltrados.length === 0) return null;

    const dataByMonth = {};
    const expensesByCategory = {};
    const incomeByCategory = {};

    lancamentosFiltrados.forEach(l => {
        const date = new Date(l.data).toISOString().split('T')[0];
        const [year, month] = date.split('-');
        const monthYear = `${month}/${year}`;

        if (!dataByMonth[monthYear]) {
            dataByMonth[monthYear] = { Entrada: 0, Saída: 0 };
        }

        const tipoRaw = l.entradaSaida || l.entradatipo || l.entradasaida || '';
        const tipoStr = String(tipoRaw).trim().toLowerCase();
        const isSaida = tipoStr === 'saída' || tipoStr === 'saida';
        
        if (!isSaida) {
            dataByMonth[monthYear].Entrada += Number(l.valor);
            const cat = l.categoria || 'Outros';
            incomeByCategory[cat] = (incomeByCategory[cat] || 0) + Number(l.valor);
        } else {
            dataByMonth[monthYear].Saída += Math.abs(Number(l.valor));
            const cat = l.categoria || 'Outros';
            expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Math.abs(Number(l.valor));
        }
    });

    return { dataByMonth, expensesByCategory, incomeByCategory };
}

function generateCharts() {
    showSpinner('Gerando gráficos...');
    const chartType = document.getElementById('chartType')?.value || 'bar';
    const chartData = collectChartData();
    
    if (!chartData) {
        hideSpinner();
        showToast('Nenhum dado para gráficos.');
        return;
    }

    const { dataByMonth, expensesByCategory, incomeByCategory } = chartData;
    const chartsSection = document.getElementById('charts-section');
    const barCanvas = document.getElementById('chartsCanvas');
    const pieCanvas = document.getElementById('pieChart');

    if (!barCanvas || !pieCanvas) {
        hideSpinner();
        return;
    }

    chartsSection.style.display = 'block';

    if (barCanvas.chart) barCanvas.chart.destroy();
    if (pieCanvas.chart) pieCanvas.chart.destroy();

    const months = Object.keys(dataByMonth).sort((a, b) => {
        const [mA, yA] = a.split('/');
        const [mB, yB] = b.split('/');
        return new Date(yA, mA - 1) - new Date(yB, mB - 1);
    });

    const entradas = months.map(m => dataByMonth[m].Entrada);
    const saidas = months.map(m => dataByMonth[m].Saída);

    const barConfig = {
        type: chartType === 'line' ? 'line' : chartType === 'pie' ? 'bar' : 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Entradas',
                    data: entradas,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: '#10b981',
                    borderWidth: 2,
                    tension: 0.3
                },
                {
                    label: 'Saídas',
                    data: saidas,
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: {
                    display: true,
                    text: 'Entradas vs Saídas por Mês',
                    font: { size: 16 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(2).replace('.', ',');
                        }
                    }
                }
            }
        }
    };

    if (chartType === 'line') {
        barConfig.data.datasets[0].fill = true;
        barConfig.data.datasets[1].fill = true;
    }

    barCanvas.chart = new Chart(barCanvas, barConfig);

    const categories = Object.keys(expensesByCategory);
    const categoryValues = Object.values(expensesByCategory);
    const incomeCategories = Object.keys(incomeByCategory);
    const incomeValues = Object.values(incomeByCategory);

    const colors = [
        'rgba(239, 68, 68, 0.8)',
        'rgba(99, 102, 241, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(34, 211, 238, 0.8)',
        'rgba(251, 191, 36, 0.8)',
    ];

    pieCanvas.chart = new Chart(pieCanvas, {
        type: 'doughnut',
        data: {
            labels: categories.length > 0 ? categories : ['Sem dados'],
            datasets: [{
                data: categoryValues.length > 0 ? categoryValues : [1],
                backgroundColor: categories.length > 0 ? colors : ['rgba(200, 200, 200, 0.5)'],
                borderWidth: 2,
                borderColor: '#1e293b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' },
                title: {
                    display: true,
                    text: 'Gastos por Categoria',
                    font: { size: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `R$ ${value.toFixed(2).replace('.', ',')} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    hideSpinner();
}

async function carregarExtrato() {
    showSpinner('Carregando extrato...');
    try {
        let response = await fetchWithRetry(`${API_BASE_URL}/api/listar`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
            await refreshToken();
            response = await fetchWithRetry(`${API_BASE_URL}/api/listar`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }

        if (!response.ok) throw new Error('Erro ao carregar dados');

        lancamentosCompletos = await response.json();
        lancamentosFiltrados = lancamentosCompletos;
        exibirExtrato(lancamentosCompletos);
        preencherFiltroAno();
        hideSpinner();
    } catch (err) {
        console.error('Erro:', err);
        hideSpinner();
        showToast('Erro ao carregar extrato');
    }
}

function exibirExtrato(lancamentos) {
    const tableBody = document.getElementById('extrato-table')?.getElementsByTagName('tbody')[0];
    const totalRecords = document.getElementById('total-records');
    
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    if (lancamentos.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px;">Nenhum lançamento encontrado</td></tr>';
        if (totalRecords) totalRecords.textContent = '0 registros';
        return;
    }

    lancamentos.forEach(l => {
        const row = tableBody.insertRow();
        const isNegative = Number(l.valor) < 0;
        
        row.insertCell(0).innerHTML = formatarData(l.data);
        row.insertCell(1).innerHTML = l.descricao || '';
        
        const valorCell = row.insertCell(2);
        valorCell.innerHTML = formatarValor(l.valor);
        valorCell.className = isNegative ? 'negative' : 'positive';
        
        const tipoCell = row.insertCell(3);
        const tipoRaw = l.entradaSaida || l.entradatipo || l.entradasaida || '';
        const tipoStr = String(tipoRaw).trim().toLowerCase();
        const isSaida = tipoStr === 'saída' || tipoStr === 'saida';
        const tipoExibir = isSaida ? 'Saída' : 'Entrada';
        
        tipoCell.innerHTML = `<span class="badge ${isSaida ? 'saida' : 'entrada'}">${tipoExibir}</span>`;
    });

    if (totalRecords) totalRecords.textContent = `${lancamentos.length} registros`;
}

function preencherFiltroAno() {
    const filtroAno = document.getElementById('filtroAno');
    if (!filtroAno) return;
    
    filtroAno.innerHTML = '<option value="">Todos</option>';
    const anos = new Set();
    
    lancamentosCompletos.forEach(l => {
        anos.add(new Date(l.data).getFullYear());
    });
    
    Array.from(anos).sort((a, b) => b - a).forEach(ano => {
        const option = document.createElement('option');
        option.value = ano;
        option.textContent = ano;
        filtroAno.appendChild(option);
    });
}

function aplicarFiltros() {
    const filtroData = document.getElementById('filtroData')?.value || '';
    const filtroMes = document.getElementById('filtroMes')?.value || '';
    const filtroAno = document.getElementById('filtroAno')?.value || '';
    const filtroTipo = document.getElementById('filtroTipo')?.value || '';
    const filtroCategoria = document.getElementById('filtroCategoria')?.value || '';

    lancamentosFiltrados = lancamentosCompletos.filter(l => {
        const data = new Date(l.data);
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear().toString();

        if (filtroData && l.data !== filtroData) return false;
        if (filtroMes && mes !== filtroMes) return false;
        if (filtroAno && ano !== filtroAno) return false;
        
        if (filtroTipo) {
            const tipoRaw = l.entradaSaida || l.entradatipo || l.entradasaida || '';
            const tipoStr = String(tipoRaw).trim().toLowerCase();
            const isSaida = tipoStr === 'saída' || tipoStr === 'saida';
            const tipoExibir = isSaida ? 'Saída' : 'Entrada';
            if (tipoExibir !== filtroTipo) return false;
        }

        if (filtroCategoria && (l.categoria || 'Outros') !== filtroCategoria) return false;

        return true;
    });

    exibirExtrato(lancamentosFiltrados);
    calcularFaturamento();
}

function limparFiltros() {
    document.getElementById('filtroData').value = '';
    document.getElementById('filtroMes').value = '';
    document.getElementById('filtroAno').value = '';
    document.getElementById('filtroTipo').value = '';
    document.getElementById('filtroCategoria').value = '';
    lancamentosFiltrados = lancamentosCompletos;
    exibirExtrato(lancamentosCompletos);
    document.getElementById('faturamento-resultado').style.display = 'none';
    document.getElementById('charts-section').style.display = 'none';
    document.getElementById('evolution-section').style.display = 'none';
    document.getElementById('top-gastos-section').style.display = 'none';
    document.getElementById('comparativo-section').style.display = 'none';
    document.getElementById('resumo-anual-section').style.display = 'none';
}

function calcularFaturamento() {
    const resultadoDiv = document.getElementById('faturamento-resultado');
    if (!resultadoDiv) return;

    if (lancamentosFiltrados.length === 0) {
        resultadoDiv.innerHTML = '<p style="text-align: center; padding: 20px;">Nenhum lançamento encontrado.</p>';
        resultadoDiv.style.display = 'block';
        return;
    }

    let totalEntradas = 0;
    let totalSaidas = 0;

    lancamentosFiltrados.forEach(l => {
        const tipoRaw = l.entradaSaida || l.entradatipo || l.entradasaida || '';
        const tipoStr = String(tipoRaw).trim().toLowerCase();
        const isSaida = tipoStr === 'saída' || tipoStr === 'saida';
        
        if (!isSaida) {
            totalEntradas += Number(l.valor);
        } else {
            totalSaidas += Math.abs(Number(l.valor));
        }
    });

    const saldo = totalEntradas - totalSaidas;

    resultadoDiv.innerHTML = `
        <div class="faturamento-grid">
            <div class="faturamento-item entrada">
                <i class="fas fa-arrow-up"></i>
                <span class="label">Total Entradas</span>
                <span class="value">${formatarValor(totalEntradas)}</span>
            </div>
            <div class="faturamento-item saida">
                <i class="fas fa-arrow-down"></i>
                <span class="label">Total Saídas</span>
                <span class="value">${formatarValor(totalSaidas)}</span>
            </div>
            <div class="faturamento-item saldo">
                <i class="fas fa-wallet"></i>
                <span class="label">Saldo</span>
                <span class="value">${formatarValor(saldo)}</span>
            </div>
        </div>
    `;
    resultadoDiv.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!token) {
        window.location.href = '../login/login.html';
        return;
    }

    await carregarExtrato();

    document.getElementById('voltar')?.addEventListener('click', () => {
        window.location.href = '../index.html';
    });

    document.getElementById('aplicarFiltros')?.addEventListener('click', aplicarFiltros);
    document.getElementById('limparFiltros')?.addEventListener('click', limparFiltros);
    document.getElementById('calcularFaturamento')?.addEventListener('click', () => {
        calcularFaturamento();
        generateEvolutionChart();
        showTopGastos();
        showComparativo();
        showResumoAnual();
    });
    document.getElementById('generate-charts')?.addEventListener('click', generateCharts);
    document.getElementById('chartType')?.addEventListener('change', generateCharts);

    document.getElementById('export-chart')?.addEventListener('click', () => {
        const canvas = document.getElementById('chartsCanvas');
        if (canvas) {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'grafico.png';
            link.click();
        }
    });
});

function generateEvolutionChart() {
    const section = document.getElementById('evolution-section');
    const canvas = document.getElementById('evolutionChart');
    if (!canvas || !lancamentosFiltrados.length) {
        section.style.display = 'none';
        return;
    }
    
    if (canvas.chart) canvas.chart.destroy();
    
    const dataByMonth = {};
    let saldoAcumulado = 0;
    
    const sortedLancamentos = [...lancamentosFiltrados].sort((a, b) => new Date(a.data) - new Date(b.data));
    
    sortedLancamentos.forEach(l => {
        const date = new Date(l.data).toISOString().split('T')[0];
        const [year, month] = date.split('-');
        const monthYear = `${month}/${year}`;
        
        if (!dataByMonth[monthYear]) {
            dataByMonth[monthYear] = { entrada: 0, saida: 0 };
        }
        
        const tipoRaw = l.entradaSaida || '';
        const tipoStr = String(tipoRaw).trim().toLowerCase();
        const isSaida = tipoStr === 'saída' || tipoStr === 'saida';
        
        if (!isSaida) {
            dataByMonth[monthYear].entrada += Number(l.valor);
        } else {
            dataByMonth[monthYear].saida += Math.abs(Number(l.valor));
        }
    });
    
    const months = Object.keys(dataByMonth).sort((a, b) => {
        const [mA, yA] = a.split('/');
        const [mB, yB] = b.split('/');
        return new Date(yA, mA - 1) - new Date(yB, mB - 1);
    });
    
    const saldos = [];
    let saldo = 0;
    months.forEach(m => {
        saldo += dataByMonth[m].entrada - dataByMonth[m].saida;
        saldos.push(saldo);
    });
    
    section.style.display = 'block';
    canvas.chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Saldo Acumulado',
                data: saldos,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Evolução do Saldo Acumulado' }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(2).replace('.', ',');
                        }
                    }
                }
            }
        }
    });
}

function showTopGastos() {
    const section = document.getElementById('top-gastos-section');
    const tbody = section?.querySelector('tbody');
    if (!tbody) return;
    
    const gastos = lancamentosFiltrados
        .filter(l => {
            const tipoRaw = l.entradaSaida || '';
            const tipoStr = String(tipoRaw).trim().toLowerCase();
            return tipoStr === 'saída' || tipoStr === 'saida';
        })
        .map(l => ({
            descricao: l.descricao,
            categoria: l.categoria || 'Outros',
            data: l.data,
            valor: Math.abs(Number(l.valor))
        }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5);
    
    tbody.innerHTML = '';
    gastos.forEach((g, i) => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = i + 1;
        row.insertCell(1).textContent = g.descricao;
        row.insertCell(2).textContent = g.categoria;
        row.insertCell(3).textContent = formatarData(g.data);
        const cellValor = row.insertCell(4);
        cellValor.textContent = formatarValor(-g.valor);
        cellValor.className = 'negative';
    });
    
    section.style.display = gastos.length > 0 ? 'block' : 'none';
}

function showComparativo() {
    const section = document.getElementById('comparativo-section');
    const grid = section?.querySelector('#comparativo-grid');
    if (!grid) return;
    
    const agora = new Date();
    const mesAtual = String(agora.getMonth() + 1).padStart(2, '0');
    const anoAtual = agora.getFullYear();
    const mesAnterior = String(agora.getMonth()).padStart(2, '0');
    const anoAnterior = mesAtual === '01' ? anoAtual - 1 : anoAtual;
    const mesAnteriorStr = mesAtual === '01' ? '12' : String(parseInt(mesAtual) - 1).padStart(2, '0');
    
    function getTotal(mes, ano, isEntrada) {
        return lancamentosCompletos
            .filter(l => {
                const d = new Date(l.data);
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const y = d.getFullYear().toString();
                if (m !== mes || y !== ano) return false;
                const tipoRaw = l.entradaSaida || '';
                const tipoStr = String(tipoRaw).trim().toLowerCase();
                const isSaida = tipoStr === 'saída' || tipoStr === 'saida';
                return isEntrada ? !isSaida : isSaida;
            })
            .reduce((sum, l) => sum + Math.abs(Number(l.valor)), 0);
    }
    
    const entradaAtual = getTotal(mesAtual, anoAtual.toString(), true);
    const saidaAtual = getTotal(mesAtual, anoAtual.toString(), false);
    const entradaAnterior = getTotal(mesAnteriorStr, anoAnterior.toString(), true);
    const saidaAnterior = getTotal(mesAnteriorStr, anoAnterior.toString(), false);
    
    const entradaDiff = entradaAtual - entradaAnterior;
    const saidaDiff = saidaAtual - saidaAnterior;
    
    const mesNome = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][parseInt(mesAtual) - 1];
    const mesAnteriorNome = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][parseInt(mesAnteriorStr) - 1];
    
    grid.innerHTML = `
        <div class="faturamento-item">
            <span class="label">Entradas ${mesNome}</span>
            <span class="value">${formatarValor(entradaAtual)}</span>
            <span class="diff ${entradaDiff >= 0 ? 'positive' : 'negative'}">${entradaDiff >= 0 ? '+' : ''}${formatarValor(entradaDiff)} vs ${mesAnteriorNome}</span>
        </div>
        <div class="faturamento-item">
            <span class="label">Saídas ${mesNome}</span>
            <span class="value">${formatarValor(saidaAtual)}</span>
            <span class="diff ${saidaDiff <= 0 ? 'positive' : 'negative'}">${saidaDiff >= 0 ? '+' : ''}${formatarValor(saidaDiff)} vs ${mesAnteriorNome}</span>
        </div>
    `;
    
    section.style.display = 'block';
}

function showResumoAnual() {
    const section = document.getElementById('resumo-anual-section');
    const tbody = section?.querySelector('tbody');
    if (!tbody) return;
    
    const ano = new Date().getFullYear();
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    const resumo = [];
    for (let i = 0; i < 12; i++) {
        const mes = String(i + 1).padStart(2, '0');
        let entrada = 0, saida = 0;
        
        lancamentosCompletos.forEach(l => {
            const d = new Date(l.data);
            if (d.getFullYear() === ano && String(d.getMonth() + 1).padStart(2, '0') === mes) {
                const tipoRaw = l.entradaSaida || '';
                const tipoStr = String(tipoRaw).trim().toLowerCase();
                const isSaida = tipoStr === 'saída' || tipoStr === 'saida';
                if (!isSaida) entrada += Number(l.valor);
                else saida += Math.abs(Number(l.valor));
            }
        });
        
        resumo.push({ mes: meses[i], entrada, saida, saldo: entrada - saida });
    }
    
    tbody.innerHTML = '';
    resumo.forEach(r => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = r.mes;
        const cellEnt = row.insertCell(1);
        cellEnt.textContent = formatarValor(r.entrada);
        cellEnt.className = 'positive';
        const cellSai = row.insertCell(2);
        cellSai.textContent = formatarValor(-r.saida);
        cellSai.className = 'negative';
        const cellSaldo = row.insertCell(3);
        cellSaldo.textContent = formatarValor(r.saldo);
        cellSaldo.className = r.saldo >= 0 ? 'positive' : 'negative';
    });
    
    section.style.display = 'block';
}
