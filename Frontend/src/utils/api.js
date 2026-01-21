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
