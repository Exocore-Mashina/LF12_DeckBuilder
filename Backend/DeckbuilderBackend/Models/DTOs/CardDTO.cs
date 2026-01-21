namespace DeckbuilderBackend.Models.DTOs
{
    public class CardDTO
    {
        public int DeckId { get; set; }
        public int Quantity { get; set; }
        public Card Card { get; set; } = null!;
    }
}
