using Microsoft.EntityFrameworkCore;
using Deckbuilder_Backend.Models;

namespace Deckbuilder_Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Card> Cards => Set<Card>();
}
