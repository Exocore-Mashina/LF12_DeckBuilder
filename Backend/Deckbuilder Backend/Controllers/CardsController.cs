using Deckbuilder_Backend.Data;
using Deckbuilder_Backend.Models;
using Microsoft.AspNetCore.Mvc;

namespace Deckbuilder_Backend.Controllers;

[ApiController]
[Route("api/cards")]
public class CardsController : ControllerBase
{
    private readonly AppDbContext _context;

    public CardsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult GetAll()
    {
        return Ok(_context.Cards.ToList());
    }

    [HttpPost]
    public IActionResult Create(Card card)
    {
        _context.Cards.Add(card);
        _context.SaveChanges();
        return Ok(card);
    }
}
