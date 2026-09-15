import { saveData } from './storage.js';

export function fecharLivroAtual(state, totais) {
  const pendentes = state.lancamentos.filter(l => !l.conciliado);
  if (pendentes.length > 0) {
    throw new Error(`BLOQUEIO FISCAL: Existem ${pendentes.length} lançamento(s) pendentes de conciliação bancária.`);
  }

  if (state.lancamentos.length === 0) {
    throw new Error("Não existem lançamentos a serem encerrados neste livro fiscal.");
  }

  const novoLivro = {
    id: Date.now(),
    dataFechamento: new Date().toLocaleString('pt-BR'),
    status: 'FECHADO',
    qtdLancamentos: state.lancamentos.length,
    totalAtivos: `R$ ${totais.assets.toFixed(2).replace('.', ',')}`,
    totalPassivos: `R$ ${totais.liabilities.toFixed(2).replace('.', ',')}`,
    resultadoDRE: `R$ ${totais.dre.toFixed(2).replace('.', ',')}`,
    registros: JSON.parse(JSON.stringify(state.lancamentos))
  };

  state.livrosFiscais.unshift(novoLivro);
  state.lancamentos = [];

  saveData({ lancamentos: state.lancamentos, livrosFiscais: state.livrosFiscais });
  return novoLivro;
}

export function reabrirLivro(state, id) {
  const index = state.livrosFiscais.findIndex(l => l.id === id);
  if (index === -1) return false;

  const livro = state.livrosFiscais[index];
  state.lancamentos = [...livro.registros, ...state.lancamentos];
  state.livrosFiscais.splice(index, 1);

  saveData({ lancamentos: state.lancamentos, livrosFiscais: state.livrosFiscais });
  return true;
}
export function fecharLivroAtual(state, totais) {
  const confirmacao = confirm("Tem certeza que deseja encerrar o Livro Fiscal ativo? Os lançamentos serão travados em modo de leitura.");
  if (!confirmacao) return null;

  // Lógica de encerramento existente...
}
