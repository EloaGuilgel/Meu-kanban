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
  const limit = 60

  // --- Parte 1: Lógica de Truncamento Inicial e Criação da Estrutura ---
  for (let p of elements) {
    const originalText = p.innerText.trim()

    if (originalText.length > limit) {
      // Armazena o texto original em um atributo de dado
      p.dataset.fullText = originalText

      // Cria a versão truncada do texto
      const truncatedText = originalText.substring(0, limit)

      // Insere a estrutura inicial com o texto truncado e o link "Ler mais"
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
  // Adiciona o evento de clique a todos os links "Ler mais"
  const readMoreLinks = document.querySelectorAll(".read-more-link")

  readMoreLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault()

      const p = link.closest("p")
      if (!p) return

      const fullText = p.dataset.fullText

      // Substitui o conteúdo do parágrafo pelo texto completo + link "Ler menos"
      p.innerHTML = `
                <span class="full-text">${fullText}</span>
                <span class="read-less-container">
                    <a href="#" class="read-less-link">Ler menos</a>
                </span>
            `

      // Encontra o novo link "Ler menos" e adiciona o evento de clique a ele
      const readLessLink = p.querySelector(".read-less-link")
      readLessLink.addEventListener("click", (e) => {
        e.preventDefault()

        // Retorna ao estado original (truncado)
        const originalText = p.dataset.fullText
        const truncatedText = originalText.substring(0, limit)

        p.innerHTML = `
                    <span class="truncated-text">${truncatedText}</span>
                    <span class="full-text" style="display: none;">${originalText}</span>
                    <span class="read-more-container">
                        <a href="#" class="read-more-link">... Ler mais</a>
                    </span>
                `
        // Recarrega a página para re-ativar os eventos (não é o ideal, mas funciona)
        // location.reload();

        // Melhor abordagem: uma função que re-adiciona os eventos
        addReadMoreEvents()
      })
    })
  })

  // Função para re-adicionar eventos de clique, caso o DOM seja modificado
  function addReadMoreEvents() {
    const newReadMoreLinks = document.querySelectorAll(".read-more-link")
    newReadMoreLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault()

        const p = link.closest("p")
        if (!p) return

        const fullText = p.dataset.fullText

        p.innerHTML = `
                    <span class="full-text">${fullText}</span>
                    <span class="read-less-container">
                        <a href="#" class="read-less-link">Ler menos</a>
                    </span>
                `
        addReadLessEvents()
      })
    })
  }

  // Função para adicionar os eventos de clique para o "Ler menos"
  function addReadLessEvents() {
    const readLessLinks = document.querySelectorAll(".read-less-link")
    readLessLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const p = link.closest("p")
        const originalText = p.dataset.fullText
        const truncatedText = originalText.substring(0, limit)

        p.innerHTML = `
                    <span class="truncated-text">${truncatedText}</span>
                    <span class="full-text" style="display: none;">${originalText}</span>
                    <span class="read-more-container">
                        <a href="#" class="read-more-link">... Ler mais</a>
                    </span>
                `
        addReadMoreEvents()
      })
    })
  }

  addReadMoreEvents()
})
