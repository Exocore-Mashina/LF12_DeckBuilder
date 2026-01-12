using DeckbuilderBackend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Deckbuilder_Backend.Controllers;

[ApiController]
[Route("api/cards")]
public class CardsController : ControllerBase
{
    private readonly AppDbContext _context;

    public CardsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/cards?name=x&color=y&typeLine=z&rarity=a&page=1
    [HttpGet]
    public async Task<IActionResult> GetFilteredCards(
        [FromQuery] string? name,
        [FromQuery] string? color,
        [FromQuery] string? typeLine,
        [FromQuery] string? rarity,
        [FromQuery] int page = 1)
    {
        const int pageSize = 50;

        var query = _context.Cards.AsQueryable();

        if (!string.IsNullOrEmpty(name))
            query = query.Where(c => EF.Functions.Like(c.Name, $"%{name}%"));
        if (!string.IsNullOrEmpty(color))
            query = query.Where(c => EF.Functions.Like(c.Color, $"%{color}%"));
        if (!string.IsNullOrEmpty(typeLine))
            query = query.Where(c => EF.Functions.Like(c.TypeLine, $"%{typeLine}%"));
        if (!string.IsNullOrEmpty(rarity))
            query = query.Where(c => EF.Functions.Like(c.Rarity, $"%{rarity}%"));

        var cardsInDb = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // Wenn weniger als 50 Karten in DB → fehlende Karten von Scryfall holen
        if (cardsInDb.Count < pageSize)
        {
            int needed = pageSize - cardsInDb.Count;

            var scryfallCards = await ScryfallService.GetCardsAsync(
                name, color, typeLine, rarity, needed);

            foreach (var sc in scryfallCards)
            {
                // Prüfen, ob Karte schon in DB ist
                if (!_context.Cards.Any(c => c.Name == sc.Name))
                {
                    _context.Cards.Add(sc);
                    cardsInDb.Add(sc);
                }
            }

            await _context.SaveChangesAsync();
        }

        return Ok(cardsInDb);
    }

    // POST: api/cards/add-to-deck
    [HttpPost("add-to-deck")]
    public async Task<IActionResult> AddCardToDeck([FromBody] AddCardRequest request)
    {
        // Karte prüfen / in DB speichern
        var card = await _context.Cards.FirstOrDefaultAsync(c => c.Name == request.Card.Name);
        if (card == null)
        {
            card = request.Card;
            _context.Cards.Add(card);
            await _context.SaveChangesAsync();
        }

        // Prüfen, ob Karte schon im Deck
        var deckCard = await _context.DeckCards
            .FirstOrDefaultAsync(dc => dc.DeckId == request.DeckId && dc.CardId == card.Id);

        if (deckCard != null)
        {
            deckCard.Quantity += request.Quantity;
        }
        else
        {
            deckCard = new DeckCard
            {
                DeckId = request.DeckId,
                CardId = card.Id,
                Quantity = request.Quantity
            };
            _context.DeckCards.Add(deckCard);
        }

        await _context.SaveChangesAsync();
        return Ok(deckCard);
    }

    public class AddCardRequest
    {
        public int DeckId { get; set; }
        public int Quantity { get; set; }
        public Card Card { get; set; } = null!;
    }
}
