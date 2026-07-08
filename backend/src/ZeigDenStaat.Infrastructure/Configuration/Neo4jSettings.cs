namespace ZeigDenStaat.Infrastructure.Configuration;

public class Neo4jSettings
{
    public const string SectionName = "Neo4j";

    public string Uri { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
