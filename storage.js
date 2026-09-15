const KEYS = {
  LANÇAMENTOS: 'partidas_dobradas',
  LIVROS: 'livros_fiscais',
  CONTAS: 'contas_custom'
};

export const defaultContas = [
  { grupo: 'Ativos', nome: 'Ativos:Caixa' },
  { grupo: 'Ativos', nome: 'Ativos:Banco:ContaCorrente' },
  { grupo: 'Ativos', nome: 'Ativos:Investimentos:CDB' },
  { grupo: 'Passivos', nome: 'Passivos:CartaoCredito' },
  { grupo: 'Passivos', nome: 'Passivos:Emprestimos' },
  { grupo: 'Receitas', nome: 'Receitas:Salario' },
  { grupo: 'Receitas', nome: 'Receitas:ServicosPrestados' },
  { grupo: 'Despesas', nome: 'Despesas:Alimentacao:Supermercado' },
  { grupo: 'Despesas', nome: 'Despesas:Moradia:Aluguel' },
  { grupo: 'Despesas', nome: 'Despesas:Automovel:Combustivel' }
];

export function loadData() {
  return {
    lancamentos: JSON.parse(localStorage.getItem(KEYS.LANÇAMENTOS)) || [],
    livrosFiscais: JSON.parse(localStorage.getItem(KEYS.LIVROS)) || [],
    contasCustomizadas: JSON.parse(localStorage.getItem(KEYS.CONTAS)) || defaultContas
  };
}

export function saveData(data) {
  if (data.lancamentos !== undefined) localStorage.setItem(KEYS.LANÇAMENTOS, JSON.stringify(data.lancamentos));
  if (data.livrosFiscais !== undefined) localStorage.setItem(KEYS.LIVROS, JSON.stringify(data.livrosFiscais));
  if (data.contasCustomizadas !== undefined) localStorage.setItem(KEYS.CONTAS, JSON.stringify(data.contasCustomizadas));
}
