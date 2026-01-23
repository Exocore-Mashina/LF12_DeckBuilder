using System;
using System.Collections.Generic;
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
            Deck deck = new()
            {
                Name = request.Name,
                Description = request.Description ?? string.Empty
            };
            _context.Decks.Add(deck);
            await _context.SaveChangesAsync();
            return deck;
        }

        /// <summary>
        /// Gibt alle Decks zurück.
        /// </summary>
        public async Task<List<DeckListItemDto>> GetAllDecksAsync()
        {
            return await _context.Decks
                .Select(deck => new DeckListItemDto
                {
                    Id = deck.Id,
                    Name = deck.Name,
                    Description = deck.Description,
                    CardCount = deck.DeckCards.Sum(dc => dc.Quantity)
                })
                .ToListAsync();
        }

        /// <summary>
        /// Gibt paginierte Karten eines Decks zurück.
        /// </summary>
        public async Task<PagedResult<DeckCardListItemDto>?> GetDeckCardsAsync(int deckId, int page = 1, int pageSize = 50)
        {
            if (page < 1)
                throw new ArgumentOutOfRangeException(nameof(page), "Page muss >= 1 sein.");

            if (pageSize < 1)
                throw new ArgumentOutOfRangeException(nameof(pageSize), "PageSize muss >= 1 sein.");

            bool deckExists = await _context.Decks.AnyAsync(d => d.Id == deckId);
            if (!deckExists)
                return null;

            IQueryable<DeckCard> query = _context.DeckCards
                .Where(dc => dc.DeckId == deckId)
                .Include(dc => dc.Card)
                .OrderBy(dc => dc.Card.Name);

            int totalCount = await query.CountAsync();

            List<DeckCardListItemDto> items = await query
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
                    ScryfallId = dc.Card.ScryfallId,
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

        /// <summary>
        /// Gibt eine Zusammenfassung eines Decks zurück.
        /// </summary>
        public async Task<DeckSummaryDto?> GetDeckSummaryAsync(int deckId)
        {
            Deck? deck = await _context.Decks
                .Include(d => d.DeckCards)
                .ThenInclude(dc => dc.Card)
                .FirstOrDefaultAsync(d => d.Id == deckId);

            if (deck == null)
                return null;

            int totalCards = deck.DeckCards.Sum(dc => dc.Quantity);
            double totalCmc = deck.DeckCards.Sum(dc => dc.Card.CMC * dc.Quantity);

            Dictionary<string, int> colors = new();
            Dictionary<string, int> types = new();
            Dictionary<string, int> rarities = new();

            foreach (DeckCard deckCard in deck.DeckCards)
            {
                Card card = deckCard.Card;
                int quantity = deckCard.Quantity;

                string[] colorTokens = string.IsNullOrWhiteSpace(card.Color)
                    ? new[] { "C" }
                    : card.Color.Split(",", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

                foreach (string color in colorTokens)
                {
                    if (!colors.ContainsKey(color))
                        colors[color] = 0;
                    colors[color] += quantity;
                }

                string typeLine = card.TypeLine ?? string.Empty;
                string[] typeLabels = new[]
                {
                    "Creature",
                    "Instant",
                    "Sorcery",
                    "Artifact",
                    "Enchantment",
                    "Planeswalker",
                    "Land"
                };

                bool matchedAny = false;
                foreach (string type in typeLabels)
                {
                    if (typeLine.Contains(type, StringComparison.OrdinalIgnoreCase))
                    {
                        matchedAny = true;
                        if (!types.ContainsKey(type))
                            types[type] = 0;
                        types[type] += quantity;
                    }
                }

                if (!matchedAny)
                {
                    if (!types.ContainsKey("Other"))
                        types["Other"] = 0;
                    types["Other"] += quantity;
                }

                string rarity = string.IsNullOrWhiteSpace(card.Rarity) ? "Unknown" : card.Rarity;
                if (!rarities.ContainsKey(rarity))
                    rarities[rarity] = 0;
                rarities[rarity] += quantity;
            }

            return new DeckSummaryDto
            {
                DeckId = deck.Id,
                Name = deck.Name,
                TotalCards = totalCards,
                AverageCmc = totalCards == 0 ? 0 : totalCmc / totalCards,
                Colors = colors,
                Types = types,
                Rarities = rarities
            };
        }
    }
}
