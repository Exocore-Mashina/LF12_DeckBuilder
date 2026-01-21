namespace DeckbuilderBackend.Models.DTOs
{
    public class RemoveCardFromDeckRequestDto
    {
        public int DeckId { get; set; }
        public string ScryfallId { get; set; } = "";
        public int Quantity { get; set; } = 1;
    }
}
