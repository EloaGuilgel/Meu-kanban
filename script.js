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
        saveStateToLocalStorage() // Salva o estado após cada drag-and-drop
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
      // Se o estado é 'initial', mostra o formulário
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
    saveStateToLocalStorage()

    // Limpa os campos e esconde o formulário novamente após adicionar a card
    newCardTitleInput.value = ""
    newCardDescriptionInput.value = ""
    addCardForm.classList.add("hidden") // Esconde o formulário
    toggleAddCardFormButton.textContent = "Inserir nova card" // Reseta o texto do botão principal
    toggleAddCardFormButton.dataset.state = "initial" // Reseta o estado do botão principal
  })

  // --- Lógica para Excluir Card (COM CONFIRMAÇÃO) ---
  document.body.addEventListener("click", (event) => {
    // Verifica se o clique foi em um botão de exclusão ou em um ícone dentro dele
    const deleteButton = event.target.closest(".delete-card-btn")
    if (deleteButton) {
      const cardToDelete = deleteButton.closest(".card") // Encontra a card pai
      if (cardToDelete) {
        // PERGUNTA DE CONFIRMAÇÃO
        if (window.confirm("Tem certeza que deseja excluir esta card?")) {
          cardToDelete.remove()
          saveStateToLocalStorage() // Salva o estado após a exclusão
          console.log(`Card com ID ${cardToDelete.dataset.id} excluída.`)
        } else {
          console.log("Exclusão cancelada.")
        }
      }
    }
  })

  // Helper function para criar um elemento de card
  function createCardElement(id, title, description, tags = []) {
    const cardDiv = document.createElement("div")
    cardDiv.className = "card"
    cardDiv.dataset.id = id

    // Adiciona o título
    const h3Element = document.createElement("h3")
    h3Element.textContent = title
    cardDiv.appendChild(h3Element)

    // Adiciona o botão de exclusão
    const deleteButton = document.createElement("button")
    deleteButton.className = "delete-card-btn"
    deleteButton.setAttribute("aria-label", "Excluir card")
    deleteButton.innerHTML = '<ion-icon name="trash-outline"></ion-icon>'
    cardDiv.appendChild(deleteButton)

    // Adiciona a descrição (e aplica Ler Mais/Ler Menos)
    const pElement = document.createElement("p")
    pElement.textContent = description // Adiciona o texto puro para que initializeReadMoreOnParagraph possa truncar
    cardDiv.appendChild(pElement) // Adiciona o parágrafo

    // Adiciona as tags
    const tagsDiv = document.createElement("div")
    tagsDiv.className = "tags"
    tags.forEach((tag) => {
      const span = document.createElement("span")
      span.textContent = tag
      tagsDiv.appendChild(span)
    })
    cardDiv.appendChild(tagsDiv)

    // Inicializa Ler Mais/Ler Menos para o parágrafo da card recém-criada
    initializeReadMoreOnParagraph(pElement)
    return cardDiv
  }

  // Helper function para obter o estado atual do DOM (cards e suas colunas)
  function getCurrentDomState() {
    const state = {}
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
    return state
  }

  // Função para salvar o estado atual do DOM no localStorage
  function saveStateToLocalStorage() {
    const stateToSave = getCurrentDomState()
    localStorage.setItem("kanban-state", JSON.stringify(stateToSave))
  }

  // Função para carregar o estado e renderizar o Kanban Board
  function loadAndRenderKanbanBoard() {
    let loadedState = null
    const rawStoredState = localStorage.getItem("kanban-state")

    if (rawStoredState) {
      try {
        const parsedState = JSON.parse(rawStoredState)
        // Verifica se o estado parseado é um objeto válido e não contém apenas colunas vazias
        const hasContent = Object.values(parsedState).some(
          (arr) => arr.length > 0
        )
        if (hasContent) {
          loadedState = parsedState
        }
      } catch (e) {
        console.error(
          "Erro ao parsear estado do localStorage, usando cards iniciais do HTML.",
          e
        )
      }
    }

    // Se não há estado válido no localStorage, captura o estado inicial do HTML
    if (!loadedState) {
      console.log(
        "LocalStorage vazio ou inválido. Capturando cards iniciais do HTML e salvando."
      )
      const initialDomState = getCurrentDomState()
      saveStateToLocalStorage() // Salva o estado inicial do HTML no localStorage
      renderDomFromState(initialDomState) // Renderiza com base no estado do HTML
    } else {
      renderDomFromState(loadedState) // Renderiza com base no estado carregado do localStorage
    }
  }

  // Função auxiliar para renderizar o DOM a partir de um objeto de estado
  function renderDomFromState(state) {
    // Limpa todas as cards existentes do DOM para evitar duplicatas e garantir a ordem
    document.querySelectorAll(".kanban-column .cards").forEach((container) => {
      while (container.firstChild) {
        container.removeChild(container.lastChild)
      }
    })

    // Reconstrói o DOM com base no estado fornecido
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
    const originalText = pElement.innerText.trim() // Obtém o texto original do parágrafo
    if (originalText.length > limit) {
      // Verifica se o texto é maior que o limite
      pElement.dataset.fullText = originalText // Armazena o texto completo no dataset do elemento
      const truncatedText = originalText.substring(0, limit) // Trunca o texto
      // Define o HTML do parágrafo com o texto truncado e o link "Ler mais"
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
    // Verifica se o clique foi em um link "Ler mais"
    if (event.target.classList.contains("read-more-link")) {
      event.preventDefault() // Previne o comportamento padrão do link (navegar para #)
      const p = event.target.closest("p") // Encontra o elemento <p> pai do link clicado
      const fullText = p.dataset.fullText // Obtém o texto completo salvo no dataset
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
      const p = event.target.closest("p") // Encontra o elemento <p> pai do link clicado
      const originalText = p.dataset.fullText // Obtém o texto completo original salvo no dataset
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

  // Carrega o estado salvo do Kanban ao iniciar.
  loadAndRenderKanbanBoard()
})
