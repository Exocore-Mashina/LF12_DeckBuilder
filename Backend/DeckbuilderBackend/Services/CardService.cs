using DeckbuilderBackend.Data;
using DeckbuilderBackend.Models;
using DeckbuilderBackend.Models.DTOs;
using DeckbuilderBackend.Services;
using Microsoft.EntityFrameworkCore;

namespace DeckbuilderBackend.Services
{
    public class CardService
    {
        private readonly AppDbContext _context;
        private readonly ScryfallService _scryfallService;

        public CardService(AppDbContext context, ScryfallService scryfallService)
        {
            _context = context;
            _scryfallService = scryfallService;
        }

        /// <summary>
        /// Sucht Karten ausschließlich über Scryfall.
        /// Es werden KEINE Karten in der Datenbank gespeichert.
        /// </summary>
        public Task<ScryfallSearchResultDto> SearchCardsAsync(
            string? name,
            string? color,
            string? typeLine,
            string? rarity,
            string? cmc,
            string? power,
            string? toughness,
            int page = 1,
            int pageSize = 50)
        {
            return _scryfallService.SearchAsync(name, color, typeLine, rarity, cmc, power, toughness, page, pageSize);
        }

        /// <summary>
        /// Fügt eine Karte einem Deck hinzu.
        /// Erst hier wird sie in der Datenbank gespeichert (falls noch nicht vorhanden).
        /// </summary>
        public async Task<DeckCard> AddCardToDeckAsync(int deckId, ScryfallCardDto dto, int quantity)
        {
            if (quantity <= 0)
                throw new ArgumentException("Quantity muss > 0 sein.", nameof(quantity));

            var deckExists = await _context.Decks.AnyAsync(d => d.Id == deckId);
            if (!deckExists)
                throw new InvalidOperationException($"Deck mit ID {deckId} existiert nicht.");

            // Mapping DTO → Entity
            var cardEntity = new Card
            {
                Name = dto.Name,
                CardText = dto.OracleText,
                Color = dto.Color,
                CMC = dto.Cmc,
                Power = dto.Power,
                Toughness = dto.Toughness,
                TypeLine = dto.TypeLine,
                Rarity = dto.Rarity,
                ScryfallURI = dto.ScryfallUri
            };

            // Für Schule ok: Identifikation über Name.
            // Besser wäre später: eindeutige Scryfall-ID speichern und damit abgleichen.
            var existingCard = await _context.Cards.FirstOrDefaultAsync(c => c.Name == cardEntity.Name);

            if (existingCard == null)
            {
                _context.Cards.Add(cardEntity);
                await _context.SaveChangesAsync();
                existingCard = cardEntity;
            }

            var deckCard = await _context.DeckCards
                .FirstOrDefaultAsync(dc => dc.DeckId == deckId && dc.CardId == existingCard.Id);

            if (deckCard != null)
            {
                deckCard.Quantity += quantity;
            }
            else
            {
                deckCard = new DeckCard
                {
                    DeckId = deckId,
                    CardId = existingCard.Id,
                    Quantity = quantity
                };
                _context.DeckCards.Add(deckCard);
            }

            await _context.SaveChangesAsync();
            return deckCard;
        }
    }
}
