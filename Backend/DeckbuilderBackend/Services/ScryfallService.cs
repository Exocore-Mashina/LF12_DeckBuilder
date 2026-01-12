using System.Net.Http.Json;
using System.Text.Json;

public static class ScryfallService
{
    private static readonly HttpClient _httpClient = new HttpClient
    {
        BaseAddress = new Uri("https://api.scryfall.com/")
    };

    static ScryfallService()
    {
        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "MyDeckBuilderApp/1.0 (example@example.com)");
        _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
    }

    public static async Task<List<Card>> GetCardsAsync(
        string? name = null,
        string? color = null,
        string? typeLine = null,
        string? rarity = null,
        int limit = 50)
    {
        var queryParts = new List<string>();

        if (!string.IsNullOrWhiteSpace(name))
            queryParts.Add($"name:{name}");

        if (!string.IsNullOrWhiteSpace(color))
            queryParts.Add($"color:{color.ToUpperInvariant()}");

        if (!string.IsNullOrWhiteSpace(typeLine))
            queryParts.Add($"type:{typeLine}");

        if (!string.IsNullOrWhiteSpace(rarity))
            queryParts.Add($"rarity:{rarity}");

        string query = string.Join("%20", queryParts.Select(q => Uri.EscapeDataString(q)));
        string url = $"cards/search?q={query}&unique=cards&order=name";

        Console.WriteLine("[DEBUG] Scryfall URL: " + new Uri(_httpClient.BaseAddress!, url));

        var cards = new List<Card>();
        int fetched = 0;

        while (!string.IsNullOrEmpty(url) && fetched < limit)
        {
            var response = await _httpClient.GetAsync(url);
            Console.WriteLine("[DEBUG] HTTP Status: " + response.StatusCode);

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine("[DEBUG] Fehler beim Abrufen der Karten!");
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine("[DEBUG] Scryfall Error: " + errorContent);
                break;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            if (!doc.RootElement.TryGetProperty("data", out var data))
            {
                Console.WriteLine("[DEBUG] Keine 'data' im JSON!");
                break;
            }

            foreach (var item in data.EnumerateArray())
            {
                if (fetched >= limit) break;

                var card = new Card
                {
                    Name = item.GetProperty("name").GetString() ?? "",
                    CardText = item.TryGetProperty("oracle_text", out var textProp) ? textProp.GetString() ?? "" : "",
                    Color = item.TryGetProperty("colors", out var colorProp) && colorProp.ValueKind == JsonValueKind.Array
                        ? string.Join(",", colorProp.EnumerateArray().Select(c => c.GetString()))
                        : "",
                    CMC = item.TryGetProperty("cmc", out var cmcProp) ? cmcProp.GetDouble() : 0,
                    Power = item.TryGetProperty("power", out var powerProp) ? powerProp.GetString() ?? "" : "",
                    Toughness = item.TryGetProperty("toughness", out var toughProp) ? toughProp.GetString() ?? "" : "",
                    TypeLine = item.TryGetProperty("type_line", out var typeProp) ? typeProp.GetString() ?? "" : "",
                    Rarity = item.TryGetProperty("rarity", out var rarityProp) ? rarityProp.GetString() ?? "" : "",
                    ScryfallURI = item.TryGetProperty("scryfall_uri", out var uriProp) ? uriProp.GetString() ?? "" : ""
                };

                cards.Add(card);
                fetched++;
            }

            url = doc.RootElement.TryGetProperty("next_page", out var nextProp) ? nextProp.GetString() : null;
            if (!string.IsNullOrEmpty(url))
                Console.WriteLine("[DEBUG] Nächste Seite: " + url);
        }

        Console.WriteLine("[DEBUG] Insgesamt gefundene Karten: " + cards.Count);
        return cards;
    }
}
