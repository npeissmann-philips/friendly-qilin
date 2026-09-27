# 🚀 Trilha de Estudos em Arquitetura de LLMs & Agentes de IA

[🌐 **English Version**](README.md)

Este repositório é um projeto de estudo prático focado no domínio de **Engenharia de Prompt, RAG (Retrieval-Augmented Generation), Tool Calling, Orquestração de Agentes (LangChain/LangGraph) e LLMOps**.

O objetivo final é construir uma base sólida em arquitetura de inteligência artificial aplicável a cenários corporativos de alta complexidade.

---

## 🛠️ Tecnologias & Ferramentas

- **Runtime & Linguagem:** Node.js, TypeScript
- **Framework Web:** Express.js, Swagger UI (`swagger-ui-express`)
- **Provedores de LLM:** Google Gemini API (`@google/genai`), OpenAI API
- **Frameworks de IA:** LangChain.js, LangGraph
- **Bancos Vetoriais:** pgvector (PostgreSQL), Pinecone, Weaviate
- **LLMOps & Observabilidade:** LangSmith
- **DevOps & Containers:** Docker, Docker Compose

---

## 📅 Trilha de Aprendizado

### 🎯 Fase 1: Fundamentos da API e Engenharia de Prompt (1ª Semana)
*Entendimento do comportamento puro dos LLMs e controle de saídas.*

- [ ] **Consumo direto de API:** Implementação de chamadas diretas às APIs (Gemini e OpenAI) sem frameworks intermediários.
- [ ] **System Prompts vs. User Prompts:** Definição de personas, restrições e regras de negócio no `System Prompt`.
- [ ] **Parâmetros do Modelo:** Experimentos práticos ajustando `Temperature` (criatividade vs. precisão) e `Max Tokens`.
- [ ] **Prompting Estruturado:**
  - **Few-Shot Prompting:** Fornecimento de exemplos dentro do contexto do prompt.
  - **Chain of Thought (CoT):** Condução do raciocínio passo a passo antes do modelo emitir a resposta final.

---

### 🧠 Fase 2: O Padrão RAG (Retrieval-Augmented Generation) (2ª Semana)
*Capacitação da IA para consultar bases de dados externas e privadas.*

- [ ] **Embeddings:** Estudo e conversão de textos em vetores numéricos de alta dimensão.
- [ ] **Vector Databases:** Configuração e manipulação de bancos vetoriais (pgvector, Pinecone ou Weaviate).
- [ ] **Pipeline e Fluxo RAG completo:**
  1. Leitura e extração de dados de arquivos PDF ou páginas web.
  2. **Chunking:** Estratégias de divisão de texto em partes menores e relevantes.
  3. Geração e salvamento dos embeddings no banco vetorial.
  4. **Rota de Busca:** Vetorização da pergunta do usuário, busca por similaridade vetorial (Cosine Similarity, Euclidean Distance) e injeção do contexto recuperado no prompt final.

---

### 🛠️ Fase 3: Tool Calling e o Início dos Agentes (3ª Semana)
*Transformando o LLM de um gerador de texto em um agente de ação.*

- [x] **Function / Tool Calling:**
  - Envio de JSON Schemas descrevendo funções do sistema para o LLM (ex: `count_database_files`, `query_rag_knowledge_base`).
  - Processamento do retorno estruturado do LLM solicitando a execução de funções.
  - Execução da função na aplicação e envio do resultado de volta ao LLM para formulação da resposta final.
- [ ] **Introdução ao LangChain:**
  - Uso do LangChain.js para encapsulamento de pipelines.
  - Criação de `Chains` conectando o LLM a ferramentas simuladas (ex: APIs de consulta de CEP, clima ou cotação de moedas).

---

### 🔄 Fase 4: Orquestração e Fluxos Complexos (4ª Semana)
*Construção de sistemas multi-agentes e fluxos cíclicos.*

- [ ] **LangGraph:**
  - Criação de grafos de decisão e fluxos cíclicos de agentes.
  - Implementação de nós de avaliação onde o agente analisa a própria resposta, valida a qualidade e decide se refaz a busca ou finaliza.
- [ ] **Arquitetura Multi-Agente:**
  - Estudo de padrões de agentes especializados (Agente Pesquisador, Agente Revisor, Agente Gerente).
  - Replicação de fluxos multi-agente utilizando LangGraph em TypeScript/Node.js.

---

### 🛡️ Fase 5: Governança e Produção (LLMOps)
*Operação, monitoramento e segurança em aplicações corporativas.*

- [ ] **Observabilidade de IA:** Integração com ferramentas como **LangSmith** para rastreamento de custos, latência e debug de chamadas aos LLMs.
- [ ] **Segurança em LLMs:**
  - Mitigação de **Prompt Injection** (ataques diretos e indiretos).
  - Sanitização e mascaramento de **PII (Personally Identifiable Information)** para conformidade com LGPD/GDPR.
- [ ] **Streaming de Respostas:** Implementação de **Server-Sent Events (SSE)** no backend para exibição da resposta em tempo real no frontend.

---

## 📂 Estrutura do Projeto (Sugerida)

```text
.
├── src/
│   ├── phase-1-prompting/     # Testes de chamadas diretas, Few-Shot e CoT
│   ├── phase-2-rag/           # Pipeline de Chunking, Embeddings e Vector DB
│   ├── phase-3-tools/         # Tool Calling nativo e Chains com LangChain
│   ├── phase-4-langgraph/     # Grafos de decisão e Orquestração Multi-Agente
│   ├── phase-5-llmops/        # Observabilidade, SSE Streaming e Filtros de PII/Prompt Injection
│   ├── routes/                # Definição das rotas Express
│   ├── services/              # Integrações com LLMs (Gemini, OpenAI, etc.)
│   ├── swagger.ts             # Configuração da documentação Swagger UI
│   └── server.ts              # Ponto de entrada da aplicação
├── docker-compose.yml         # Containerização do banco vetorial (pgvector/Weaviate)
├── Dockerfile
├── .env.example
├── package.json
├── README.md                  # README em Inglês
└── README.pt-BR.md            # README em Português
```

---

## 营业 Como Executar o Projeto

### Pré-requisitos
- Node.js (v18+)
- npm ou yarn
- Docker Desktop (opcional, para subida do banco vetorial local)

### 1. Clonar o repositório e instalar as dependências

```bash
npm install
```

### 2. Configurar as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:

```env
PORT=3000
GEMINI_API_KEY=seu_gemini_api_key_aqui
OPENAI_API_KEY=seu_openai_api_key_aqui
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=seu_langsmith_api_key_aqui
DATABASE_URL=postgresql://user:password@localhost:5432/vector_db
```

### 3. Executar o Servidor em Modo de Desenvolvimento

```bash
npm run dev
```

Acesse a documentação Swagger em: `http://localhost:3000/api-docs`.

---

## 📄 Licença

Este projeto é destinado exclusivamente a fins de estudo e aperfeiçoamento profissional.
