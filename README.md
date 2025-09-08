# Sistema de Gerenciamento de Tarefas - Node.js

## 📋 Visão Geral

Sistema completo de gerenciamento de tarefas desenvolvido em **Node.js** com **Express.js**. A aplicação permite aos usuários criar contas, fazer login e gerenciar suas tarefas pessoais com funcionalidades completas de CRUD.

## 🚀 Funcionalidades

### 👤 Sistema de Usuários
- **Cadastro** de novos usuários com validação
- **Login** seguro com hash de senhas
- **Logout** com encerramento de sessão
- **Validação** de email e senhas

### ✅ Gerenciamento de Tarefas
- **Criar** tarefas com título, descrição e prioridade
- **Listar** todas as tarefas do usuário
- **Editar** tarefas existentes
- **Excluir** tarefas
- **Marcar/Desmarcar** como concluída
- **Filtrar** por status (todas, pendentes, concluídas, alta prioridade)

### 📊 Dashboard
- **Estatísticas** em tempo real
- **Contadores** de tarefas por status
- **Interface responsiva** para desktop e mobile
- **Busca** em tempo real
- **Alertas** de sucesso e erro

## 🏗️ Estrutura do Projeto

```
nodejs_project/
├── server.js              # Servidor principal Express.js
├── config.js              # Configurações e utilitários
├── database.js            # Classe para manipulação de dados
├── package.json           # Dependências e scripts
├── .nodemonignore         # Arquivos ignorados pelo nodemon
├── views/
│   ├── auth.html          # Página de login/cadastro
│   └── dashboard.html     # Dashboard principal
├── public/
│   ├── css/
│   │   └── style.css      # Estilos da aplicação
│   └── js/
│       ├── auth.js        # JavaScript para autenticação
│       └── dashboard.js   # JavaScript do dashboard
└── data/
    ├── users.json         # Dados dos usuários
    └── tasks.json         # Dados das tarefas
```

## �️ Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **express-session** - Gerenciamento de sessões
- **crypto** - Hash de senhas (nativo do Node.js)
- **fs** - Manipulação de arquivos (nativo do Node.js)
- **HTML5/CSS3** - Interface do usuário
- **JavaScript (ES6+)** - Lógica do frontend

## 📦 Instalação e Execução

### Pré-requisitos
- Node.js 14.0 ou superior
- npm (incluído com Node.js)

### Passos para execução

1. **Clone ou baixe o projeto**
```bash
git clone <url-do-repositorio>
cd nodejs_project
```

2. **Instale as dependências**
```bash
npm install
```

3. **Execute a aplicação**
```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Modo produção
npm start
```

4. **Acesse a aplicação**
   - Abra o navegador em `http://localhost:3000`

## 🔧 Configuração

### Dependências do package.json
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "express-session": "^1.18.2",
    "nodemon": "^3.0.2"
  }
}
```

### Scripts disponíveis
- `npm start` - Executa em modo produção
- `npm run dev` - Executa em modo desenvolvimento com auto-reload

### Configurações importantes
- **Porta**: 3000 (configurável via variável de ambiente)
- **Sessões**: Válidas por 24 horas
- **Dados**: Armazenados em arquivos JSON na pasta `data/`

## 🏛️ Arquitetura

### Backend (Node.js/Express)
- **server.js** - Configuração do servidor, rotas e middlewares
- **config.js** - Configurações gerais e funções utilitárias
- **database.js** - Classe para manipulação de dados em arquivos JSON

### Frontend (Vanilla JavaScript)
- **auth.js** - Lógica de login e cadastro
- **dashboard.js** - Lógica do dashboard e gerenciamento de tarefas
- **style.css** - Estilos responsivos e modernos

### Rotas da API

#### Autenticação
- `GET /` - Redirecionamento baseado no status de login
- `GET /auth` - Página de login/cadastro
- `POST /auth/login` - Processar login
- `POST /auth/register` - Processar cadastro
- `POST /logout` - Fazer logout

#### Dashboard
- `GET /dashboard` - Página principal (protegida)
- `GET /api/dashboard-data` - Dados do dashboard (JSON)

#### Tarefas
- `POST /api/tasks` - Criar nova tarefa
- `PUT /api/tasks/:id` - Atualizar tarefa
- `PATCH /api/tasks/:id/toggle` - Alternar status da tarefa
- `DELETE /api/tasks/:id` - Excluir tarefa

## 🔒 Segurança

### Implementações de Segurança
- **Hash SHA-256** para senhas
- **Sanitização** de dados de entrada
- **Validação** de email e senhas
- **Sessões seguras** com express-session
- **Middleware de autenticação** para rotas protegidas

### Boas práticas implementadas
- Cookies HTTPOnly para segurança
- Sanitização contra XSS básico
- Validação de dados no servidor
- Controle de acesso baseado em sessão

## 🎯 Recursos Técnicos Demonstrados

### Node.js Concepts
- Servidor HTTP com Express.js
- Middleware customizado
- Roteamento RESTful
- Manipulação de arquivos síncronos
- Gerenciamento de sessões
- Hash de senhas com crypto

### JavaScript Moderno
- ES6+ features
- Async/await para requisições
- Fetch API
- DOM manipulation
- Event handling

### Arquitetura MVC (simplificada)
- **Model**: database.js (manipulação de dados)
- **View**: HTML templates + CSS
- **Controller**: server.js (lógica de rotas)

## 🚧 Limitações Conhecidas

- **Armazenamento**: Dados em arquivos JSON (não escalável para produção)
- **Sessões**: Armazenadas em memória (perdidas ao reiniciar servidor)
- **Segurança**: Implementação básica (adequada para desenvolvimento/aprendizado)
- **Concorrência**: Sem tratamento de acesso simultâneo aos arquivos

## � Possíveis Melhorias

### Para produção
- Migrar para banco de dados (MongoDB/PostgreSQL)
- Implementar JWT para autenticação stateless
- Adicionar rate limiting e CORS
- Implementar logging estruturado
- Adicionar testes automatizados

### Funcionalidades
- Upload de arquivos para tarefas
- Notificações em tempo real
- Colaboração entre usuários
- Categorias de tarefas
- Relatórios e estatísticas avançadas

## � Licença

Este projeto é destinado para fins educacionais e de aprendizado.

## 🤝 Contribuição

Este é um projeto educacional. Sinta-se livre para fazer fork e experimentar melhorias!

---

**Desenvolvido com Node.js e Express.js para demonstrar conceitos fundamentais de desenvolvimento web moderno.**

