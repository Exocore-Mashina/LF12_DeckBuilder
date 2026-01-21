using System.Collections.Generic;

namespace DeckbuilderBackend.Models.DTOs
{
    public class DeckSummaryDto
    {
        public int DeckId { get; set; }
        public string Name { get; set; } = "";
        public int TotalCards { get; set; }
        public double AverageCmc { get; set; }
        public Dictionary<string, int> Colors { get; set; } = new();
        public Dictionary<string, int> Types { get; set; } = new();
        public Dictionary<string, int> Rarities { get; set; } = new();
    }
}
