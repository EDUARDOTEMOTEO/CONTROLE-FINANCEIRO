import os
import dash
from dash import dcc, html
import pandas as pd
import plotly.express as px

app = dash.Dash(__name__)

def carregar_dados():
    # Tenta carregar dados de um CSV ou gera estrutura padrão se não existir
    if os.path.exists("lancamentos.csv"):
        df = pd.read_csv("lancamentos.csv", sep=";")
    else:
        df = pd.DataFrame(columns=["Data", "Descrição", "Categoria", "Tipo", "Valor (R$)", "Despesas"])
    
    df["Valor (R$)"] = pd.to_numeric(df["Valor (R$)"], errors="coerce").fillna(0)
    df["Despesas"] = pd.to_numeric(df["Despesas"], errors="coerce").fillna(0)
    df["Data"] = pd.to_datetime(df["Data"], errors="coerce")
    return df

df = carregar_dados()

# Gera gráficos apenas se houver dados disponíveis
if not df.empty:
    df_saida = df[df["Tipo"].str.lower().isin(["saída", "saida"])] if "Tipo" in df.columns else pd.DataFrame()
    grafico_barra = px.bar(df_saida, x="Categoria", y="Despesas", title="💸 Despesas por Categoria") if not df_saida.empty else px.bar(title="Sem dados de despesa")
    grafico_linha = px.line(df, x="Data", y="Valor (R$)", color="Tipo", markers=True, title="📅 Fluxo Financeiro")
    grafico_pizza = px.pie(df, names="Tipo", values="Valor (R$)", title="🥧 Entradas vs Saídas")
else:
    grafico_barra = px.bar(title="Nenhum dado cadastrado")
    grafico_linha = px.line(title="Nenhum dado cadastrado")
    grafico_pizza = px.pie(title="Nenhum dado cadastrado")

app.layout = html.Div([
    html.H1("📊 Painel Financeiro"),
    dcc.Graph(figure=grafico_barra),
    dcc.Graph(figure=grafico_linha),
    dcc.Graph(figure=grafico_pizza)
])

if __name__ == "__main__":
    app.run_server(debug=True)
