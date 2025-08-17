document.addEventListener("DOMContentLoaded", function () {
  // --- Lógica do Drag-and-Drop com SortableJS ---
  const containers = document.querySelectorAll(".cards")

  containers.forEach((list) => {
    new Sortable(list, {
      group: "kanban",
      animation: 150,

      forceFallback: false,

      onStart: (evt) => {
        evt.item.classList.add("dragging")
      },

      onEnd: (evt) => {
        evt.item.classList.remove("dragging")
        saveState() // Salva o estado após cada drag-and-drop
      },
    })
  })

  // --- Lógica para adicionar nova card e controle do formulário ---
  const newCardTitleInput = document.getElementById("new-card-title")
  const newCardDescriptionInput = document.getElementById(
    "new-card-description"
  )
  const toggleAddCardFormButton = document.getElementById(
    "toggle-add-card-form"
  ) // Botão que mostra/esconde o formulário
  const addCardFormSubmitButton = document.getElementById(
    "add-new-card-button-form-submit"
  ) // Botão de submissão do formulário
  const addCardForm = document.querySelector(".add-card-form") // O formulário em si
  const todoCardsContainer = document.querySelector(".todo .cards") // Contêiner das cards na coluna "A fazer"

  // Event listener para o botão "Inserir nova card" (mostra/esconde o formulário)
  toggleAddCardFormButton.addEventListener("click", () => {
    const currentState = toggleAddCardFormButton.dataset.state

    if (currentState === "initial") {
      // Se o estado é 'initial', mostramos o formulário
      addCardForm.classList.remove("hidden") // Remove a classe hidden para mostrar o formulário
      toggleAddCardFormButton.textContent = "Cancelar" // Muda o texto do botão para "Cancelar"
      toggleAddCardFormButton.dataset.state = "form-open" // Atualiza o estado do botão para 'form-open'
    } else if (currentState === "form-open") {
      // Se o formulário já está aberto, ao clicar novamente, esconde
      addCardForm.classList.add("hidden") // Adiciona a classe hidden para esconder o formulário
      newCardTitleInput.value = "" // Limpa os campos ao cancelar
      newCardDescriptionInput.value = ""
      toggleAddCardFormButton.textContent = "Inserir nova card" // Volta o texto do botão para o original
      toggleAddCardFormButton.dataset.state = "initial" // Volta o estado do botão para 'initial'
    }
  })

  // Event listener para o botão "Adicionar Card" dentro do formulário (submete a card)
  addCardFormSubmitButton.addEventListener("click", () => {
    const title = newCardTitleInput.value.trim()
    const description = newCardDescriptionInput.value.trim()

    if (title === "") {
      console.error("O título do card não pode ser vazio.")
      return
    }

    const newCardId = crypto.randomUUID() // Gera um ID único e aleatório para a nova card

    // Cria o elemento da card usando a nova função auxiliar
    const newCardElement = createCardElement(newCardId, title, description, []) // Sem tags iniciais

    // Adiciona a nova card ao início da lista "A fazer"
    todoCardsContainer.insertAdjacentElement("afterbegin", newCardElement)

    // Salva o estado atualizado no localStorage para persistir a nova card
    saveState()

    // Limpa os campos e esconde o formulário novamente após adicionar a card
    newCardTitleInput.value = ""
    newCardDescriptionInput.value = ""
    addCardForm.classList.add("hidden") // Esconde o formulário
    toggleAddCardFormButton.textContent = "Inserir nova card" // Reseta o texto do botão principal
    toggleAddCardFormButton.dataset.state = "initial" // Reseta o estado do botão principal
  })

  // Helper function para criar um elemento de card
  function createCardElement(id, title, description, tags = []) {
    const cardDiv = document.createElement("div")
    cardDiv.className = "card"
    cardDiv.dataset.id = id

    // Use o texto completo da descrição e aplique a lógica de Ler Mais/Ler Menos
    const pElement = document.createElement("p")
    pElement.textContent = description // Adiciona o texto puro para que initializeReadMoreOnParagraph possa truncar

    cardDiv.innerHTML = `
      <h3>${title}</h3>
      <div class="tags">
          ${tags.map((tag) => `<span>${tag}</span>`).join("")}
      </div>
    `
    // Inserir o pElement antes das tags para manter a estrutura HTML
    cardDiv.insertBefore(pElement, cardDiv.querySelector(".tags"))

    // Inicializa Ler Mais/Ler Menos para o parágrafo da card recém-criada
    initializeReadMoreOnParagraph(pElement)
    return cardDiv
  }

  function saveState() {
    const state = {}
    document.querySelectorAll(".kanban-column").forEach((col) => {
      const key = col.dataset.columnId
      // Ao salvar, agora salvamos o conteúdo completo de cada card
      state[key] = [...col.querySelectorAll(".card")].map((c) => ({
        id: c.dataset.id,
        title: c.querySelector("h3")?.textContent || "",
        // Captura o texto completo do dataset (se expandido) ou o textContent
        description:
          c.querySelector("p")?.dataset.fullText ||
          c.querySelector("p")?.textContent ||
          "",
        tags: [...c.querySelectorAll(".tags span")].map((s) => s.textContent),
      }))
    })
    localStorage.setItem("kanban-state", JSON.stringify(state))
  }

  function loadState() {
    const raw = localStorage.getItem("kanban-state")
    let state = {}

    // Tenta carregar o estado do localStorage
    if (raw) {
      try {
        state = JSON.parse(raw)
      } catch (e) {
        console.error(
          "Erro ao parsear estado do localStorage, usando cards iniciais do HTML.",
          e
        )
        state = {} // Em caso de erro, trate o localStorage como vazio
      }
    }

    // Se o localStorage está vazio (ou houve erro de parse), preencha 'state' com as cards do HTML inicial
    // e salve-o imediatamente. Isso garante que as cards padrão do HTML sejam persistidas.
    if (
      Object.keys(state).length === 0 ||
      Object.values(state).every((arr) => arr.length === 0)
    ) {
      console.log(
        "Estado do localStorage vazio ou inválido. Capturando cards iniciais do HTML."
      )
      document.querySelectorAll(".kanban-column").forEach((col) => {
        const columnId = col.dataset.columnId
        state[columnId] = [...col.querySelectorAll(".card")].map((c) => ({
          id: c.dataset.id,
          title: c.querySelector("h3")?.textContent || "",
          description:
            c.querySelector("p")?.dataset.fullText ||
            c.querySelector("p")?.textContent ||
            "",
          tags: [...c.querySelectorAll(".tags span")].map((s) => s.textContent),
        }))
      })
      // Salva este estado inicial capturado do HTML no localStorage
      saveState()
    }

    // Remove todas as cards existentes do DOM para reconstruir a partir do estado
    document.querySelectorAll(".kanban-column .cards").forEach((container) => {
      while (container.firstChild) {
        container.removeChild(container.lastChild)
      }
    })

    // Reconstrói o DOM com base no estado (seja do localStorage ou do HTML inicial)
    Object.entries(state).forEach(([colKey, cardsData]) => {
      const list = document.querySelector(
        `.kanban-column[data-column-id="${colKey}"] .cards`
      )
      if (list) {
        cardsData.forEach((cardData) => {
          // Usa createCardElement para garantir que a card é criada corretamente
          // e a funcionalidade Ler Mais/Ler Menos é aplicada
          const cardElement = createCardElement(
            cardData.id,
            cardData.title,
            cardData.description,
            cardData.tags
          )
          list.appendChild(cardElement)
        })
      }
    })
  }

  // --- Lógica do "Ler Mais/Ler Menos" ---
  const limit = 60 // Limite de caracteres para truncar o texto da descrição

  // Função auxiliar para aplicar a lógica de "Ler Mais/Ler Menos" a um elemento <p> específico
  function initializeReadMoreOnParagraph(pElement) {
    const originalText = pElement.innerText.trim()
    if (originalText.length > limit) {
      pElement.dataset.fullText = originalText
      const truncatedText = originalText.substring(0, limit)
      pElement.innerHTML = `
        <span class="truncated-text">${truncatedText}</span>
        <span class="full-text" style="display: none;">${originalText}</span>
        <span class="read-more-container">
          <a href="#" class="read-more-link">... Ler mais</a>
        </span>
      `
    }
  }

  // Adiciona um único event listener ao corpo do documento para capturar cliques nos links "Ler Mais/Ler Menos"
  document.body.addEventListener("click", function (event) {
    if (event.target.classList.contains("read-more-link")) {
      event.preventDefault()
      const p = event.target.closest("p")
      const fullText = p.dataset.fullText
      p.innerHTML = `
        <span class="full-text">${fullText}</span>
        <span class="read-less-container">
          <a href="#" class="read-less-link">Ler menos</a>
        </span>
      `
    } else if (event.target.classList.contains("read-less-link")) {
      event.preventDefault()
      const p = event.target.closest("p")
      const originalText = p.dataset.fullText
      const truncatedText = originalText.substring(0, limit)
      p.innerHTML = `
        <span class="truncated-text">${truncatedText}</span>
        <span class="full-text" style="display: none;">${originalText}</span>
        <span class="read-more-container">
          <a href="#" class="read-more-link">... Ler mais</a>
        </span>
      `
    }
  })

  // Carrega o estado salvo do Kanban ao iniciar.
  // Esta chamada agora é a principal para inicializar o board,
  // garantindo que as cards HTML iniciais sejam salvas se não houver estado pré-existente.
  loadState()
})
