using DeckbuilderBackend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/decks")]
public class DecksController : ControllerBase
{
    private readonly AppDbContext _context;

    public DecksController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/decks
    [HttpGet]
    public async Task<IActionResult> GetDecks()
    {
        var decks = await _context.Decks
            .Include(d => d.DeckCards)
                .ThenInclude(dc => dc.Card)
            .ToListAsync();

        return Ok(decks);
    }

    // POST: api/decks/create
    [HttpPost("create")]
    public async Task<IActionResult> NewDeck([FromBody] CreateDeckRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Deckname darf nicht leer sein.");

        Deck deck = new()
        {
            Name = request.Name,
            Description = request.Description ?? string.Empty
        };

        _context.Decks.Add(deck);
        await _context.SaveChangesAsync();
        return Ok(deck);
    }

    // GET: api/decks/{deckId}/cards
    [HttpGet("{deckId}/cards")]
    public async Task<IActionResult> GetDeckCards(int deckId)
    {
        var deck = await _context.Decks
            .Include(d => d.DeckCards)
                .ThenInclude(dc => dc.Card)
            .FirstOrDefaultAsync(d => d.Id == deckId);

        if (deck == null) return NotFound();

        // Optional: Nur relevante Daten zur�ckgeben
        var cards = deck.DeckCards.Select(dc => new
        {
            dc.Card.Id,
            dc.Card.Name,
            dc.Card.Color,
            dc.Card.CMC,
            dc.Card.Power,
            dc.Card.Toughness,
            dc.Card.TypeLine,
            dc.Card.Rarity,
            dc.Card.ScryfallURI,
            dc.Quantity
        });

        return Ok(cards);
    }

    public class CreateDeckRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
