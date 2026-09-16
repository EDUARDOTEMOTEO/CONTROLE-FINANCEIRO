// main.js - Fluxo Principal e Manipulação de Eventos
import { loadData, saveData } from './storage.js';
import { calcularBalancete, validarPartida, encerrarMesContabil } from './ledger.js';
import { fecharLivroAtual, reabrirLivro } from './fiscal.js';
import { parseExtrato } from './parsers.js';
import { renderUI, popularSelects, obterLancamentosExibicao } from './ui.js';

let state = {
  ...loadData(),
  livroSelecionadoId: 'atual'
};

document.addEventListener('DOMContentLoaded', () => {
  // Configuração inicial de data e selects
  const fieldData = document.getElementById('data');
  if (fieldData) fieldData.valueAsDate = new Date();

  popularSelects(state.contasCustomizadas || []);
  popularFiltroLivros();
  renderUI(state);

  // 1. FORMULÁRIO DE LANÇAMENTO CONTÁBIL
  const form = document.getElementById('ledger-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const orig = document.getElementById('conta-origem').value;
      const dest = document.getElementById('conta-destino').value;
      const selectTag = document.getElementById('lancamento-tag');
      const tagValor = selectTag ? selectTag.value : 'Operacional';

      const val = validarPartida(orig, dest);
      if (!val.valido) return alert(val.msg);

      const editId = document.getElementById('edit-id') ? document.getElementById('edit-id').value : '';

      if (editId) {
        // Modo Edição
        const item = state.lancamentos.find(l => l.id === parseInt(editId));
        if (item) {
          item.data = document.getElementById('data').value;
          item.descricao = document.getElementById('descricao').value;
          item.valor = parseFloat(document.getElementById('valor').value);
          item.origem = orig;
          item.destino = dest;
          item.tag = tagValor;
        }
        document.getElementById('edit-id').value = '';
      } else {
        // Novo Lançamento
        state.lancamentos.push({
          id: Date.now(),
          data: document.getElementById('data').value,
          descricao: document.getElementById('descricao').value,
          valor: parseFloat(document.getElementById('valor').value),
          origem: orig,
          destino: dest,
          tag: tagValor,
          conciliado: false
        });
      }

      saveData({ ...state, lancamentos: state.lancamentos });
      renderUI(state);
      form.reset();
      if (fieldData) fieldData.valueAsDate = new Date();
    });
  }

  // 2. BOTÃO DE FECHAMENTO / APURAÇÃO DO MÊS (ENCERRAR DRE)
  const btnFecharMes = document.getElementById('btn-fechar-mes');
  if (btnFecharMes) {
    btnFecharMes.addEventListener('click', () => {
      if (confirm('Deseja realmente encerrar o exercício deste mês? O resultado do DRE será apurado e transferido.')) {
        state = encerrarMesContabil(state);
        saveData(state);
        popularFiltroLivros();
        renderUI(state);
      }
    });
  }

  // 3. EVENTO DE FECHAR LIVRO FISCAL HISTÓRICO
  const btnFecharLivro = document.getElementById('btn-fechar-livro');
  if (btnFecharLivro) {
    btnFecharLivro.addEventListener('click', () => {
      try {
        const totais = calcularBalancete(state.lancamentos);
        fecharLivroAtual(state, totais);
        saveData(state);
        popularFiltroLivros();
        renderUI(state);
        alert("Livro Fiscal encerrado com sucesso!");
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // 4. FILTRO DE LIVROS FISCAIS
  const selectFiltro = document.getElementById('select-livro-filtro');
  if (selectFiltro) {
    selectFiltro.addEventListener('change', (e) => {
      state.livroSelecionadoId = e.target.value;
      renderUI(state);
    });
  }

  // 5. NAVEGAÇÃO ENTRE ABAS
  const navButtons = document.querySelectorAll('[data-target]');
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = e.currentTarget.getAttribute('data-target');
      
      document.querySelectorAll('.tab-content').forEach(sec => sec.style.display = 'none');
      document.querySelectorAll('[data-target]').forEach(b => b.classList.remove('active'));

      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.style.display = 'block';
        e.currentTarget.classList.add('active');
      }
    });
  });
});

// FUNÇÃO AUXILIAR PARA POPULAR O SELECT DE FILTROS
function popularFiltroLivros() {
  const select = document.getElementById('select-livro-filtro');
  if (!select) return;
  select.innerHTML = '<option value="atual">Livro Fiscal Ativo (Em Aberto)</option>';
  
  if (state.livrosFiscais && Array.isArray(state.livrosFiscais)) {
    state.livrosFiscais.forEach((l, idx) => {
      select.add(new Option(`Livro Fiscal #${state.livrosFiscais.length - idx} (${l.dataFechamento})`, l.id));
    });
  }
  
  select.value = state.livroSelecionadoId;
}
