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

const elements = document.querySelectorAll(".cards p")
const limit = 70
for (let p of elements) {
  const originalText = p.innerText // Guarda o texto original
  const aboveLimit = originalText.length > limit
  // Salva o texto original em um atributo de dado
  p.dataset.fullText = originalText

  if (aboveLimit) {
    // Trunca o texto apenas se for maior que o limite
    p.innerText = originalText.substring(0, limit) + "..."
  }

  // Adiciona uma classe para indicar que o card é clicável
  p.parentElement.classList.add("clickable-card")
}
const cards = document.querySelectorAll(".cards .clickable-card")

// Adiciona um evento de clique a cada card
cards.forEach((card) => {
  card.addEventListener("click", () => {
    // Encontra o parágrafo dentro do card clicado
    const p = card.querySelector("p")

    // Pega o texto completo do atributo de dado
    const fullText = p.dataset.fullText

    // Pega o texto truncado (o que está na tela)
    const currentText = p.innerText

    // Se o texto exibido for o truncado, mostra o completo
    if (currentText.endsWith("...")) {
      p.innerText = fullText
    } else {
      // Se o texto exibido for o completo, retorna para o truncado
      const aboveLimit = fullText.length > limit
      const dotsOrEmpty = aboveLimit ? "..." : ""
      p.innerText = fullText.substring(0, limit) + dotsOrEmpty
    }
  })
})
