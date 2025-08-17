document.addEventListener("DOMContentLoaded", function () {
  // --- Lógica do Drag-and-Drop com SortableJS ---
  const containers = document.querySelectorAll(".cards")

  containers.forEach((list) => {
    new Sortable(list, {
      group: "kanban",
      animation: 150,

      // As classes CSS já são definidas no CSS, não há necessidade de duplicar aqui
      // chosenClass: "sortable-chosen",
      // dragClass: "sortable-drag",
      // ghostClass: "sortable-ghost",

      forceFallback: false,

      onStart: (evt) => {
        // Adiciona a classe 'dragging' para controlar o estilo do card sendo arrastado
        evt.item.classList.add("dragging")
      },

      onEnd: (evt) => {
        // Remove a classe 'dragging' quando o arraste termina
        evt.item.classList.remove("dragging")
        // Salva o estado do Kanban no Local Storage
        saveState()
      },
    })
  })

  function saveState() {
    const state = {}
    // Busca todas as colunas do kanban, usando a classe genérica 'kanban-column'
    document.querySelectorAll(".kanban-column").forEach((col) => {
      const key = col.dataset.columnId // Usa o atributo data-column-id como chave
      const ids = [...col.querySelectorAll(".card")].map((c) => c.dataset.id)
      state[key] = ids
    })
    localStorage.setItem("kanban-state", JSON.stringify(state))
  }

  function loadState() {
    const raw = localStorage.getItem("kanban-state")
    if (!raw) return // Se não houver estado salvo, não faz nada
    const state = JSON.parse(raw)
    // Itera sobre as chaves e IDs salvos no estado
    Object.entries(state).forEach(([colKey, ids]) => {
      // Encontra a lista (cards) dentro da coluna usando o data-column-id
      const list = document.querySelector(
        `.kanban-column[data-column-id="${colKey}"] .cards`
      )
      if (list) {
        // Verifica se a lista existe antes de manipular
        ids.forEach((id) => {
          const card = document.querySelector(`.card[data-id="${id}"]`)
          if (card) {
            // Verifica se o card existe antes de adicionar
            list.appendChild(card) // Adiciona o card à sua posição salva
          }
        })
      }
    })
  }

  // --- Lógica do "Ler Mais/Ler Menos" com delegação de eventos ---
  const limit = 60 // Limite de caracteres para truncar o texto

  // Adiciona um único event listener ao corpo do documento para capturar cliques nos links
  document.body.addEventListener("click", function (event) {
    // Verifica se o clique foi em um link "Ler mais"
    if (event.target.classList.contains("read-more-link")) {
      event.preventDefault() // Previne o comportamento padrão do link
      const p = event.target.closest("p") // Encontra o elemento <p> pai
      const fullText = p.dataset.fullText // Obtém o texto completo do dataset
      // Atualiza o HTML do parágrafo para mostrar o texto completo e o link "Ler menos"
      p.innerHTML = `
        <span class="full-text">${fullText}</span>
        <span class="read-less-container">
          <a href="#" class="read-less-link">Ler menos</a>
        </span>
      `
    }
    // Verifica se o clique foi em um link "Ler menos"
    else if (event.target.classList.contains("read-less-link")) {
      event.preventDefault() // Previne o comportamento padrão do link
      const p = event.target.closest("p") // Encontra o elemento <p> pai
      const originalText = p.dataset.fullText // Obtém o texto completo original
      const truncatedText = originalText.substring(0, limit) // Trunca o texto novamente
      // Atualiza o HTML do parágrafo para mostrar o texto truncado e o link "Ler mais"
      p.innerHTML = `
        <span class="truncated-text">${truncatedText}</span>
        <span class="full-text" style="display: none;">${originalText}</span>
        <span class="read-more-container">
          <a href="#" class="read-more-link">... Ler mais</a>
        </span>
      `
    }
  })

  // Inicializa o texto para todos os parágrafos de cards existentes ao carregar a página
  const elements = document.querySelectorAll(".cards p")
  elements.forEach((p) => {
    const originalText = p.innerText.trim()
    if (originalText.length > limit) {
      p.dataset.fullText = originalText // Armazena o texto completo no dataset
      const truncatedText = originalText.substring(0, limit) // Trunca o texto
      // Define o HTML inicial com o texto truncado e o link "Ler mais"
      p.innerHTML = `
        <span class="truncated-text">${truncatedText}</span>
        <span class="full-text" style="display: none;">${originalText}</span>
        <span class="read-more-container">
          <a href="#" class="read-more-link">... Ler mais</a>
        </span>
      `
    }
  })

  // Carrega o estado salvo do Kanban após a inicialização de todos os elementos
  loadState()
})
