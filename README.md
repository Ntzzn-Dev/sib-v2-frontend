# SIB v2 · Frontend

Frontend do sistema de gestão de brechó, feito com React e Vite e conectado à API REST do projeto `sib-v2`.

## Iniciar localmente

Em um terminal, inicie o backend:

```powershell
cd sib-v2
.\mvnw.cmd spring-boot:run
```

Em outro terminal, inicie o frontend:

```powershell
cd sib-v2-frontend
npm install
npm run dev
```

Abra o endereço informado pelo Vite (por padrão `http://localhost:5173`). A API padrão é `http://localhost:8080/api`.

Se o backend estiver em outro endereço, copie `.env.example` para `.env` e configure:

```dotenv
VITE_API_URL=http://localhost:8080/api
```

Reinicie o Vite depois de alterar o `.env`.

## O que já está conectado

- Painel com resumo de produtos e vendas.
- Criar, consultar, editar, remover e buscar produtos, clientes, funcionários, categorias, marcas, métodos de pagamento e endereços.
- Cadastro de funcionário por `POST /api/funcionarios` e login validado por `POST /api/auth/login`. Ao concluir o cadastro, o frontend tenta iniciar a sessão automaticamente.
- Fluxo de vendas: iniciar atendimento, selecionar cliente, adicionar produtos, receber pagamento em uma ou mais formas e cancelar venda em aberto.
- Busca, filtros de status, mensagens da API e estados de conexão.

A API ainda não emite token de sessão. O frontend usa o funcionário autenticado para informar o CPF ao criar uma venda, conforme a interface atual do backend.

## Build de produção

```powershell
npm run build
npm run preview
```
