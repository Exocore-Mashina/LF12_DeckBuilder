namespace DeckbuilderBackend.Models.DTOs
{
    public class ScryfallCardDto
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public string OracleText { get; set; } = "";
        public string Color { get; set; } = "";
        public double Cmc { get; set; }

        public string Power { get; set; } = "";
        public string Toughness { get; set; } = "";

        public string TypeLine { get; set; } = "";
        public string Rarity { get; set; } = "";
        public string ScryfallUri { get; set; } = "";
    }
}
