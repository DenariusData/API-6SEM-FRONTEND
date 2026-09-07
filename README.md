# API-6SEM-FRONTEND

Frontend do **AkaVision** — Classificador de Documentos Técnicos, projeto integrado Fatec SJC × AKAER.

## Stack

- **Framework:** Vue
- **Build tool:** Vite (a confirmar)

## Como rodar localmente

```bash
# 1. Clone o repositório (ou entre na pasta, se já estiver como submódulo do API-6SEM)
git clone https://github.com/DenariusData/API-6SEM-FRONTEND.git
cd API-6SEM-FRONTEND

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# edite o .env com a URL do backend local

# 4. Rode em modo desenvolvimento
npm run dev

# 5. Build de produção
npm run build
```

## Fluxo de contribuição

1. Crie uma branch a partir de `develop`: `feature/nome-da-tarefa`
2. Commits e título do PR seguem [Conventional Commits](https://www.conventionalcommits.org), em inglês: `feat:`, `fix:`, `docs:`, `chore:`, `test:`
3. Abra o PR contra `develop` — exige 1 aprovação, CI verde e título validado
4. Merge sempre via **Squash and merge**

## CI

O workflow `Frontend CI` roda em todo PR/push para `main` e `develop`: instala dependências e executa o build.

## Links

- Repositório agregador: [API-6SEM](https://github.com/DenariusData/API-6SEM)
- Backend: [API-6SEM-BACKEND](https://github.com/DenariusData/API-6SEM-BACKEND)
