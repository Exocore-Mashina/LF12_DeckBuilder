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
        public async Task<DeckCard> AddCardToDeckAsync(int deckId, string scryfallId, int quantity)
        {
            if (quantity <= 0)
                throw new ArgumentException("Quantity muss > 0 sein.", nameof(quantity));

            if (string.IsNullOrWhiteSpace(scryfallId))
                throw new ArgumentException("ScryfallId darf nicht leer sein.", nameof(scryfallId));

            bool deckExists = await _context.Decks.AnyAsync(d => d.Id == deckId);
            if (!deckExists)
                throw new InvalidOperationException($"Deck mit ID {deckId} existiert nicht.");

            Card? existingCard = await _context.Cards.FirstOrDefaultAsync(c => c.ScryfallId == scryfallId);

            if (existingCard == null)
            {
                ScryfallCardDto dto = await _scryfallService.GetCardByIdAsync(scryfallId);

                Card cardEntity = new Card
                {
                    Name = dto.Name,
                    CardText = dto.OracleText,
                    ScryfallId = dto.Id,
                    Color = dto.Color,
                    CMC = dto.Cmc,
                    Power = dto.Power,
                    Toughness = dto.Toughness,
                    TypeLine = dto.TypeLine,
                    Rarity = dto.Rarity,
                    ScryfallURI = dto.ScryfallUri
                };

                _context.Cards.Add(cardEntity);
                await _context.SaveChangesAsync();
                existingCard = cardEntity;
            }

            DeckCard? deckCard = await _context.DeckCards
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

        /// <summary>
        /// Entfernt eine Karte aus einem Deck (reduziert Quantity oder löscht Eintrag).
        /// </summary>
        public async Task<DeckCard?> RemoveCardFromDeckAsync(int deckId, string scryfallId, int quantity)
        {
            if (quantity <= 0)
                throw new ArgumentException("Quantity muss > 0 sein.", nameof(quantity));

            if (string.IsNullOrWhiteSpace(scryfallId))
                throw new ArgumentException("ScryfallId darf nicht leer sein.", nameof(scryfallId));

            bool deckExists = await _context.Decks.AnyAsync(d => d.Id == deckId);
            if (!deckExists)
                throw new InvalidOperationException($"Deck mit ID {deckId} existiert nicht.");

            Card? card = await _context.Cards.FirstOrDefaultAsync(c => c.ScryfallId == scryfallId);
            if (card == null)
                throw new InvalidOperationException("Karte ist nicht in der Datenbank vorhanden.");

            DeckCard? deckCard = await _context.DeckCards
                .FirstOrDefaultAsync(dc => dc.DeckId == deckId && dc.CardId == card.Id);

            if (deckCard == null)
                throw new InvalidOperationException("Karte ist nicht im Deck vorhanden.");

            if (deckCard.Quantity <= quantity)
            {
                _context.DeckCards.Remove(deckCard);
                await _context.SaveChangesAsync();
                return null;
            }

            deckCard.Quantity -= quantity;
            await _context.SaveChangesAsync();
            return deckCard;
        }
    }
}
