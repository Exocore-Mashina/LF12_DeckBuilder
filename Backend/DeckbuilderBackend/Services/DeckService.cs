using System;
using System.Linq;
using DeckbuilderBackend.Data;
using DeckbuilderBackend.Models;
using DeckbuilderBackend.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace DeckbuilderBackend.Services
{
    public class DeckService
    {
        private readonly AppDbContext _context;

        public DeckService(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Erstellt ein neues Deck
        /// </summary>
        public async Task<Deck> CreateDeckAsync(DeckDTO request)
        {
            var deck = new Deck
            {
                Name = request.Name,
                Description = request.Description ?? string.Empty
            };
            _context.Decks.Add(deck);
            await _context.SaveChangesAsync();
            return deck;
        }

        /// <summary>
        /// Gibt alle Decks mit ihren Karten zurück (nur DB, keine externen Requests)
        /// </summary>
        public async Task<List<Deck>> GetAllDecksAsync()
        {
            return await _context.Decks
                .Include(d => d.DeckCards)
                    .ThenInclude(dc => dc.Card)
                .ToListAsync();
        }

        /// <summary>
        /// Gibt paginierte Karten eines Decks zurück (nur DB).
        /// </summary>
        public async Task<PagedResult<DeckCardListItemDto>?> GetDeckCardsAsync(int deckId, int page = 1, int pageSize = 50)
        {
            if (page < 1)
                throw new ArgumentOutOfRangeException(nameof(page), "Page muss >= 1 sein.");

            if (pageSize < 1)
                throw new ArgumentOutOfRangeException(nameof(pageSize), "PageSize muss >= 1 sein.");

            var deckExists = await _context.Decks.AnyAsync(d => d.Id == deckId);
            if (!deckExists)
                return null;

            var query = _context.DeckCards
                .Where(dc => dc.DeckId == deckId)
                .Include(dc => dc.Card)
                .OrderBy(dc => dc.Card.Name);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(dc => new DeckCardListItemDto
                {
                    Id = dc.Card.Id,
                    Name = dc.Card.Name,
                    Color = dc.Card.Color,
                    Cmc = dc.Card.CMC,
                    Power = dc.Card.Power,
                    Toughness = dc.Card.Toughness,
                    TypeLine = dc.Card.TypeLine,
                    Rarity = dc.Card.Rarity,
                    ScryfallUri = dc.Card.ScryfallURI,
                    Quantity = dc.Quantity
                })
                .ToListAsync();

            return new PagedResult<DeckCardListItemDto>
            {
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                Items = items
            };
        }
    }
}
