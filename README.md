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

1. Instale os hooks uma vez por clone (validam nome da branch, mensagem de commit e lint):
   ```bash
   pip install pre-commit
   pre-commit install --hook-type pre-commit --hook-type commit-msg
   ```
2. Crie a branch a partir de `develop` com o código da task do Jira: `<tipo>/AKA-<número>-descricao-curta` (ex.: `feature/AKA-54-ai-question-language-selector`)
3. Commits em inglês no formato `<tipo>: AKA-<número> <descrição>` (ex.: `feat: AKA-96 integrate question screen with backend questions endpoint`)
4. Abra o PR contra `develop` com o título no mesmo formato, descrição começando com maiúscula (ex.: `feat: AKA-54 Add language selector to AI Command Assistant`), e preencha o template
5. Para o merge: CI verde, 1 aprovação e título validado. Merge sempre via **Squash and merge**

Padrão completo (tipos aceitos, exemplos e regras): [Project Guidelines no API-6SEM](https://github.com/DenariusData/API-6SEM#project-guidelines).

## CI

O workflow `Frontend CI` roda em todo PR/push para `main` e `develop`: instala dependências e executa o build.

## Links

- Repositório agregador: [API-6SEM](https://github.com/DenariusData/API-6SEM)
- Backend: [API-6SEM-BACKEND](https://github.com/DenariusData/API-6SEM-BACKEND)
