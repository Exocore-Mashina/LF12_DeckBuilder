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
        /// Gibt ein Deck mit seinen Karten zurück (nur DB)
        /// </summary>
        public async Task<Deck?> GetDeckWithCardsAsync(int deckId)
        {
            return await _context.Decks
                .Include(d => d.DeckCards)
                    .ThenInclude(dc => dc.Card)
                .FirstOrDefaultAsync(d => d.Id == deckId);
        }
    }
}