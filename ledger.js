// ledger.js - Regras Contábeis e Apuração

export function calcularBalancete(lancamentos) {
  let assets = 0;
  let liabilities = 0;
  let income = 0;
  let expenses = 0;

  lancamentos.forEach(l => {
    const valor = parseFloat(l.valor) || 0;

    // ATIVOS (+ Débito no Destino, - Crédito na Origem)
    if (l.destino.startsWith('Ativos')) assets += valor;
    if (l.origem.startsWith('Ativos')) assets -= valor;

    // PASSIVOS (+ Crédito na Origem, - Débito no Destino)
    if (l.origem.startsWith('Passivos')) liabilities += valor;
    if (l.destino.startsWith('Passivos')) liabilities -= valor;

    // RECEITAS (+ Crédito na Origem, - Débito no Destino)
    if (l.origem.startsWith('Receitas')) income += valor;
    if (l.destino.startsWith('Receitas')) income -= valor;

    // DESPESAS (+ Débito no Destino, - Crédito na Origem)
    if (l.destino.startsWith('Despesas')) expenses += valor;
    if (l.origem.startsWith('Despesas')) expenses -= valor;
  });

  // DRE = Receitas - Despesas
  const dre = income - expenses;

  // Indicadores Financeiros (Melhoria 1)
  const liquidezCorrente = liabilities > 0 ? (assets / liabilities).toFixed(2) : 'N/A';
  const margemLiquida = income > 0 ? ((dre / income) * 100).toFixed(1) + '%' : '0%';

  return {
    assets,
    liabilities,
    income,
    expenses,
    dre,
    indicadores: {
      liquidezCorrente,
      margemLiquida
    }
  };
}
