import { useCallback, useEffect, useState } from "react";
import CardsView from "./components/CardsView.jsx";
import DecksView from "./components/DecksView.jsx";
import LoadingOverlay from "./components/LoadingOverlay.jsx";
import SearchFilters from "./components/SearchFilters.jsx";
import TopBar from "./components/TopBar.jsx";
import {
  ADD_TO_DECK_URL,
  CARD_SEARCH_URL,
  DECKS_URL,
  REMOVE_FROM_DECK_URL,
  fetchWithTimeout,
  normalizeColor
} from "./utils/api.js";

const DEFAULT_PAGE_SIZE = 12;

const App = () => {
  const [activeTab, setActiveTab] = useState("cards");
  const [isLoading, setIsLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [deckCards, setDeckCards] = useState([]);
  const [deckSummary, setDeckSummary] = useState(null);
  const [decks, setDecks] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [selectedDeckViewId, setSelectedDeckViewId] = useState("");
  const [cardsPage, setCardsPage] = useState(1);
  const [cardsPageSize, setCardsPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [cardsTotalCount, setCardsTotalCount] = useState(0);
  const [deckPage, setDeckPage] = useState(1);
  const [deckPageSize, setDeckPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [deckTotalCount, setDeckTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    color: "",
    typeLine: "",
    rarity: "",
    cmc: "",
    power: "",
    toughness: ""
  });

  const loadDecks = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithTimeout(DECKS_URL);
      if (!response.ok) {
        console.error("Decks konnten nicht geladen werden.");
        return;
      }
      const data = await response.json();
      setDecks(data);
      if (data.length > 0) {
        setSelectedDeckId((prev) => prev || String(data[0].id));
        setSelectedDeckViewId((prev) => prev || String(data[0].id));
      }
    } catch (error) {
      console.error("Deck-Liste konnte nicht geladen werden:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCards = useCallback(async () => {
    const params = new URLSearchParams();
    const colorValue = normalizeColor(filters.color);

    if (searchTerm) params.append("name", searchTerm);
    if (colorValue) params.append("color", colorValue);
    if (filters.typeLine) params.append("typeLine", filters.typeLine);
    if (filters.rarity) params.append("rarity", filters.rarity);
    if (filters.cmc) params.append("cmc", filters.cmc);
    if (filters.power) params.append("power", filters.power);
    if (filters.toughness) params.append("toughness", filters.toughness);

    const url = `${CARD_SEARCH_URL}?${params.toString()}`;

    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetchWithTimeout(url);
      if (!response.ok) {
        console.error("Fehler beim Laden der Karten:", response.status);
        setAllCards([]);
        return;
      }

      const result = await response.json();
      setAllCards(result.cards || []);
      setCardsPage(1);
    } catch (error) {
      console.error("Netzwerkfehler beim Laden der Karten:", error);
      setAllCards([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, isLoading, searchTerm]);

  const loadDeckCards = useCallback(
    async (deckId) => {
      if (!deckId) {
        setDeckTotalCount(0);
        setDeckCards([]);
        return;
      }

      const url = `${DECKS_URL}/${deckId}/cards?page=${deckPage}&pageSize=${deckPageSize}`;

      try {
        setIsLoading(true);
        const response = await fetchWithTimeout(url);
        if (!response.ok) {
          console.error("Fehler beim Laden der Deck-Karten:", response.status);
          setDeckCards([]);
          return;
        }
        const result = await response.json();
        setDeckTotalCount(result.totalCount ?? 0);
        setDeckPage(result.page ?? deckPage);
        setDeckCards(result.items || []);
      } catch (error) {
        console.error("Deck-Karten konnten nicht geladen werden:", error);
        setDeckCards([]);
      } finally {
        setIsLoading(false);
      }
    },
    [deckPage, deckPageSize]
  );

  const loadDeckSummary = useCallback(async (deckId) => {
    if (!deckId) {
      setDeckSummary(null);
      return;
    }
    const url = `${DECKS_URL}/${deckId}/summary`;
    try {
      const response = await fetchWithTimeout(url);
      if (!response.ok) {
        setDeckSummary(null);
        return;
      }
      const summary = await response.json();
      setDeckSummary(summary);
    } catch (error) {
      console.error("Deck-Zusammenfassung konnte nicht geladen werden:", error);
      setDeckSummary(null);
    }
  }, []);

  const addCardToDeck = async (scryfallId) => {
    if (!selectedDeckId) {
      alert("Bitte zuerst ein Deck auswählen.");
      return;
    }
    const body = JSON.stringify({
      deckId: Number(selectedDeckId),
      quantity: 1,
      scryfallId
    });
    try {
      setIsLoading(true);
      const response = await fetchWithTimeout(ADD_TO_DECK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });

      if (!response.ok) {
        alert(`Fehler beim Hinzufügen der Karte: ${response.status}`);
        return;
      }
      await response.json().catch(() => null);
      await loadDecks();
    } catch (error) {
      alert(`Netzwerkfehler beim Hinzufügen der Karte: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const removeCardFromDeck = async (scryfallId) => {
    if (!selectedDeckViewId) {
      alert("Bitte zuerst ein Deck auswählen.");
      return;
    }
    const body = JSON.stringify({
      deckId: Number(selectedDeckViewId),
      quantity: 1,
      scryfallId
    });
    try {
      setIsLoading(true);
      const response = await fetchWithTimeout(REMOVE_FROM_DECK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });
      if (!response.ok) {
        alert(`Fehler beim Entfernen der Karte: ${response.status}`);
        return;
      }
      await response.json().catch(() => null);
      await loadDeckCards(selectedDeckViewId);
      await loadDeckSummary(selectedDeckViewId);
      await loadDecks();
    } catch (error) {
      alert(`Netzwerkfehler beim Entfernen der Karte: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeckCreate = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const name = String(formData.get("deckNameInput") || "").trim();
    const description = String(formData.get("deckDescriptionInput") || "").trim();
    if (!name) return;
    const body = JSON.stringify({ name, description: description || null });
    try {
      setIsLoading(true);
      const response = await fetchWithTimeout(`${DECKS_URL}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });
      if (!response.ok) {
        alert(`Fehler beim Erstellen des Decks: ${response.status}`);
        return;
      }
      const deck = await response.json().catch(() => null);
      await loadDecks();
      if (deck?.id) {
        const deckId = String(deck.id);
        setSelectedDeckViewId(deckId);
        setSelectedDeckId(deckId);
        setDeckPage(1);
        await loadDeckCards(deckId);
        await loadDeckSummary(deckId);
      }
      event.target.reset();
    } catch (error) {
      alert(`Deck konnte nicht erstellt werden: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  useEffect(() => {
    if (activeTab !== "decks") {
      return;
    }
    loadDeckCards(selectedDeckViewId);
    loadDeckSummary(selectedDeckViewId);
  }, [
    activeTab,
    deckPage,
    deckPageSize,
    loadDeckCards,
    loadDeckSummary,
    selectedDeckViewId
  ]);

  useEffect(() => {
    const total = allCards.length;
    const totalPages = Math.max(1, Math.ceil(total / cardsPageSize));
    const safePage = Math.min(cardsPage, totalPages);
    if (safePage !== cardsPage) {
      setCardsPage(safePage);
      return;
    }
    const start = (safePage - 1) * cardsPageSize;
    setCardsTotalCount(total);
    setCards(allCards.slice(start, start + cardsPageSize));
  }, [allCards, cardsPage, cardsPageSize]);

  return (
    <div className="min-h-screen pb-12">
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onSearchSubmit={loadCards}
      />

      {activeTab === "cards" ? (
        <SearchFilters
          filters={filters}
          deckId={selectedDeckId}
          deckOptions={decks}
          onFiltersChange={setFilters}
          onDeckChange={setSelectedDeckId}
          onSearch={loadCards}
        />
      ) : null}

      {activeTab === "cards" ? (
        <CardsView
          cards={cards}
          onAddCard={addCardToDeck}
          pagination={{
            isVisible: cardsTotalCount > 0,
            page: cardsPage,
            totalCount: cardsTotalCount,
            pageSize: cardsPageSize,
            onPrev: () => setCardsPage((prev) => Math.max(prev - 1, 1)),
            onNext: () => {
              const totalPages = Math.max(
                1,
                Math.ceil(cardsTotalCount / cardsPageSize)
              );
              setCardsPage((prev) => Math.min(prev + 1, totalPages));
            },
            onPageSizeChange: (value) => {
              setCardsPageSize(value);
              setCardsPage(1);
            }
          }}
        />
      ) : (
        <DecksView
          decks={decks}
          selectedDeckId={selectedDeckViewId}
          onDeckChange={(deckId) => {
            setSelectedDeckViewId(deckId);
            setDeckPage(1);
          }}
          onDeckCreate={handleDeckCreate}
          deckSummary={deckSummary}
          deckCards={deckCards}
          onRemoveCard={removeCardFromDeck}
          deckPagination={{
            isVisible: Boolean(selectedDeckViewId) && deckTotalCount > 0,
            page: deckPage,
            totalCount: deckTotalCount,
            pageSize: deckPageSize,
            onPrev: () => setDeckPage((prev) => Math.max(prev - 1, 1)),
            onNext: () => {
              const totalPages = Math.max(
                1,
                Math.ceil(deckTotalCount / deckPageSize)
              );
              setDeckPage((prev) => Math.min(prev + 1, totalPages));
            },
            onPageSizeChange: (value) => {
              setDeckPageSize(value);
              setDeckPage(1);
            }
          }}
        />
      )}

      <LoadingOverlay isVisible={isLoading} />
    </div>
  );
};

export default App;
