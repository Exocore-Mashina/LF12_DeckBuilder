namespace DeckbuilderBackend.Models.DTOs
{
    public class DeckListItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public int CardCount { get; set; }
    }
}
