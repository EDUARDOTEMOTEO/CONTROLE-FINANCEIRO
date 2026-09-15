import { calcularBalancete } from './ledger.js';

let chartDespesasInstance = null;
let chartBalancoInstance = null;

export function renderUI(state) {
  const ex = obterLancamentosExibicao(state);
  const isReadonly = state.livroSelecionadoId !== 'atual';
  
  // Atualiza Balancete
  const totais = calcularBalancete(ex);
  document.getElementById('total-assets').textContent = `R$ ${totais.assets.toFixed(2).replace('.', ',')}`;
  document.getElementById('total-liabilities').textContent = `R$ ${totais.liabilities.toFixed(2).replace('.', ',')}`;
  document.getElementById('total-income').textContent = `R$ ${totais.income.toFixed(2).replace('.', ',')}`;
  document.getElementById('total-expenses').textContent = `R$ ${totais.expenses.toFixed(2).replace('.', ',')}`;
  document.getElementById('total-dre').textContent = `R$ ${totais.dre.toFixed(2).replace('.', ',')}`;
  document.getElementById('total-dre').style.color = totais.dre >= 0 ? '#10b981' : '#ef4444';

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
}

export function obterLancamentosExibicao(state) {
  if (state.livroSelecionadoId === 'atual') return state.lancamentos;
  const livro = state.livrosFiscais.find(l => l.id === parseInt(state.livroSelecionadoId));
  return livro ? livro.registros : [];
}

export function popularSelects(contas) {
  const orig = document.getElementById('conta-origem');
  const dest = document.getElementById('conta-destino');
  orig.innerHTML = ''; dest.innerHTML = '';
  contas.forEach(c => {
    orig.add(new Option(c.nome, c.nome));
    dest.add(new Option(c.nome, c.nome));
  });
}
