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
        string? cmc = null,
        string? power = null,
        string? toughness = null,
        int limit = 50)
    {
        var queryParts = new List<string>();

        if (!string.IsNullOrWhiteSpace(name))
            queryParts.Add($"name:{name}");

        if (!string.IsNullOrWhiteSpace(color))
        {
            // Normalize color parameter for Scryfall: remove commas and use c: prefix
            var c = color.Replace(",", "").Trim();
            if (!string.IsNullOrEmpty(c))
                queryParts.Add($"c:{c.ToLowerInvariant()}");
        }

        if (!string.IsNullOrWhiteSpace(typeLine))
            queryParts.Add($"type:{typeLine}");

        if (!string.IsNullOrWhiteSpace(rarity))
            queryParts.Add($"rarity:{rarity}");

        string BuildComparisonPart(string keyword, string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;
            var v = value.Trim();
            // If value starts with comparison operator, use it directly (e.g. ">=3")
            if (System.Text.RegularExpressions.Regex.IsMatch(v, "^([<>]=?|!=)\\s*-?\\d+\\.?\\d*$"))
                return keyword + v;
            // else assume equality
            return keyword + "=" + v;
        }

        if (!string.IsNullOrWhiteSpace(cmc))
            queryParts.Add(BuildComparisonPart("mv", cmc));

        if (!string.IsNullOrWhiteSpace(power))
            queryParts.Add(BuildComparisonPart("pow", power));

        if (!string.IsNullOrWhiteSpace(toughness))
            queryParts.Add(BuildComparisonPart("tou", toughness));

        string query = string.Join("%20", queryParts.Select(q => Uri.EscapeDataString(q)));
        string url = $"cards/search?q={query}&unique=cards&order=name";
        Console.WriteLine("URL: "+ url);

        // Scryfall URL constructed

        var cards = new List<Card>();
        int fetched = 0;

        while (!string.IsNullOrEmpty(url) && (limit <= 0 || fetched < limit))
        {
            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                break;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            if (!doc.RootElement.TryGetProperty("data", out var data))
            {
                break;
            }

            foreach (var item in data.EnumerateArray())
            {
                if (limit > 0 && fetched >= limit) break;

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
        }

        // returning fetched cards
        return cards;
    }
}
