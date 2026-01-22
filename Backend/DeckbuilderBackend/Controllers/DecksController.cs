using DeckbuilderBackend.Models;
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
            List<DeckListItemDto> decks = await _deckService.GetAllDecksAsync();
            return Ok(decks);
        }

        // POST: api/decks/create
        [HttpPost("create")]
        public async Task<IActionResult> CreateDeck([FromBody] DeckDTO request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Deckname darf nicht leer sein.");

            Deck deck = await _deckService.CreateDeckAsync(request);
            return Ok(deck);
        }

        // GET: api/decks/{deckId}/cards
        [HttpGet("{deckId}/cards")]
        public async Task<IActionResult> GetDeckCards(
            int deckId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            PagedResult<DeckCardListItemDto>? result = await _deckService.GetDeckCardsAsync(deckId, page, pageSize);
            if (result == null) return NotFound();

            return Ok(result);
        }

        // GET: api/decks/{deckId}/summary
        [HttpGet("{deckId}/summary")]
        public async Task<IActionResult> GetDeckSummary(int deckId)
        {
            DeckSummaryDto? result = await _deckService.GetDeckSummaryAsync(deckId);
            if (result == null) return NotFound();

            return Ok(result);
        }
    }
}
