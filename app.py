import dash
from dash import dcc, html
import pandas as pd
import plotly.express as px

# Lê a tabela
df = pd.read_html("tabela.html")[0]

# Limpeza
df["Valor (R$)"] = pd.to_numeric(df["Valor (R$)"], errors="coerce")
df["Despesas"] = pd.to_numeric(df["Despesas"], errors="coerce")
df["Data"] = pd.to_datetime(df["Data"], errors="coerce")
df = df.dropna(subset=["Data", "Tipo", "Valor (R$)", "Despesas", "Categoria"])

# Gráficos 📊
grafico_barra = px.bar(
    df[df["Tipo"].str.lower().isin(["saída", "saida"])].groupby("Categoria").sum().reset_index(),
    x="Categoria", y="Despesas", title="💸 Despesas por Categoria"
)

grafico_linha = px.line(
    df.groupby(["Data", "Tipo"]).sum().reset_index(),
    x="Data", y="Valor (R$)", color="Tipo", markers=True,
    title="📅 Fluxo Financeiro ao Longo do Tempo"
)

grafico_pizza = px.pie(df, names="Tipo", values="Valor (R$)", title="🥧 Entradas vs Saídas")

# Sugestão automática 🔍
gasto_por_categoria = df[df["Tipo"].str.lower().isin(["saída", "saida"])].groupby("Categoria")["Valor (R$)"].sum()
categoria_top = gasto_por_categoria.idxmax()
valor_top = gasto_por_categoria.max()
sugestao = f"🔔 Sua maior despesa está em '{categoria_top}', com R$ {valor_top:.2f}. Que tal definir um limite mensal?"

# Resumo mensal 📆
df["Mês"] = df["Data"].dt.to_period("M").astype(str)
resumo = df.groupby(["Mês", "Tipo"]).agg({"Valor (R$)": "sum"}).unstack(fill_value=0)
resumo.columns = resumo.columns.droplevel()
resumo["Saldo"] = resumo.get("Entrada", 0) - resumo.get("Saída", 0)
tabela_resumo = html.Table([
    html.Thead(html.Tr([html.Th(col) for col in resumo.reset_index().columns])),
    html.Tbody([
        html.Tr([html.Td(val) for val in row])
        for row in resumo.reset_index().values
    ])
])

# Layout 🖼️
app = dash.Dash(__name__)
app.layout = html.Div([
    html.H1("📊 Painel Financeiro"),
    html.P(sugestao),
    dcc.Graph(figure=grafico_barra),
    dcc.Graph(figure=grafico_linha),
    dcc.Graph(figure=grafico_pizza),
    html.H2("📋 Resumo Mensal"),
    tabela_resumo
])

if __name__ == "__main__":
    app.run_server(debug=True)
