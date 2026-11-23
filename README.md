# SIB v2 — Frontend

Interface web do Sistema Integrado de Brechó, feita com React e Vite. O frontend se conecta à API Spring Boot do projeto [`sib-v2`](../sib-v2/README.md).

## Requisitos

- Node.js e npm.
- API do backend em execução e banco SQL Server preparado.

## Executar localmente

```bash
npm ci
npm run dev
```

Abra `http://localhost:5173`. A URL padrão da API é `http://localhost:8080/api`. Se o backend estiver em outro endereço, defina `VITE_API_URL` com a URL completa da API, incluindo `/api`, antes de iniciar o Vite. O backend também precisa permitir a origem do frontend no CORS.

## Build

```bash
npm run build
npm run preview
```

O build de produção é gerado em `dist/`. Visitantes veem uma tela inicial sem dados operacionais; atendentes recebem atalhos de operação; administradores acessam o painel e a configuração, incluindo backup e restauração manual do banco. Consulte o README do backend para instruções de banco, permissões e execução da API.
