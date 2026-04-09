# 📚 My Reading Journey

Uma aplicação web moderna para organizar e acompanhar suas leituras de forma visual, elegante e intuitiva.

---

## ✨ Visão Geral

O **My Reading Journey** é um gerenciador de livros no estilo **Kanban**, onde você pode organizar suas leituras em três estágios:

* 📖 **Quero Ler**
* 📚 **Estou Lendo**
* ✅ **Já Li**

Além disso, a aplicação permite avaliar livros, escrever resenhas e acompanhar sua jornada de leitura de forma simples e agradável.

---

## 🚀 Tecnologias Utilizadas

* **Lovable** → Criação rápida da aplicação (vibe coding)
* **Supabase** → Banco de dados e armazenamento de imagens
* **Frontend moderno** → Interface reativa e fluida

---

## 🎯 Funcionalidades

### 📌 Gerenciamento de Livros

* Cadastro de livros com:

  * Título
  * Autor
  * Número de páginas
  * Categoria
  * Capa (upload de imagem)

* Organização em formato Kanban com drag & drop

---

### 🔄 Kanban de Leitura

Os livros são organizados em três colunas:

1. **Quero Ler** → Lista de leitura futura
2. **Estou Lendo** → Leituras em andamento
3. **Já Li** → Livros finalizados

* Arraste os livros entre as colunas
* O status é salvo automaticamente

---

### ⭐ Avaliação e Resenha

Ao mover um livro para **"Já Li"**:

* Um modal é exibido automaticamente
* Você pode:

  * Dar uma nota de **1 a 10 estrelas**
  * Escrever uma resenha

Essas informações são salvas e associadas ao livro.

---

### 🧾 Visualização de Detalhes

Ao clicar em um livro:

* Um modal elegante é aberto contendo:

  * Capa do livro
  * Título
  * Autor
  * Categoria
  * Número de páginas
  * Avaliação (estrelas)
  * Resenha completa

---

### 🗑️ Exclusão de Livros

* Possibilidade de excluir qualquer livro
* Confirmação antes da remoção
* Atualização imediata na interface

---

## 🎨 Design

A interface foi projetada com um tema inspirado em:

* 🏰 Fantasia medieval
* 📜 Pergaminhos
* 📚 Bibliotecas antigas

### Características visuais:

* Paleta de cores em tons de bege, marrom e dourado
* Tipografia estilo serif (livros clássicos)
* Cartões com sombras suaves
* Animações leves e fluidas

---

## 🧠 Experiência do Usuário

* Interface intuitiva
* Drag & drop fluido
* Feedback visual em todas ações
* Sem necessidade de recarregar a página

---

## 🗄️ Estrutura do Banco (Supabase)

Tabela: `livros`

| Campo      | Tipo      | Descrição                |
| ---------- | --------- | ------------------------ |
| id         | uuid      | Identificador único      |
| titulo     | text      | Nome do livro            |
| autor      | text      | Autor                    |
| paginas    | integer   | Número de páginas        |
| categoria  | text      | Categoria do livro       |
| imagem_url | text      | URL da capa              |
| status     | text      | (quero_ler, lendo, lido) |
| rating     | integer   | Avaliação (1 a 10)       |
| review     | text      | Resenha                  |
| created_at | timestamp | Data de criação          |

---

## 🔮 Possíveis Melhorias Futuras

* 📊 Dashboard com estatísticas de leitura
* 📅 Metas mensais
* 📈 Gráficos de progresso
* ⭐ Ranking dos melhores livros
* 🌐 Compartilhamento social

---

## 💡 Sobre o Projeto

Este projeto foi desenvolvido utilizando o conceito de **vibe coding**, focando em:

* Rapidez no desenvolvimento
* Iteração contínua
* Experiência do usuário
* Estética agradável

---

## 🧑‍💻 Autor

Desenvolvido por Rafael Nascimento.

---

## 📌 Conclusão

O **My Reading Journey** vai além de um simples organizador — ele se torna um verdadeiro **diário de leitura**, ajudando você a registrar, avaliar e refletir sobre cada livro lido.

---

✨ *Organize suas leituras. Registre suas experiências. Evolua como leitor.*
