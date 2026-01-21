using DeckbuilderBackend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using System.Linq;
using System.Net;
using DeckbuilderBackend.Models.DTOs;

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

    [HttpGet("/getallcards")]
    public async Task<IActionResult> GetAllAsync()
    {
        
        return Ok(await _context.Cards.Take(1000).ToListAsync());
    }
    // GET: api/cards?name=x&color=y&typeLine=z&rarity=a&cmc=>=3&power=>=3&toughness=<4&page=1
    [HttpGet]
    public async Task<IActionResult> GetFilteredCards(
        [FromQuery] string? name,
        [FromQuery] string? color,
        [FromQuery] string? typeLine,
        [FromQuery] string? rarity,
        [FromQuery] string? cmc,
        [FromQuery] string? power,
        [FromQuery] string? toughness)
    {
        const int resultLimit = 40;

        var query = _context.Cards.AsQueryable();

        // Case-insensitive filtering
        if (!string.IsNullOrEmpty(name))
        {
            var nameLower = name.ToLowerInvariant();
            query = query.Where(c => c.Name.ToLower().Contains(nameLower));
        }

        if (!string.IsNullOrEmpty(color))
        {
            // Decode URL-encoded values (e.g. R%2CU -> R,U) and support prefixes like "c:rg"
            var col = WebUtility.UrlDecode(color ?? string.Empty).Trim();
            if (col.StartsWith("c:", StringComparison.OrdinalIgnoreCase))
                col = col.Substring(2).Trim();

            // Normalize separators to comma and remove spaces
            col = Regex.Replace(col, "[\\s;|/]+", ",");

            // Split on commas and normalize separators; accept only single-letter color codes
            var parts = col.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(p => p.Trim())
                .Where(p => p.Length > 0)
                .ToList();

            // Extract single-letter color codes (w u b r g c) from the parts
            var letters = Regex.Matches(string.Join(",", parts), "[wubrgc]", RegexOptions.IgnoreCase)
                .Select(m => m.Value.ToUpperInvariant())
                .Distinct()
                .ToList();

            if (letters.Count > 0)
            {
                // Require that each specified color letter is present in the stored Color field
                foreach (var l in letters)
                {
                    query = query.Where(c => (c.Color ?? string.Empty).ToUpper().Contains(l));
                }
            }
            else
            {
                // fallback: substring match on decoded input
                var lowered = col.ToLowerInvariant();
                query = query.Where(c => (c.Color ?? string.Empty).ToLower().Contains(lowered));
            }
        }

        if (!string.IsNullOrEmpty(typeLine))
        {
            var tl = typeLine.ToLowerInvariant();
            query = query.Where(c => c.TypeLine.ToLower().Contains(tl));
        }

        if (!string.IsNullOrEmpty(rarity))
        {
            var rl = rarity.ToLowerInvariant();
            query = query.Where(c => c.Rarity.ToLower().Contains(rl));
        }

        // CMC filtering supports simple numbers or comparison operators: >, <, >=, <=, !=
        if (!string.IsNullOrEmpty(cmc))
        {
            var v = cmc.Trim();
            var m = Regex.Match(v, "^([<>]=?|!=)?\\s*(-?\\d+\\.?\\d*)$");
            if (m.Success)
            {
                var op = m.Groups[1].Value;
                var numStr = m.Groups[2].Value;
                if (double.TryParse(numStr, out var num))
                {
                    if (string.IsNullOrEmpty(op) || op == "=") query = query.Where(c => c.CMC == num);
                    else if (op == ">") query = query.Where(c => c.CMC > num);
                    else if (op == "<") query = query.Where(c => c.CMC < num);
                    else if (op == ">=") query = query.Where(c => c.CMC >= num);
                    else if (op == "<=") query = query.Where(c => c.CMC <= num);
                    else if (op == "!=") query = query.Where(c => c.CMC != num);
                }
            }
        }

        // Do not apply page-based skipping here; always take up to `resultLimit` matching cards from the DB.
        var cardsInDb = await query
            .Take(resultLimit)
            .ToListAsync();

        // Wenn weniger als `resultLimit` Karten in DB → fehlende Karten von Scryfall holen
        if (cardsInDb.Count < resultLimit)
        {
            // Request all matching cards from Scryfall (limit<=0 means fetch all pages)
            var scryfallCards = await ScryfallService.GetCardsAsync(
                name, color, typeLine, rarity, cmc, power, toughness, 0);

            foreach (var sc in scryfallCards)
            {
                if (!_context.Cards.Any(c => c.Name == sc.Name))
                {
                    _context.Cards.Add(sc);
                }
            }

            await _context.SaveChangesAsync();

            // Re-run the query to include newly added cards and take up to resultLimit
            cardsInDb = await query.Take(resultLimit).ToListAsync();
        }

        // Apply power/toughness filters in-memory if provided (power/toughness are stored as strings)
        if (!string.IsNullOrEmpty(power))
        {
            cardsInDb = cardsInDb.Where(card =>
            {
                if (double.TryParse(card.Power, out var pVal))
                {
                    var m = Regex.Match(power.Trim(), "^([<>]=?|!=)?\\s*(-?\\d+\\.?\\d*)$");
                    if (m.Success && double.TryParse(m.Groups[2].Value, out var req))
                    {
                        var op = m.Groups[1].Value;
                        if (string.IsNullOrEmpty(op) || op == "=") return pVal == req;
                        if (op == ">") return pVal > req;
                        if (op == "<") return pVal < req;
                        if (op == ">=") return pVal >= req;
                        if (op == "<=") return pVal <= req;
                        if (op == "!=") return pVal != req;
                    }
                }
                return false;
            }).ToList();
        }

        if (!string.IsNullOrEmpty(toughness))
        {
            cardsInDb = cardsInDb.Where(card =>
            {
                if (double.TryParse(card.Toughness, out var tVal))
                {
                    var m = Regex.Match(toughness.Trim(), "^([<>]=?|!=)?\\s*(-?\\d+\\.?\\d*)$");
                    if (m.Success && double.TryParse(m.Groups[2].Value, out var req))
                    {
                        var op = m.Groups[1].Value;
                        if (string.IsNullOrEmpty(op) || op == "=") return tVal == req;
                        if (op == ">") return tVal > req;
                        if (op == "<") return tVal < req;
                        if (op == ">=") return tVal >= req;
                        if (op == "<=") return tVal <= req;
                        if (op == "!=") return tVal != req;
                    }
                }
                return false;
            }).ToList();
        }

        return Ok(cardsInDb);
    }

    // POST: api/cards/add-to-deck
    [HttpPost("add-to-deck")]
    public async Task<IActionResult> AddCardToDeck([FromBody] CardDTO cardDto)
    {
        // Karte prüfen / in DB speichern
        var card = await _context.Cards.FirstOrDefaultAsync(c => c.Name == cardDto.Card.Name);
        if (card == null)
        {
            card = cardDto.Card;
            _context.Cards.Add(card);
            await _context.SaveChangesAsync();
        }

        // Prüfen, ob Karte schon im Deck
        var deckCard = await _context.DeckCards
            .FirstOrDefaultAsync(dc => dc.DeckId == cardDto.DeckId && dc.CardId == card.Id);

        if (deckCard != null)
        {
            deckCard.Quantity += cardDto.Quantity;
        }
        else
        {
            deckCard = new DeckCard
            {
                DeckId = cardDto.DeckId,
                CardId = card.Id,
                Quantity = cardDto.Quantity
            };
            _context.DeckCards.Add(deckCard);
        }

        await _context.SaveChangesAsync();
        return Ok(deckCard);
    }
}
