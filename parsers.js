export function parseExtrato(content, fileName) {
  const lancamentos = [];

  if (fileName.toLowerCase().endsWith('.ofx')) {
    const regex = /<TRNTYPE>(.*?)[\s\S]*?<DTPOSTED>(\d{8})[\s\S]*?<TRNAMT>([\d.-]+)[\s\S]*?<MEMO>(.*?)\n/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const rawAmt = parseFloat(match[3]);
      const rawDate = match[2];
      lancamentos.push({
        id: Date.now() + Math.random(),
        data: `${rawDate.substring(0,4)}-${rawDate.substring(4,6)}-${rawDate.substring(6,8)}`,
        descricao: match[4].trim() || "Importado OFX",
        valor: Math.abs(rawAmt),
        origem: rawAmt < 0 ? 'Ativos:Banco:ContaCorrente' : 'Receitas:ServicosPrestados',
        destino: rawAmt < 0 ? 'Despesas:TarifasBancarias' : 'Ativos:Banco:ContaCorrente',
        conciliado: false,
        conciliadoCom: null
      });
    }
  } else {
    const lines = content.split('\n');
    lines.forEach(line => {
      const parts = line.split(',');
      if (parts.length >= 3 && !isNaN(parseFloat(parts[2]))) {
        lancamentos.push({
          id: Date.now() + Math.random(),
          data: parts[0].trim(),
          descricao: parts[1].trim(),
          valor: Math.abs(parseFloat(parts[2])),
          origem: 'Ativos:Banco:ContaCorrente',
          destino: 'Despesas:Alimentacao:Supermercado',
          conciliado: false,
          conciliadoCom: null
        });
      }
    });
  }

  return lancamentos;
}
