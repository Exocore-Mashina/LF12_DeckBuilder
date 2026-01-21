let currentDecks = [];
let selectedDeckId = null;
let searchTimeout = null;

// Backend Basis-URL
const BASE_URL = 'http://localhost:5020'; // <-- hier Backend-URL prüfen

// ----------------- Deck erstellen -----------------
document.getElementById('create-deck-btn').addEventListener('click', async () => {
  const name = document.getElementById('deck-name').value.trim();
  if (!name) return alert("Bitte einen Decknamen eingeben.");

  try {
    const res = await fetch(`${BASE_URL}/decks`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name})
    });
    if (!res.ok) throw new Error("Fehler beim Erstellen des Decks");

    const deck = await res.json();
    currentDecks.push(deck);
    updateDeckSelect();
    document.getElementById('deck-message').textContent = `Deck "${deck.name}" erstellt!`;
    document.getElementById('deck-name').value = '';
  } catch (err) {
    console.error(err);
    alert("Fehler beim Erstellen des Decks.");
  }
});

// Select Menü aktualisieren
function updateDeckSelect() {
  const select = document.getElementById('deck-select');
  select.innerHTML = '';
  currentDecks.forEach(deck => {
    const option = document.createElement('option');
    option.value = deck.id;
    option.textContent = deck.name;
    select.appendChild(option);
  });
  if (currentDecks.length > 0) selectedDeckId = currentDecks[0].id;
  select.onchange = () => selectedDeckId = select.value;
}

// ----------------- Karte zum Deck hinzufügen -----------------
async function addCardToDeck(cardId) {
  if (!selectedDeckId) return alert("Bitte zuerst ein Deck auswählen.");
  try {
    const res = await fetch(`${BASE_URL}/decks/${selectedDeckId}/cards`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({cardId})
    });
    if (!res.ok) throw new Error("Fehler beim Hinzufügen der Karte");

    alert("Karte hinzugefügt!");
  } catch (err) {
    console.error(err);
    alert("Fehler beim Hinzufügen der Karte.");
  }
}

// ----------------- Karten suchen (Live-Suche) -----------------
async function searchCards(query) {
  if (!query) return;

  try {
    const res = await fetch(`${BASE_URL}/cards?search=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Fehler bei der Kartensuche");

    const cards = await res.json();
    const container = document.getElementById('search-results');
    container.innerHTML = '';

    if (cards.length === 0) {
      container.textContent = "Keine Karten gefunden.";
      return;
    }

    cards.forEach(card => {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <strong>${card.name}</strong><br>
        ${card.mana_cost ? `<em>${card.mana_cost}</em>` : ''}<br>
        <span>${card.type_line}</span><br>
        <button onclick='addCardToDeck("${card.id}")'>Zu Deck hinzufügen</button>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    alert("Fehler bei der Kartensuche.");
  }
}

// Live-Suche mit Debounce (300ms)
document.getElementById('card-search').addEventListener('input', (e) => {
  const query = e.target.value.trim();
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => searchCards(query), 300);
});

// ----------------- Initial Decks laden -----------------
as
