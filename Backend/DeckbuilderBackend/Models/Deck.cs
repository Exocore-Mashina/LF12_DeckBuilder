using System.ComponentModel.DataAnnotations;

namespace DeckbuilderBackend.Models
{
    public class Deck
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        // Navigation Property zu den DeckCards
        public ICollection<DeckCard> DeckCards { get; set; } = new List<DeckCard>();
    }
}