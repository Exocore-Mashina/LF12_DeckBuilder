export const API_BASE_URL = "http://localhost:5020/api";

export const CARD_SEARCH_URL = `${API_BASE_URL}/cards/search`;
export const ADD_TO_DECK_URL = `${API_BASE_URL}/cards/add-to-deck`;
export const REMOVE_FROM_DECK_URL = `${API_BASE_URL}/cards/remove-from-deck`;
export const DECKS_URL = `${API_BASE_URL}/decks`;

export const normalizeColor = (raw) => {
  if (!raw) return "";
  const clean = raw.replace(/[\s;|/]+/g, ",");
  const matches = clean.match(/[wubrgc]/gi);
  if (!matches) return "";
  const letters = Array.from(new Set(matches.map((m) => m.toUpperCase())));
  return letters.join(",");
};

export const getCardImageUrl = (scryfallId) => {
  if (!scryfallId) return "";
  return `https://api.scryfall.com/cards/${scryfallId}?format=image&version=normal`;
};

export const fetchWithTimeout = async (url, options = {}, timeoutMs = 12000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const buildCardSearchParams = ({
  searchTerm,
  filters,
  page,
  pageSize
}) => {
  const params = new URLSearchParams();
  const colorValue = normalizeColor(filters?.color);

  if (searchTerm) params.append("name", searchTerm);
  if (colorValue) params.append("color", colorValue);
  if (filters?.typeLine) params.append("typeLine", filters.typeLine);
  if (filters?.rarity) params.append("rarity", filters.rarity);
  if (filters?.cmc) params.append("cmc", filters.cmc);
  if (filters?.power) params.append("power", filters.power);
  if (filters?.toughness) params.append("toughness", filters.toughness);
  params.append("page", String(page));
  params.append("pageSize", String(pageSize));

  return params.toString();
};

export const fetchDecks = () => fetchWithTimeout(DECKS_URL);

export const fetchCards = (params) =>
  fetchWithTimeout(`${CARD_SEARCH_URL}?${params}`);

export const fetchDeckCards = (deckId, page, pageSize) =>
  fetchWithTimeout(`${DECKS_URL}/${deckId}/cards?page=${page}&pageSize=${pageSize}`);

export const fetchDeckSummary = (deckId) =>
  fetchWithTimeout(`${DECKS_URL}/${deckId}/summary`);

export const createDeck = (name) =>
  fetchWithTimeout(`${DECKS_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });

export const addCardToDeckRequest = (deckId, scryfallId) =>
  fetchWithTimeout(ADD_TO_DECK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deckId: Number(deckId), quantity: 1, scryfallId })
  });

export const removeCardFromDeckRequest = (deckId, scryfallId) =>
  fetchWithTimeout(REMOVE_FROM_DECK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deckId: Number(deckId), quantity: 1, scryfallId })
  });
