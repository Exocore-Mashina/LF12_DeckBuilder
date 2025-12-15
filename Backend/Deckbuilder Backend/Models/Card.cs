namespace Deckbuilder_Backend.Models;

public class Card
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int Cost { get; set; }
}
