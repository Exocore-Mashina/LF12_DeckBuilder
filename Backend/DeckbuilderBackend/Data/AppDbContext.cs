using DeckbuilderBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace DeckbuilderBackend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Card> Cards => Set<Card>();
    public DbSet<DeckCard> DeckCards => Set<DeckCard>();
    public DbSet<Deck> Decks => Set<Deck>();
}
