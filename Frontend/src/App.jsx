import { useCallback, useEffect, useState } from "react";
import CardsView from "./components/CardsView.jsx";
import DecksView from "./components/DecksView.jsx";
import LoadingOverlay from "./components/LoadingOverlay.jsx";
import SearchFilters from "./components/SearchFilters.jsx";
import TopBar from "./components/TopBar.jsx";
import {
  buildCardSearchParams,
  addCardToDeckRequest,
  createDeck,
  fetchCards,
  fetchDeckCards,
  fetchDeckSummary,
  fetchDecks,
  removeCardFromDeckRequest
} from "./utils/api.js";

const CARDS_PAGE_SIZE = 20;
const DECK_PAGE_SIZE = 20;

const App = () => {
  const [activeTab, setActiveTab] = useState("cards");
  const [isLoading, setIsLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [deckCards, setDeckCards] = useState([]);
  const [deckSummary, setDeckSummary] = useState(null);
  const [decks, setDecks] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [selectedDeckViewId, setSelectedDeckViewId] = useState("");
  const [cardsPage, setCardsPage] = useState(1);
  const [cardsTotalCount, setCardsTotalCount] = useState(0);
  const [deckPage, setDeckPage] = useState(1);
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
      const response = await fetchDecks();
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

  const loadCards = useCallback(async (requestedPage = 1) => {
    const params = buildCardSearchParams({
      searchTerm,
      filters,
      page: requestedPage,
      pageSize: CARDS_PAGE_SIZE
    });

    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetchCards(params);
      if (!response.ok) {
        console.error("Fehler beim Laden der Karten:", response.status);
        setCards([]);
        setCardsTotalCount(0);
        return;
      }

      const result = await response.json();
      setCards(result.cards || []);
      setCardsTotalCount(result.totalCards ?? 0);
      setCardsPage(result.page ?? requestedPage);
    } catch (error) {
      console.error("Netzwerkfehler beim Laden der Karten:", error);
      setCards([]);
      setCardsTotalCount(0);
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

      try {
        setIsLoading(true);
        const response = await fetchDeckCards(deckId, deckPage, DECK_PAGE_SIZE);
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
    [deckPage]
  );

  const loadDeckSummary = useCallback(async (deckId) => {
    if (!deckId) {
      setDeckSummary(null);
      return;
    }
    try {
      const response = await fetchDeckSummary(deckId);
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
    try {
      setIsLoading(true);
      const response = await addCardToDeckRequest(selectedDeckId, scryfallId);

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
    try {
      setIsLoading(true);
      const response = await removeCardFromDeckRequest(
        selectedDeckViewId,
        scryfallId
      );
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
    if (!name) return;
    try {
      setIsLoading(true);
      const response = await createDeck(name);
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
    loadDeckCards,
    loadDeckSummary,
    selectedDeckViewId
  ]);

  return (
    <div className="min-h-screen pb-12">
        <TopBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSearchSubmit={() => loadCards(1)}
        />

      {activeTab === "cards" ? (
        <SearchFilters
          filters={filters}
          deckId={selectedDeckId}
          deckOptions={decks}
          onFiltersChange={setFilters}
          onDeckChange={setSelectedDeckId}
          onSearch={() => loadCards(1)}
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
            pageSize: CARDS_PAGE_SIZE,
            onPrev: () => {
              const prevPage = Math.max(cardsPage - 1, 1);
              setCardsPage(prevPage);
              loadCards(prevPage);
            },
            onNext: () => {
              const totalPages = Math.max(
                1,
                Math.ceil(cardsTotalCount / CARDS_PAGE_SIZE)
              );
              const nextPage = Math.min(cardsPage + 1, totalPages);
              setCardsPage(nextPage);
              loadCards(nextPage);
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
            pageSize: DECK_PAGE_SIZE,
            onPrev: () => setDeckPage((prev) => Math.max(prev - 1, 1)),
            onNext: () => {
              const totalPages = Math.max(
                1,
                Math.ceil(deckTotalCount / DECK_PAGE_SIZE)
              );
              setDeckPage((prev) => Math.min(prev + 1, totalPages));
            }
          }}
        />
      )}

      <LoadingOverlay isVisible={isLoading} />
    </div>
  );
};

export default App;
