using DeckbuilderBackend.Models.DTOs;
using DeckbuilderBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace DeckbuilderBackend.Controllers
{
    [ApiController]
    [Route("api/cards")]
    public class CardsController : ControllerBase
    {
        private readonly CardService _cardService;

        public CardsController(CardService cardService)
        {
            _cardService = cardService;
        }

        /// <summary>
        /// Sucht Karten (immer über Scryfall). Keine DB Speicherung.
        /// </summary>
        [HttpGet("search")]
        public async Task<IActionResult> SearchCards(
            [FromQuery] string? name,
            [FromQuery] string? color,
            [FromQuery] string? typeLine,
            [FromQuery] string? rarity,
            [FromQuery] string? cmc,
            [FromQuery] string? power,
            [FromQuery] string? toughness,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var result = await _cardService.SearchCardsAsync(
                name,
                color,
                typeLine,
                rarity,
                cmc,
                power,
                toughness,
                page,
                pageSize);
            return Ok(result);
        }

        /// <summary>
        /// Fügt eine Karte einem Deck hinzu und speichert sie (falls nötig) in der DB.
        /// </summary>
        [HttpPost("add-to-deck")]
        public async Task<IActionResult> AddCardToDeck([FromBody] AddCardToDeckRequestDto request)
        {
            try
            {
                var deckCard = await _cardService.AddCardToDeckAsync(request.DeckId, request.ScryfallId, request.Quantity);
                return Ok(deckCard);
            }
            catch (InvalidOperationException ex)
            {
                // z.B. Deck existiert nicht
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                // z.B. Quantity <= 0
                return BadRequest(ex.Message);
            }
        }
    }
}
