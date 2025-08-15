document.querySelectorAll(".cards").forEach((list) => {
  new Sortable(list, {
    group: "kanban",
    animation: 150,
    ghostClass: "dragging",
    chosenClass: "chosen",
    emptyInsertThreshold: 10,
    handle: ".card",
    onEnd: saveState,
  })
})

function saveState() {
  const state = {}
  document.querySelectorAll(".todo, .doing, .done").forEach((col) => {
    const key = col.classList[0]
    const ids = [...col.querySelectorAll(".card")].map((c) => c.dataset.id)
    state[key] = ids
  })
  localStorage.setItem("kanban-state", JSON.stringify(state))
}

function loadState() {
  const raw = localStorage.getItem("kanban-state")
  if (!raw) return
  const state = JSON.parse(raw)
  Object.entries(state).forEach(([colKey, ids]) => {
    const list = document.querySelector(`.${colKey} .cards`)
    ids.forEach((id) => {
      const card = document.querySelector(`.card[data-id="${id}"]`)
      if (card) list.appendChild(card)
    })
  })
}
/**
 * Trunca o texto de parágrafos que excedem um limite de caracteres,
 * adicionando a opção de "Ler mais" para exibir o conteúdo completo.
 */
document.addEventListener("DOMContentLoaded", function () {
  const elements = document.querySelectorAll(".cards p")
  const limit = 70

  // --- Parte 1: Lógica de Truncamento Inicial e Criação da Estrutura ---
  for (let p of elements) {
    const originalText = p.innerText.trim() // .trim() remove espaços em branco no início e fim

    if (originalText.length > limit) {
      // Armazena o texto original em um atributo de dado
      p.dataset.fullText = originalText

      // Cria a versão truncada do texto
      const truncatedText = originalText.substring(0, limit)

      // Insere a estrutura completa com spans para o texto truncado e completo
      // e o link "Ler mais"
      p.innerHTML = `
                <span class="truncated-text">${truncatedText}</span>
                <span class="full-text" style="display: none;">${originalText}</span>
                <span class="read-more-container">
                    <a href="#" class="read-more-link">... Ler mais</a>
                </span>
            `
    }
  }

  // --- Parte 2: Lógica de Alternância de Conteúdo (esconder/exibir) ---
  // Seleciona todos os links "Ler mais" criados na etapa anterior
  const readMoreLinks = document.querySelectorAll(".read-more-link")

  readMoreLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      // Impede a ação padrão do link (evita que a página recarregue)
      event.preventDefault()

      // Encontra o parágrafo pai (o card) a partir do link clicado
      const p = link.closest("p")
      if (!p) return // Garante que o parágrafo foi encontrado

      const truncatedSpan = p.querySelector(".truncated-text")
      const fullSpan = p.querySelector(".full-text")
      const readMoreContainer = p.querySelector(".read-more-container")

      // Alterna a visibilidade dos elementos
      if (fullSpan.style.display === "none") {
        // Se o texto completo estiver escondido, o exibe
        fullSpan.style.display = "inline"
        truncatedSpan.style.display = "none"
        readMoreContainer.style.display = "none"
      } else {
        // Se o texto completo estiver visível, o esconde e exibe o truncado
        fullSpan.style.display = "none"
        truncatedSpan.style.display = "inline"
        readMoreContainer.style.display = "inline"
      }
    })
  })

  // --- Parte 3 (Adicional): Lógica para Ler Menos (opcional) ---
  // Você pode adicionar um link "Ler menos" dinamicamente
  // quando o texto completo for exibido.
  // Esta parte é um pouco mais complexa e, para a primeira versão,
  // o ideal é que o clique em qualquer parte do texto completo
  // o retorne ao estado original.

  // Abaixo está uma implementação alternativa para "Ler menos"
  // que se baseia em um segundo clique no próprio parágrafo
  // após o texto ser expandido.

  const cards = document.querySelectorAll(".cards p")

  cards.forEach((card) => {
    card.addEventListener("click", (event) => {
      const truncatedSpan = card.querySelector(".truncated-text")
      const fullSpan = card.querySelector(".full-text")
      const readMoreContainer = card.querySelector(".read-more-container")

      // Se o texto completo estiver visível, e o clique não for no link "Ler mais",
      // oculta o texto completo.
      if (
        fullSpan &&
        fullSpan.style.display !== "none" &&
        !event.target.classList.contains("read-more-link")
      ) {
        fullSpan.style.display = "none"
        truncatedSpan.style.display = "inline"
        readMoreContainer.style.display = "inline"
      }
    })
  })
})
