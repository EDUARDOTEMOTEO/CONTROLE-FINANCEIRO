// ledger.js - Regras Contábeis, DRE e Fechamento

export function calcularBalancete(lancamentos) {
  let assets = 0;
  let liabilities = 0;
  let income = 0;
  let expenses = 0;
  let despesasFixas = 0;

  lancamentos.forEach(l => {
    const valor = parseFloat(l.valor) || 0;

    // ATIVOS
    if (l.destino.startsWith('Ativos')) assets += valor;
    if (l.origem.startsWith('Ativos')) assets -= valor;

    // PASSIVOS
    if (l.origem.startsWith('Passivos')) liabilities += valor;
    if (l.destino.startsWith('Passivos')) liabilities -= valor;

    // RECEITAS
    if (l.origem.startsWith('Receitas')) income += valor;
    if (l.destino.startsWith('Receitas')) income -= valor;

    // DESPESAS
    if (l.destino.startsWith('Despesas')) {
      expenses += valor;
      if (l.tag === 'Fixa') despesasFixas += valor;
    }
    if (l.origem.startsWith('Despesas')) expenses -= valor;
  });

  // DRE = Receitas - Despesas
  const dre = income - expenses;

  // 1. INDICADORES FINANCEIROS
  const liquidezCorrente = liabilities > 0 ? (assets / liabilities).toFixed(2) : (assets > 0 ? 'Excelente (Sem Dívidas)' : '0.00');
  const margemLiquida = income > 0 ? ((dre / income) * 100).toFixed(1) + '%' : '0.0%';
  
  // Ponto de Equilíbrio Estimado (Despesas Fixas)
  const breakEven = despesasFixas > 0 ? despesasFixas : expenses;

  return {
    assets,
    liabilities,
    income,
    expenses,
    dre,
    indicadores: {
      liquidezCorrente,
      margemLiquida,
      breakEven
    }
  };
}

// 2. FECHAMENTO AUTOMÁTICO DO MÊS
export function encerrarMesContabil(state) {
  const lancamentos = state.lancamentos;
  const totais = calcularBalancete(lancamentos);

  if (lancamentos.length === 0) {
    alert('Não há lançamentos no livro atual para encerrar.');
    return state;
  }

  const dataHoje = new Date().toISOString().split('T')[0];
  const proximoId = state.livrosFiscais.length + 1;

  // Cria um livro fiscal fechado contendo o histórico
  const novoLivroFechado = {
    id: proximoId,
    nome: `Livro Fechado - Apuração DRE (${dataHoje})`,
    dataFechamento: dataHoje,
    resultadoDRE: totais.dre,
    registros: [...lancamentos]
  };

  // Saldo Inicial transportado para o novo mês (Lucros Acumulados no Passivo Patrimonial)
  const lancamentoTransporte = [
    {
      id: Date.now(),
      data: dataHoje,
      descricao: 'Encerramento de Exercício - Saldo Inicial de Lucros/Prejuízos Acumulados',
      origem: totais.dre >= 0 ? 'Passivos:PatrimonioLiquido' : 'Ativos:Caixa',
      destino: totais.dre >= 0 ? 'Ativos:Caixa' : 'Passivos:PatrimonioLiquido',
      valor: Math.abs(totais.dre),
      tag: 'Operacional',
      conciliado: true
    }
  ];

  alert(`Mês encerrado com sucesso!\nResultado Apurado: R$ ${totais.dre.toFixed(2)}\nO saldo patrimonial foi transportado.`);

  return {
    ...state,
    livrosFiscais: [...state.livrosFiscais, novoLivroFechado],
    lancamentos: lancamentoTransporte // Reseta o livro ativo deixando só o saldo balanço
  };
}
