namespace DeckbuilderBackend.Models.DTOs
{
    public class CardDTO
    {
        public int DeckId { get; set; }
        public int Quantity { get; set; }

        // Wir schicken die Karte aus der Suche (Scryfall-Daten) an Add-to-deck:
        public ScryfallCardDto Card { get; set; } = null!;
    }
}
