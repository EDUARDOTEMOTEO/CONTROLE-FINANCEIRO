// ui.js - Renderização Completa com Indicadores e Tags
import { calcularBalancete, encerrarMesContabil } from './ledger.js';

let chartDespesasInstance = null;
let chartBalancoInstance = null;
let chartFluxoInstance = null;
let chartTagsInstance = null;

function formatarMoedaContabil(valor) {
  const absVal = Math.abs(valor).toFixed(2).replace('.', ',');
  return valor < 0 ? `(R$ ${absVal})` : `R$ ${absVal}`;
}

export function renderUI(state) {
  const ex = obterLancamentosExibicao(state);
  const isReadonly = state.livroSelecionadoId !== 'atual';
  
  // Balancete & Indicadores
  const totais = calcularBalancete(ex);
  
  // Cards Superiores
  document.getElementById('total-assets').textContent = formatarMoedaContabil(totais.assets);
  document.getElementById('total-liabilities').textContent = `R$ ${Math.abs(totais.liabilities).toFixed(2).replace('.', ',')}`;
  document.getElementById('total-income').textContent = `R$ ${Math.abs(totais.income).toFixed(2).replace('.', ',')}`;
  document.getElementById('total-expenses').textContent = `R$ ${Math.abs(totais.expenses).toFixed(2).replace('.', ',')}`;
  
  const dreEl = document.getElementById('total-dre');
  dreEl.textContent = formatarMoedaContabil(totais.dre);
  dreEl.style.color = totais.dre >= 0 ? '#10b981' : '#ef4444';

  // Atualiza Cards de Indicadores Financeiros
  const elLiq = document.getElementById('ind-liquidez');
  if (elLiq) elLiq.textContent = totais.indicadores.liquidezCorrente;

  const elMarg = document.getElementById('ind-margem');
  if (elMarg) elMarg.textContent = totais.indicadores.margemLiquida;

  const elBreak = document.getElementById('ind-breakeven');
  if (elBreak) elBreak.textContent = `R$ ${totais.indicadores.breakEven.toFixed(2).replace('.', ',')}`;

  // Tabela de Lançamentos com Badge de Tags
  const tbody = document.getElementById('tabela-corpo');
  if (tbody) {
    tbody.innerHTML = '';
    ex.forEach(l => {
      const tagNome = l.tag || 'Operacional';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${l.data}</td>
        <td>${l.descricao} <span style="font-size:0.75rem; background:#e2e8f0; color:#475569; padding:2px 6px; border-radius:10px; margin-left:4px;">#${tagNome}</span></td>
        <td><span style="background:#fee2e2; color:#991b1b; padding:3px 6px; border-radius:4px; font-size:0.8rem;">${l.origem}</span></td>
        <td><span style="background:#dcfce7; color:#166534; padding:3px 6px; border-radius:4px; font-size:0.8rem;">${l.destino}</span></td>
        <td><strong>R$ ${parseFloat(l.valor).toFixed(2).replace('.', ',')}</strong></td>
        <td>${l.conciliado ? '<span class="badge-reconciled">Conciliado ✓</span>' : '<span class="badge-pending">Pendente</span>'}</td>
        <td>
          ${!isReadonly ? `<button data-action="editar" data-id="${l.id}" style="background:#3b82f6; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;"><i class="fas fa-edit"></i></button>` : ''}
          ${!isReadonly ? `<button data-action="excluir" data-id="${l.id}" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;"><i class="fas fa-trash"></i></button>` : ''}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Renderizar Gráficos
  renderizarGraficos(ex, totais);
}

export function renderizarGraficos(lancamentosExibicao, totais) {
  if (typeof Chart === 'undefined') return;

  // 1. Gráfico Rosca: Despesas por Conta
  const catDespesas = {};
  // 4. Gráfico Rosca: Despesas por Centro de Custo / Tag
  const tagDespesas = {};

  lancamentosExibicao.forEach(l => {
    if (l.destino.startsWith('Despesas')) {
      const val = parseFloat(l.valor);
      catDespesas[l.destino] = (catDespesas[l.destino] || 0) + val;
      
      const tag = l.tag || 'Operacional';
      tagDespesas[tag] = (tagDespesas[tag] || 0) + val;
    }
  });

  const canvasDespesas = document.getElementById('chartDespesas');
  if (canvasDespesas) {
    if (chartDespesasInstance) chartDespesasInstance.destroy();
    chartDespesasInstance = new Chart(canvasDespesas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(catDespesas),
        datasets: [{ data: Object.values(catDespesas), backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'] }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }

  // 2. Gráfico Balanço Patrimonial
  const canvasBalanco = document.getElementById('chartBalanco');
  if (canvasBalanco) {
    if (chartBalancoInstance) chartBalancoInstance.destroy();
    chartBalancoInstance = new Chart(canvasBalanco.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Ativos', 'Passivos'],
        datasets: [{ label: 'Total (R$)', data: [Math.abs(totais.assets), Math.abs(totais.liabilities)], backgroundColor: ['#10b981', '#ef4444'] }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }

  // 3. Gráfico de Fluxo de Caixa Diário
  const agrupadoPorDia = {};
  lancamentosExibicao.forEach(l => {
    const dia = l.data; 
    if (!agrupadoPorDia[dia]) agrupadoPorDia[dia] = { receita: 0, despesa: 0 };

    const val = parseFloat(l.valor) || 0;
    if (l.origem.startsWith('Receitas')) agrupadoPorDia[dia].receita += val;
    if (l.destino.startsWith('Despesas')) agrupadoPorDia[dia].despesa += val;
  });

  const diasOrdenados = Object.keys(agrupadoPorDia).sort();
  const canvasFluxo = document.getElementById('chartFluxoCaixa');
  if (canvasFluxo) {
    if (chartFluxoInstance) chartFluxoInstance.destroy();
    chartFluxoInstance = new Chart(canvasFluxo.getContext('2d'), {
      type: 'line',
      data: {
        labels: diasOrdenados,
        datasets: [
          { label: 'Receitas (R$)', data: diasOrdenados.map(d => agrupadoPorDia[d].receita), borderColor: '#10b981', fill: false, tension: 0.3 },
          { label: 'Despesas (R$)', data: diasOrdenados.map(d => agrupadoPorDia[d].despesa), borderColor: '#ef4444', fill: false, tension: 0.3 }
        ]
      },
      options: { responsive: true }
    });
  }

  // 4. Gráfico por Centro de Custo (Tags)
  const canvasTags = document.getElementById('chartTags');
  if (canvasTags) {
    if (chartTagsInstance) chartTagsInstance.destroy();
    chartTagsInstance = new Chart(canvasTags.getContext('2d'), {
      type: 'pie',
      data: {
        labels: Object.keys(tagDespesas),
        datasets: [{ data: Object.values(tagDespesas), backgroundColor: ['#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b'] }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }
}

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
