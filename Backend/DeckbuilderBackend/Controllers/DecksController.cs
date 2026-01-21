using DeckbuilderBackend.Models.DTOs;
using DeckbuilderBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace DeckbuilderBackend.Controllers
{
    [ApiController]
    [Route("api/decks")]
    public class DecksController : ControllerBase
    {
        private readonly DeckService _deckService;

        public DecksController(DeckService deckService)
        {
            _deckService = deckService;
        }

        // GET: api/decks
        [HttpGet]
        public async Task<IActionResult> GetDecks()
        {
            var decks = await _deckService.GetAllDecksAsync();
            return Ok(decks);
        }

        // POST: api/decks/create
        [HttpPost("create")]
        public async Task<IActionResult> CreateDeck([FromBody] DeckDTO request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Deckname darf nicht leer sein.");

            var deck = await _deckService.CreateDeckAsync(request);
            return Ok(deck);
        }

        // GET: api/decks/{deckId}/cards
        [HttpGet("{deckId}/cards")]
        public async Task<IActionResult> GetDeckCards(int deckId)
        {
            var deck = await _deckService.GetDeckWithCardsAsync(deckId);
            if (deck == null) return NotFound();

            // Nur Karten, die im Deck gespeichert sind
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
    }
}
