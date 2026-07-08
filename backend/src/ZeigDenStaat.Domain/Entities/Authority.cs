namespace ZeigDenStaat.Domain.Entities;

public class Authority
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ParentId { get; set; }
    public int Depth { get; set; }
    public string Classification { get; set; } = string.Empty;
    public string Jurisdiction { get; set; } = string.Empty;
    public string Location { get; set; } = "Berlin";
    public string Description { get; set; } = string.Empty;
    public string Head { get; set; } = string.Empty;
}
