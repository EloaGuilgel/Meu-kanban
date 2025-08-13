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

document.addEventListener("DOMContentLoaded", loadState)
