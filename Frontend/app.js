const API_BASE_URL = "http://localhost:5020/api";
const CARD_SEARCH_URL = `${API_BASE_URL}/cards/search`;
const ADD_TO_DECK_URL = `${API_BASE_URL}/cards/add-to-deck`;
const REMOVE_FROM_DECK_URL = `${API_BASE_URL}/cards/remove-from-deck`;
const DECKS_URL = `${API_BASE_URL}/decks`;

let isLoading = false;
let decksCache = [];
let selectedDeckId = null;
let selectedDeckViewId = null;
let deckPage = 1;
let deckPageSize = 12;
let deckTotalCount = 0;

const grid = document.getElementById("cardGrid");
const deckGrid = document.getElementById("deckGrid");
const searchInput = document.getElementById("searchInput");
const colorFilter = document.getElementById("colorFilter");
const typeFilter = document.getElementById("typeFilter");
const rarityFilter = document.getElementById("rarityFilter");
const cmcFilter = document.getElementById("cmcFilter");
const powerFilter = document.getElementById("powerFilter");
const toughnessFilter = document.getElementById("toughnessFilter");
const searchBtn = document.getElementById("searchBtn");
const cardPageButton = document.getElementById("CardPage");
const deckPageButton = document.getElementById("DeckPage");
const cardsView = document.getElementById("cardsView");
const decksView = document.getElementById("decksView");
const searchArea = document.getElementById("searchArea");
const cardFilters = document.getElementById("cardFilters");
const deckSelect = document.getElementById("deckSelect");
const deckViewSelect = document.getElementById("deckViewSelect");
const deckSummary = document.getElementById("deckSummary");
const loadingOverlay = document.getElementById("loadingOverlay");
const cardEmptyState = document.getElementById("cardEmptyState");
const deckEmptyState = document.getElementById("deckEmptyState");
const deckCreateForm = document.getElementById("deckCreateForm");
const deckNameInput = document.getElementById("deckNameInput");
const deckDescriptionInput = document.getElementById("deckDescriptionInput");
const deckPagination = document.getElementById("deckPagination");
const deckPrevPage = document.getElementById("deckPrevPage");
const deckNextPage = document.getElementById("deckNextPage");
const deckPageInfo = document.getElementById("deckPageInfo");
const deckPageSizeSelect = document.getElementById("deckPageSize");

const normalizeColor = (raw) => {
    if (!raw) return "";
    const clean = raw.replace(/[\s;|\/]+/g, ",");
    const matches = clean.match(/[wubrgc]/gi);
    if (!matches) return "";
    const letters = Array.from(new Set(matches.map((m) => m.toUpperCase())));
    return letters.join(",");
};

const getCardImageUrl = (scryfallId) => {
    if (!scryfallId) return "";
    return `https://api.scryfall.com/cards/${scryfallId}?format=image&version=normal`;
};

const setLoading = (value) => {
    isLoading = value;
    loadingOverlay.classList.toggle("hidden", !value);
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 12000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
};

const updateDeckSelects = (decks) => {
    const renderOptions = (selectEl, includePlaceholder) => {
        selectEl.innerHTML = "";
        if (includePlaceholder) {
            const placeholder = document.createElement("option");
            placeholder.value = "";
            placeholder.textContent = "Deck auswählen";
            selectEl.appendChild(placeholder);
        }
        decks.forEach((deck) => {
            const option = document.createElement("option");
            option.value = deck.id;
            option.textContent = `${deck.name} (${deck.cardCount} Karten)`;
            selectEl.appendChild(option);
        });
    };

    renderOptions(deckSelect, true);
    renderOptions(deckViewSelect, true);
};

const loadDecks = async () => {
    try {
        setLoading(true);
        const response = await fetchWithTimeout(DECKS_URL);
        if (!response.ok) {
            console.error("Decks konnten nicht geladen werden.");
            return;
        }
        const decks = await response.json();
        decksCache = decks;
        updateDeckSelects(decksCache);
        if (!selectedDeckId && decksCache.length > 0) {
            selectedDeckId = String(decksCache[0].id);
            deckSelect.value = selectedDeckId;
        }
        if (!selectedDeckViewId && decksCache.length > 0) {
            selectedDeckViewId = String(decksCache[0].id);
            deckViewSelect.value = selectedDeckViewId;
        }
    } catch (error) {
        console.error("Deck-Liste konnte nicht geladen werden:", error);
    } finally {
        setLoading(false);
    }
};

const renderCards = (cards, mode) => {
    const targetGrid = mode === "deck" ? deckGrid : grid;
    const emptyState = mode === "deck" ? deckEmptyState : cardEmptyState;

    targetGrid.innerHTML = "";

    if (!cards || cards.length === 0) {
        emptyState.style.display = "block";
        return;
    }

    emptyState.style.display = "none";

    cards.forEach((card) => {
        const cardDiv = document.createElement("div");
        cardDiv.className = "card";

        const scryfallId = card.scryfallId || card.id || "";
        const imageUrl = getCardImageUrl(scryfallId);
        const name = card.name || "Unbekannte Karte";
        const quantity = card.quantity ? `x${card.quantity}` : "";

        cardDiv.innerHTML = `
            <img src="${imageUrl}" alt="${name}" loading="lazy" />
            ${quantity ? `<div class="quantity">${quantity}</div>` : ""}
        `;

        const actionButton = document.createElement("button");
        if (mode === "deck") {
            actionButton.textContent = "Entfernen";
            actionButton.addEventListener("click", () => removeCardFromDeck(scryfallId));
        } else {
            actionButton.textContent = "Hinzufügen";
            actionButton.addEventListener("click", () => addCardToDeck(scryfallId));
        }
        cardDiv.appendChild(actionButton);
        targetGrid.appendChild(cardDiv);
    });
};

const renderDeckSummary = (summary) => {
    if (!summary) {
        deckSummary.innerHTML = "";
        return;
    }

    const formatMap = (map) => {
        if (!map || Object.keys(map).length === 0) return "-";
        return Object.entries(map)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ");
    };

    deckSummary.innerHTML = `
        <div class="summary-card">
            <h3>Deck</h3>
            <p>${summary.name || "-"}</p>
        </div>
        <div class="summary-card">
            <h3>Karten insgesamt</h3>
            <p>${summary.totalCards ?? 0}</p>
        </div>
        <div class="summary-card">
            <h3>Durchschnittliches CMC</h3>
            <p>${summary.averageCmc?.toFixed(2) ?? "0.00"}</p>
        </div>
        <div class="summary-card">
            <h3>Farben</h3>
            <p>${formatMap(summary.colors)}</p>
        </div>
        <div class="summary-card">
            <h3>Typen</h3>
            <p>${formatMap(summary.types)}</p>
        </div>
        <div class="summary-card">
            <h3>Seltenheit</h3>
            <p>${formatMap(summary.rarities)}</p>
        </div>
    `;
};

async function loadCards() {
    const params = new URLSearchParams();
    const colorValue = normalizeColor(colorFilter.value);

    if (searchInput.value) params.append("name", searchInput.value);
    if (colorValue) params.append("color", colorValue);
    if (typeFilter.value) params.append("typeLine", typeFilter.value);
    if (rarityFilter.value) params.append("rarity", rarityFilter.value);
    if (cmcFilter && cmcFilter.value) params.append("cmc", cmcFilter.value);
    if (powerFilter && powerFilter.value) params.append("power", powerFilter.value);
    if (toughnessFilter && toughnessFilter.value) params.append("toughness", toughnessFilter.value);

    const url = `${CARD_SEARCH_URL}?${params.toString()}`;
    if (isLoading) return;
    setLoading(true);

    try {
        const response = await fetchWithTimeout(url);
        if (!response.ok) {
            console.error("Fehler beim Laden der Karten:", response.status);
            renderCards([], "cards");
            return;
        }

        const result = await response.json();
        const cards = (result.cards || []).slice(0, 40);
        renderCards(cards, "cards");
    } catch (err) {
        console.error("Netzwerkfehler beim Laden der Karten:", err);
        renderCards([], "cards");
    } finally {
        setLoading(false);
    }
}

async function loadDeckCards(deckId) {
    if (!deckId) {
        deckTotalCount = 0;
        renderCards([], "deck");
        renderDeckSummary(null);
        updateDeckPagination();
        return;
    }

    const url = `${DECKS_URL}/${deckId}/cards?page=${deckPage}&pageSize=${deckPageSize}`;

    try {
        setLoading(true);
        const response = await fetchWithTimeout(url);
        if (!response.ok) {
            console.error("Fehler beim Laden der Deck-Karten:", response.status);
            renderCards([], "deck");
            return;
        }
        const result = await response.json();
        deckTotalCount = result.totalCount ?? 0;
        deckPage = result.page ?? deckPage;
        renderCards(result.items || [], "deck");
        updateDeckPagination();
    } catch (error) {
        console.error("Deck-Karten konnten nicht geladen werden:", error);
        renderCards([], "deck");
        updateDeckPagination();
    } finally {
        setLoading(false);
    }
}

async function loadDeckSummary(deckId) {
    if (!deckId) {
        renderDeckSummary(null);
        return;
    }
    const url = `${DECKS_URL}/${deckId}/summary`;
    try {
        const response = await fetchWithTimeout(url);
        if (!response.ok) {
            renderDeckSummary(null);
            return;
        }
        const summary = await response.json();
        renderDeckSummary(summary);
    } catch (error) {
        console.error("Deck-Zusammenfassung konnte nicht geladen werden:", error);
        renderDeckSummary(null);
    }
}

async function addCardToDeck(scryfallId) {
    if (!selectedDeckId) {
        alert("Bitte zuerst ein Deck auswählen.");
        return;
    }
    const body = JSON.stringify({ deckId: Number(selectedDeckId), quantity: 1, scryfallId });
    try {
        setLoading(true);
        const response = await fetchWithTimeout(ADD_TO_DECK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body
        });

        if (!response.ok) {
            alert("Fehler beim Hinzufügen der Karte: " + response.status);
            return;
        }
        await response.json().catch(() => null);
        await loadDecks();
    } catch (err) {
        alert("Netzwerkfehler beim Hinzufügen der Karte: " + (err.message || err));
    } finally {
        setLoading(false);
    }
}

async function removeCardFromDeck(scryfallId) {
    if (!selectedDeckViewId) {
        alert("Bitte zuerst ein Deck auswählen.");
        return;
    }
    const body = JSON.stringify({ deckId: Number(selectedDeckViewId), quantity: 1, scryfallId });
    try {
        setLoading(true);
        const response = await fetchWithTimeout(REMOVE_FROM_DECK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body
        });
        if (!response.ok) {
            alert("Fehler beim Entfernen der Karte: " + response.status);
            return;
        }
        await response.json().catch(() => null);
        await loadDeckCards(selectedDeckViewId);
        await loadDeckSummary(selectedDeckViewId);
        await loadDecks();
    } catch (err) {
        alert("Netzwerkfehler beim Entfernen der Karte: " + (err.message || err));
    } finally {
        setLoading(false);
    }
}

const setActiveTab = (tab) => {
    if (tab === "cards") {
        cardsView.classList.add("active");
        decksView.classList.remove("active");
        cardPageButton.classList.add("active");
        deckPageButton.classList.remove("active");
        searchArea.classList.remove("hidden");
        cardFilters.classList.remove("hidden");
    } else {
        cardsView.classList.remove("active");
        decksView.classList.add("active");
        cardPageButton.classList.remove("active");
        deckPageButton.classList.add("active");
        searchArea.classList.add("hidden");
        cardFilters.classList.add("hidden");
    }
};

searchBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (searchBtn.disabled) return;
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
        try {
            searchBtn.disabled = true;
            await loadCards();
        } finally {
            searchBtn.disabled = false;
        }
    }
});

[ colorFilter, typeFilter, rarityFilter, cmcFilter, powerFilter, toughnessFilter ].forEach((f) => {
    f.onchange = () => {
        // Werte werden beim nächsten Such-Request berücksichtigt
    };
});

cardPageButton.addEventListener("click", () => {
    setActiveTab("cards");
});

deckPageButton.addEventListener("click", async () => {
    setActiveTab("decks");
    if (selectedDeckViewId) {
        await loadDeckCards(selectedDeckViewId);
        await loadDeckSummary(selectedDeckViewId);
    }
});

deckSelect.addEventListener("change", (event) => {
    selectedDeckId = event.target.value || null;
});

deckViewSelect.addEventListener("change", async (event) => {
    selectedDeckViewId = event.target.value || null;
    deckPage = 1;
    if (selectedDeckViewId) {
        await loadDeckCards(selectedDeckViewId);
        await loadDeckSummary(selectedDeckViewId);
    } else {
        renderCards([], "deck");
        renderDeckSummary(null);
        updateDeckPagination();
    }
});

const updateDeckPagination = () => {
    if (!selectedDeckViewId) {
        deckPagination.classList.add("hidden");
        return;
    }
    const totalPages = Math.max(1, Math.ceil(deckTotalCount / deckPageSize));
    deckPage = Math.min(deckPage, totalPages);
    deckPageInfo.textContent = `Seite ${deckPage} von ${totalPages}`;
    deckPrevPage.disabled = deckPage <= 1;
    deckNextPage.disabled = deckPage >= totalPages;
    deckPagination.classList.toggle("hidden", deckTotalCount === 0);
};

deckPrevPage.addEventListener("click", async () => {
    if (deckPage <= 1) return;
    deckPage -= 1;
    if (selectedDeckViewId) {
        await loadDeckCards(selectedDeckViewId);
    }
});

deckNextPage.addEventListener("click", async () => {
    const totalPages = Math.max(1, Math.ceil(deckTotalCount / deckPageSize));
    if (deckPage >= totalPages) return;
    deckPage += 1;
    if (selectedDeckViewId) {
        await loadDeckCards(selectedDeckViewId);
    }
});

deckPageSizeSelect.addEventListener("change", async (event) => {
    deckPageSize = Number(event.target.value) || 12;
    deckPage = 1;
    if (selectedDeckViewId) {
        await loadDeckCards(selectedDeckViewId);
    } else {
        updateDeckPagination();
    }
});

deckCreateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = deckNameInput.value.trim();
    const description = deckDescriptionInput.value.trim();
    if (!name) return;
    const body = JSON.stringify({ name, description: description || null });
    try {
        setLoading(true);
        const response = await fetchWithTimeout(`${DECKS_URL}/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body
        });
        if (!response.ok) {
            alert("Fehler beim Erstellen des Decks: " + response.status);
            return;
        }
        const deck = await response.json().catch(() => null);
        await loadDecks();
        if (deck && deck.id) {
            selectedDeckViewId = String(deck.id);
            deckViewSelect.value = selectedDeckViewId;
            selectedDeckId = String(deck.id);
            deckSelect.value = selectedDeckId;
            deckPage = 1;
            await loadDeckCards(selectedDeckViewId);
            await loadDeckSummary(selectedDeckViewId);
        }
        deckNameInput.value = "";
        deckDescriptionInput.value = "";
    } catch (error) {
        alert("Deck konnte nicht erstellt werden: " + (error.message || error));
    } finally {
        setLoading(false);
    }
});

loadDecks();
