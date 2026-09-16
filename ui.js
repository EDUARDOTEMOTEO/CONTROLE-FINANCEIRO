import { calcularBalancete } from './ledger.js';

let chartDespesasInstance = null;
let chartBalancoInstance = null;
let chartFluxoInstance = null;

// ==========================================
// 1. FUNÇÕES AUXILIARES DE FORMATAÇÃO
// ==========================================

// Formatação Contábil: Negativos viram (R$ X,XX)
function formatarMoedaContabil(valor) {
  const absVal = Math.abs(valor).toFixed(2).replace('.', ',');
  if (valor < 0) {
    return `(R$ ${absVal})`;
  }
  return `R$ ${absVal}`;
}

// ==========================================
// 2. RENDERIZAÇÃO DA INTERFACE PRINCIPAL
// ==========================================

export function renderUI(state) {
  const ex = obterLancamentosExibicao(state);
  const isReadonly = state.livroSelecionadoId !== 'atual';
  
  // Atualiza Balancete com Regras Contábeis
  const totais = calcularBalancete(ex);
  
  // Ativos e DRE usam notação contábil para saldos devedores/negativos
  document.getElementById('total-assets').textContent = formatarMoedaContabil(totais.assets);
  
  // Passivos, Receitas e Despesas são exibidos como módulos positivos simples
  document.getElementById('total-liabilities').textContent = `R$ ${Math.abs(totais.liabilities).toFixed(2).replace('.', ',')}`;
  document.getElementById('total-income').textContent = `R$ ${Math.abs(totais.income).toFixed(2).replace('.', ',')}`;
  document.getElementById('total-expenses').textContent = `R$ ${Math.abs(totais.expenses).toFixed(2).replace('.', ',')}`;
  
  // Card do DRE (Resultado Líquido)
  const dreEl = document.getElementById('total-dre');
  dreEl.textContent = formatarMoedaContabil(totais.dre);
  dreEl.style.color = totais.dre >= 0 ? '#10b981' : '#ef4444';

  // Atualiza Formulário conforme Trava
  const formBox = document.getElementById('form-container-box');
  const statusLabel = document.getElementById('label-livro-status');
  if (isReadonly) {
    formBox.style.opacity = '0.5';
    formBox.style.pointerEvents = 'none';
    document.getElementById('form-title').innerHTML = `<i class="fas fa-lock" style="color:#ef4444;"></i> Modo de Leitura`;
    statusLabel.innerHTML = `<span class="badge-pending" style="background:#fee2e2; color:#991b1b;">MODO DE LEITURA</span>`;
  } else {
    formBox.style.opacity = '1';
    formBox.style.pointerEvents = 'all';
    document.getElementById('form-title').innerHTML = `<i class="fas fa-plus-circle"></i> Novo Lançamento Contábil`;
    statusLabel.innerHTML = `<span class="badge-reconciled">EM ABERTO</span>`;
  }

  // Renderiza Tabela
  const tbody = document.getElementById('tabela-corpo');
  tbody.innerHTML = '';
  ex.forEach(l => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${l.data}</td>
      <td>${l.descricao}</td>
      <td><span style="background:#fee2e2; color:#991b1b; padding:3px 6px; border-radius:4px; font-size:0.8rem;">${l.origem}</span></td>
      <td><span style="background:#dcfce7; color:#166534; padding:3px 6px; border-radius:4px; font-size:0.8rem;">${l.destino}</span></td>
      <td><strong>R$ ${l.valor.toFixed(2).replace('.', ',')}</strong></td>
      <td>${l.conciliado ? '<span class="badge-reconciled">Conciliado ✓</span>' : '<span class="badge-pending">Pendente</span>'}</td>
      <td>
        ${!isReadonly ? `<button data-action="editar" data-id="${l.id}" style="background:#3b82f6; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;"><i class="fas fa-edit"></i></button>` : ''}
        ${!isReadonly ? `<button data-action="excluir" data-id="${l.id}" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;"><i class="fas fa-trash"></i></button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Atualiza todos os gráficos
  renderizarGraficos(ex, totais);
}

// ==========================================
// 3. RENDERIZAÇÃO DOS GRÁFICOS (CHART.JS)
// ==========================================

export function renderizarGraficos(lancamentosExibicao, totais) {
  if (typeof Chart === 'undefined') return;

  // --- Gráfico 1: Distribuição de Despesas ---
  const catDespesas = {};
  lancamentosExibicao.forEach(l => {
    if (l.destino.startsWith('Despesas')) {
      catDespesas[l.destino] = (catDespesas[l.destino] || 0) + l.valor;
    }
  });

  const canvasDespesas = document.getElementById('chartDespesas');
  if (canvasDespesas) {
    if (chartDespesasInstance) chartDespesasInstance.destroy();
    chartDespesasInstance = new Chart(canvasDespesas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(catDespesas),
        datasets: [{
          data: Object.values(catDespesas),
          backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }

  // --- Gráfico 2: Balanço Patrimonial ---
  const canvasBalanco = document.getElementById('chartBalanco');
  if (canvasBalanco) {
    if (chartBalancoInstance) chartBalancoInstance.destroy();
    chartBalancoInstance = new Chart(canvasBalanco.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Ativos', 'Passivos'],
        datasets: [{
          label: 'Total (R$)',
          data: [Math.abs(totais.assets), Math.abs(totais.liabilities)],
          backgroundColor: ['#10b981', '#ef4444']
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }

  // --- Gráfico 3: Projeção de Fluxo de Caixa Diário ---
  const agrupadoPorDia = {};
  lancamentosExibicao.forEach(l => {
    const dia = l.data;
    if (!agrupadoPorDia[dia]) {
      agrupadoPorDia[dia] = { receita: 0, despesa: 0 };
    }

    if (l.origem.startsWith('Receitas')) {
      agrupadoPorDia[dia].receita += l.valor;
    }
    if (l.destino.startsWith('Despesas')) {
      agrupadoPorDia[dia].despesa += l.valor;
    }
  });

  const diasOrdenados = Object.keys(agrupadoPorDia).sort();
  const arrayReceitas = diasOrdenados.map(d => agrupadoPorDia[d].receita);
  const arrayDespesas = diasOrdenados.map(d => agrupadoPorDia[d].despesa);

  const canvasFluxo = document.getElementById('chartFluxoCaixa');
  if (canvasFluxo) {
    if (chartFluxoInstance) chartFluxoInstance.destroy();
    chartFluxoInstance = new Chart(canvasFluxo.getContext('2d'), {
      type: 'line',
      data: {
        labels: diasOrdenados,
        datasets: [
          {
            label: 'Receitas (R$)',
            data: arrayReceitas,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Despesas (R$)',
            data: arrayDespesas,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) { return 'R$ ' + value; }
            }
          }
        }
      }
    });
  }
}

// ==========================================
// 4. MÉTODOS AUXILIARES EXPORTADOS
// ==========================================

export function obterLancamentosExibicao(state) {
  if (state.livroSelecionadoId === 'atual') return state.lancamentos;
  const livro = state.livrosFiscais.find(l => l.id === parseInt(state.livroSelecionadoId));
  return livro ? livro.registros : [];
}

export function popularSelects(contas) {
  const orig = document.getElementById('conta-origem');
  const dest = document.getElementById('conta-destino');
  if (!orig || !dest) return;
  orig.innerHTML = ''; dest.innerHTML = '';
  contas.forEach(c => {
    orig.add(new Option(c.nome, c.nome));
    dest.add(new Option(c.nome, c.nome));
  });
}
