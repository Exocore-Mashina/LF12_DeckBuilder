using System.ComponentModel.DataAnnotations;

namespace DeckbuilderBackend.Models
{
    public class Card
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;
        public string CardText { get; set; } = string.Empty;

        public string Color { get; set; } = string.Empty;
        public double CMC { get; set; }

        public string Power { get; set; } = string.Empty;
        public string Toughness { get; set; } = string.Empty;

        public string TypeLine { get; set; } = string.Empty;
        public string Rarity { get; set; } = string.Empty;

        public string ScryfallURI { get; set; } = string.Empty;
    }
}