namespace DeckbuilderBackend.Models.DTOs
{
    public class AddCardToDeckRequestDto
    {
        public int DeckId { get; set; }
        public int Quantity { get; set; }
        public string ScryfallId { get; set; } = "";
    }
}
