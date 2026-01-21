const BASE_URL = "http://localhost:5020/api/cards"; // ggf. anpassen
let currentPage = 1;
let isLoading = false;

// Elemente
const grid = document.getElementById("cardGrid");
const searchInput = document.getElementById("searchInput");
const colorFilter = document.getElementById("colorFilter");
const typeFilter = document.getElementById("typeFilter");
const rarityFilter = document.getElementById("rarityFilter");
const cmcFilter = document.getElementById("cmcFilter");
const powerFilter = document.getElementById("powerFilter");
const toughnessFilter = document.getElementById("toughnessFilter");
const searchBtn = document.getElementById("searchBtn");

// Karten laden
async function loadCards() {
    const params = new URLSearchParams();

    const normalizeColor = (raw) => {
        if (!raw) return "";
        // Accept only color letters w,u,b,r,g,c (case-insensitive). Extract letters and return unique comma-separated uppercase list.
        const clean = raw.replace(/[\s;|\/]+/g, ",");
        const matches = clean.match(/[wubrgc]/gi);
        if (!matches) return "";
        const letters = Array.from(new Set(matches.map(m => m.toUpperCase())));
        return letters.join(",");
    };

    const colorValue = normalizeColor(colorFilter.value);

    if (searchInput.value) params.append("name", searchInput.value);
    if (colorValue) params.append("color", colorValue);
    if (typeFilter.value) params.append("typeLine", typeFilter.value);
    if (rarityFilter.value) params.append("rarity", rarityFilter.value);
    if (cmcFilter && cmcFilter.value) params.append("cmc", cmcFilter.value);
    if (powerFilter && powerFilter.value) params.append("power", powerFilter.value);
    if (toughnessFilter && toughnessFilter.value) params.append("toughness", toughnessFilter.value);

    const url = `${BASE_URL}?${params.toString()}`;
    if (isLoading) return; // prevent concurrent requests
    isLoading = true;
    const controller = new AbortController();
    const timeoutMs = 10000; // 10s timeout
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
            const text = await response.text().catch(() => "<no body>");
            alert("Fehler beim Laden der Karten: " + response.status);
            return;
        }

        const cards = await response.json();
        renderCards(cards);
    } catch (err) {
        if (err.name === 'AbortError') {
            alert('Die Anfrage hat zu lange gedauert und wurde abgebrochen.');
        } else {
            alert("Netzwerkfehler beim Laden der Karten: " + (err.message || err));
        }
    } finally {
        clearTimeout(timeoutId);
        isLoading = false;
    }
}

// Karten anzeigen (4x10 Grid)
function renderCards(cards) {
    grid.innerHTML = "";

    cards.slice(0, 40).forEach(card => {
        const cardDiv = document.createElement("div");
        cardDiv.className = "card";

            const scryUrl = card.scryfallURI || card.ScryfallURI || "";

            cardDiv.innerHTML = `
                <div class="card-name"><a href="${scryUrl}" target="_blank" rel="noopener noreferrer">${card.name}</a></div>
                <button onclick='addCardToDeck("${card.name.replace(/\"/g, '\\\"')}")'>Hinzufügen</button>
            `;

        grid.appendChild(cardDiv);
    });
}

// Karte zum Deck hinzufügen
async function addCardToDeck(cardName) {
    const url = `${BASE_URL}/add-to-deck`;
    const body = JSON.stringify({ deckId: 1, quantity: 1, card: { name: cardName } });
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            signal: controller.signal
        });

        if (!response.ok) {
            alert("Fehler beim Hinzufügen der Karte: " + response.status);
            return;
        }
        await response.json().catch(() => null);
    } catch (err) {
        if (err.name === 'AbortError') {
            alert('Die Anfrage zum Hinzufügen der Karte wurde abgebrochen (Timeout).');
        } else {
            alert("Netzwerkfehler beim Hinzufügen der Karte: " + (err.message || err));
        }
    }
}

// Events
searchBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (searchBtn.disabled) return;
    currentPage = 1;
    try {
        searchBtn.disabled = true;
        await loadCards();
    } finally {
        searchBtn.disabled = false;
    }
});

searchInput.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        if (searchBtn.disabled) return;
        currentPage = 1;
        try {
            searchBtn.disabled = true;
            await loadCards();
        } finally {
            searchBtn.disabled = false;
        }
    }
});

// Keine automatischen Requests bei Filter-Änderung: Requests nur bei Button oder Enter
[colorFilter, typeFilter, rarityFilter].forEach(f =>
    f.onchange = () => {
        currentPage = 1; // Filterwerte werden beim nächsten Such-Request berücksichtigt
    }
);

// Hinweis: kein automatischer Initial-Load. Requests laufen nur bei Klick auf 'Suchen' oder Enter.
