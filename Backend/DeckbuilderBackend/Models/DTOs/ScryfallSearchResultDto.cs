using System.Collections.Generic;

namespace DeckbuilderBackend.Models.DTOs
{
    public class ScryfallSearchResultDto
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCards { get; set; }
        public bool HasMore { get; set; }
        public string? NextPage { get; set; }
        public IReadOnlyList<ScryfallCardDto> Cards { get; set; } = new List<ScryfallCardDto>();
    }
}
