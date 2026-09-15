import { loadData, saveData } from './storage.js';
import { calcularBalancete, validarPartida } from './ledger.js';
import { fecharLivroAtual, reabrirLivro } from './fiscal.js';
import { parseExtrato } from './parsers.js';
import { renderUI, popularSelects, obterLancamentosExibicao } from './ui.js';

const state = {
  ...loadData(),
  livroSelecionadoId: 'atual'
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('data').valueAsDate = new Date();
  popularSelects(state.contasCustomizadas);
  popularFiltroLivros();
  renderUI(state);

  // Form Lançamento
  document.getElementById('ledger-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const orig = document.getElementById('conta-origem').value;
    const dest = document.getElementById('conta-destino').value;

    const val = validarPartida(orig, dest);
    if (!val.valido) return alert(val.msg);

    const editId = document.getElementById('edit-id').value;
    if (editId) {
      const item = state.lancamentos.find(l => l.id === parseInt(editId));
      if (item) {
        item.data = document.getElementById('data').value;
        item.descricao = document.getElementById('descricao').value;
        item.valor = parseFloat(document.getElementById('valor').value);
        item.origem = orig;
        item.destino = dest;
      }
    } else {
      state.lancamentos.push({
        id: Date.now(),
        data: document.getElementById('data').value,
        descricao: document.getElementById('descricao').value,
        valor: parseFloat(document.getElementById('valor').value),
        origem: orig,
        destino: dest,
        conciliado: false
      });
    }

    saveData({ lancamentos: state.lancamentos });
    renderUI(state);
    document.getElementById('ledger-form').reset();
  });

  // Evento Fechar Livro
  document.getElementById('btn-fechar-livro').addEventListener('click', () => {
    try {
      const totais = calcularBalancete(state.lancamentos);
      fecharLivroAtual(state, totais);
      popularFiltroLivros();
      renderUI(state);
      alert("Livro Fiscal encerrado com sucesso!");
    } catch (err) {
      alert(err.message);
    }
  });
});

// main.js - Adicione dentro do listener DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Inicialização básica
  popularSelects(state.contasCustomizadas);
  popularFiltroLivros();
  renderUI(state);

  // Lógica de Navegação entre Abas/Janelas
  const navButtons = document.querySelectorAll('[data-target]');
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = e.currentTarget.getAttribute('data-target');
      
      // Oculta todas as seções e remove classe ativa dos botões
      document.querySelectorAll('.tab-content').forEach(sec => sec.style.display = 'none');
      document.querySelectorAll('[data-target]').forEach(b => b.classList.remove('active'));

      // Exibe a seção selecionada
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.style.display = 'block';
        e.currentTarget.classList.add('active');
      }
    });
  });
  
function popularFiltroLivros() {
  const select = document.getElementById('select-livro-filtro');
  if (!select) return;
  select.innerHTML = '<option value="atual">Livro Fiscal Ativo (Em Aberto)</option>';
  state.livrosFiscais.forEach((l, idx) => {
    select.add(new Option(`Livro Fiscal #${state.livrosFiscais.length - idx} (${l.dataFechamento})`, l.id));
  });
  select.value = state.livroSelecionadoId;
}
