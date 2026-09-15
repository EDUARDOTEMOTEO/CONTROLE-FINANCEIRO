export function calcularBalancete(lancamentos) {
  let assets = 0, liabilities = 0, income = 0, expenses = 0;

  lancamentos.forEach(l => {
    if (l.destino.startsWith('Ativos')) assets += l.valor;
    if (l.origem.startsWith('Ativos')) assets -= l.valor;
    if (l.destino.startsWith('Passivos')) liabilities -= l.valor;
    if (l.origem.startsWith('Passivos')) liabilities += l.valor;
    if (l.origem.startsWith('Receitas')) income += l.valor;
    if (l.destino.startsWith('Despesas')) expenses += l.valor;
  });

  return { assets, liabilities, income, expenses, dre: income - expenses };
}

export function validarPartida(origem, destino) {
  if (!origem || !destino) return { valido: false, msg: "Preencha as contas de origem e destino." };
  if (origem === destino) return { valido: false, msg: "A conta de Origem e Destino não podem ser a mesma!" };
  return { valido: true };
}
