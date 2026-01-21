using System.ComponentModel.DataAnnotations;

namespace DeckbuilderBackend.Models
{
    public class DeckCard
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int DeckId { get; set; }

        [Required]
        public int CardId { get; set; }

        [Required]
        public int Quantity { get; set; }

        // Navigation Properties
        public Deck Deck { get; set; } = null!;
        public Card Card { get; set; } = null!;
    }
}