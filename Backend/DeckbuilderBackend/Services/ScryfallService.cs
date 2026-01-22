using System;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using DeckbuilderBackend.Models.DTOs;

namespace DeckbuilderBackend.Services
{
    public class ScryfallService
    {
        private readonly HttpClient _http;

        public ScryfallService(HttpClient http)
        {
            _http = http;
            _http.BaseAddress = new Uri("https://api.scryfall.com/");
            _http.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", "DeckBuilder/1.0");
            _http.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "application/json");
        }

        public async Task<ScryfallSearchResultDto> SearchAsync(
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
            string query = BuildQuery(name, color, typeLine, rarity, cmc, power, toughness);

            // Scryfall braucht eine nicht-leere Query
            if (string.IsNullOrWhiteSpace(query))
                throw new ArgumentException("Mindestens ein Suchfilter muss gesetzt sein (z.B. name).");

            if (page < 1)
                throw new ArgumentOutOfRangeException(nameof(page), "Page muss >= 1 sein.");

            if (pageSize < 1)
                throw new ArgumentOutOfRangeException(nameof(pageSize), "PageSize muss >= 1 sein.");

            string url = $"cards/search?q={Uri.EscapeDataString(query)}&unique=cards&order=name&page={page}&page_size={pageSize}";

            using HttpResponseMessage response = await _http.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                string body = await response.Content.ReadAsStringAsync();
                // Kurze, hilfreiche Fehlermeldung für Debug/Schule
                throw new HttpRequestException($"Scryfall Fehler {(int)response.StatusCode}: {response.ReasonPhrase}. URL: {url}. Antwort: {body}");
            }

            string json = await response.Content.ReadAsStringAsync();
            using JsonDocument doc = JsonDocument.Parse(json);

            if (!doc.RootElement.TryGetProperty("data", out JsonElement data))
            {
                return new ScryfallSearchResultDto
                {
                    Page = page,
                    PageSize = pageSize,
                    TotalCards = 0,
                    HasMore = false,
                    Cards = Array.Empty<ScryfallCardDto>()
                };
            }

            List<ScryfallCardDto> cards = data.EnumerateArray()
                .Select(MapCard)
                .Take(pageSize)
                .ToList();

            int totalCards = doc.RootElement.TryGetProperty("total_cards", out JsonElement totalProp)
                ? totalProp.GetInt32()
                : cards.Count;

            bool hasMore = doc.RootElement.TryGetProperty("has_more", out JsonElement hasMoreProp)
                && hasMoreProp.GetBoolean();

            string? nextPage = doc.RootElement.TryGetProperty("next_page", out JsonElement nextProp)
                ? nextProp.GetString()
                : null;

            return new ScryfallSearchResultDto
            {
                Page = page,
                PageSize = pageSize,
                TotalCards = totalCards,
                HasMore = hasMore,
                NextPage = nextPage,
                Cards = cards
            };
        }

        public async Task<ScryfallCardDto> GetCardByIdAsync(string scryfallId)
        {
            if (string.IsNullOrWhiteSpace(scryfallId))
                throw new ArgumentException("ScryfallId darf nicht leer sein.", nameof(scryfallId));

            string url = $"cards/{Uri.EscapeDataString(scryfallId)}";

            using HttpResponseMessage response = await _http.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                string body = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Scryfall Fehler {(int)response.StatusCode}: {response.ReasonPhrase}. URL: {url}. Antwort: {body}");
            }

            string json = await response.Content.ReadAsStringAsync();
            using JsonDocument doc = JsonDocument.Parse(json);

            return MapCard(doc.RootElement);
        }

        private static ScryfallCardDto MapCard(JsonElement item)
        {
            return new ScryfallCardDto
            {
                Id = item.TryGetProperty("id", out JsonElement idProp) ? idProp.GetString() ?? "" : "",
                Name = item.GetProperty("name").GetString() ?? "",
                OracleText = item.TryGetProperty("oracle_text", out JsonElement t) ? t.GetString() ?? "" : "",
                Color = item.TryGetProperty("colors", out JsonElement c) && c.ValueKind == JsonValueKind.Array
                    ? string.Join(",", c.EnumerateArray().Select(x => x.GetString()))
                    : "",
                Cmc = item.TryGetProperty("cmc", out JsonElement cmcProp) ? cmcProp.GetDouble() : 0,
                Power = item.TryGetProperty("power", out JsonElement p) ? p.GetString() ?? "" : "",
                Toughness = item.TryGetProperty("toughness", out JsonElement tou) ? tou.GetString() ?? "" : "",
                TypeLine = item.TryGetProperty("type_line", out JsonElement typeProp) ? typeProp.GetString() ?? "" : "",
                Rarity = item.TryGetProperty("rarity", out JsonElement rarProp) ? rarProp.GetString() ?? "" : "",
                ScryfallUri = item.TryGetProperty("scryfall_uri", out JsonElement uriProp) ? uriProp.GetString() ?? "" : ""
            };
        }

        private static string BuildQuery(
            string? name,
            string? color,
            string? typeLine,
            string? rarity,
            string? cmc,
            string? power,
            string? toughness)
        {
            List<string> parts = new List<string>();

            if (!string.IsNullOrWhiteSpace(name))
                parts.Add($"name:{name}");

            if (!string.IsNullOrWhiteSpace(color))
            {
                string c = NormalizeColor(color);
                if (!string.IsNullOrEmpty(c))
                    parts.Add($"c:{c}");
            }

            if (!string.IsNullOrWhiteSpace(typeLine))
                parts.Add($"type:{typeLine}");

            if (!string.IsNullOrWhiteSpace(rarity))
                parts.Add($"rarity:{rarity}");

            if (!string.IsNullOrWhiteSpace(cmc))
            {
                string cmp = NormalizeComparison("mv", cmc);
                if (!string.IsNullOrEmpty(cmp)) parts.Add(cmp);
            }

            if (!string.IsNullOrWhiteSpace(power))
            {
                string cmp = NormalizeComparison("pow", power);
                if (!string.IsNullOrEmpty(cmp)) parts.Add(cmp);
            }

            if (!string.IsNullOrWhiteSpace(toughness))
            {
                string cmp = NormalizeComparison("tou", toughness);
                if (!string.IsNullOrEmpty(cmp)) parts.Add(cmp);
            }

            return string.Join(" ", parts);
        }

        private static string NormalizeColor(string color)
        {
            // erlaubt "R,U" oder "ru" -> "ru"
            string cleaned = Regex.Replace(color, @"[^wubrgcWUBRGC]", "");
            return cleaned.ToLowerInvariant();
        }

        private static string NormalizeComparison(string keyword, string value)
        {
            string v = value.Trim().Replace(" ", "");

            // erlaubt >=3, <=2, !=1, >5, <4, =3 oder 3
            if (Regex.IsMatch(v, @"^([<>]=?|!=|=)?-?\d+(\.\d+)?$"))
            {
                if (char.IsDigit(v[0]) || v[0] == '-') // "3" oder "-1"
                    return $"{keyword}={v}";

                return $"{keyword}{v}"; // ">=3" -> "mv>=3"
            }

            // ungültiger Vergleich -> ignorieren statt kaputte Query bauen
            return "";
        }
    }
}
