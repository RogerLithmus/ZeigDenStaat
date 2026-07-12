using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Neo4j.Driver;
using ZeigDenStaat.Domain.Entities;
using ZeigDenStaat.Domain.Interfaces;

namespace ZeigDenStaat.Infrastructure.Repositories;

public class Neo4jAuthorityRepository : IAuthorityRepository
{
    private readonly IDriver _driver;

    public Neo4jAuthorityRepository(IDriver driver)
    {
        _driver = driver ?? throw new ArgumentNullException(nameof(driver));
    }

    public async Task<StateGraph> GetStateGraphAsync()
    {
        var graph = new StateGraph();

        try
        {
            await using var session = _driver.AsyncSession();
            // Label-free robust match to find Bundestag (by name or ID) and its connections
            var query = @"
                MATCH (b)
                WHERE b.rechtsform = 'Oberste Bundesbehörde'
                RETURN b";

            var result = await session.RunAsync(query);
            var nodeMap = new Dictionary<string, Authority>();
            var edges = new List<Edge>();

            // FIXME: Do not hardcode
            var db = new Authority()
            {
                Id = "deutBund",
                Name = "Deutscher Bundestag",
                Abbrev = "Bundestag",
                ParentId = null,
                Depth = 0,
                Classification = "parliament",
                Jurisdiction = "Bundestag",
                Location = "Berlin",
                Description = "Der deutsche Bundestag",
                Head = "head"
            };
            nodeMap[db.Id] = db;

            while (await result.FetchAsync())
            {
                var bRecord = result.Current["b"];
                if (bRecord == null) continue;

                var bNode = bRecord.As<INode>();
                var bAuth = MapNodeToAuthority(bNode);

                // Skip empty mapped node IDs
                if (string.IsNullOrEmpty(bAuth.Id)) continue;

                if (!nodeMap.ContainsKey(bAuth.Id))
                {
                    nodeMap[bAuth.Id] = bAuth;
                }

                bAuth.ParentId = db.ParentId;
                edges.Add(new Edge()
                {
                    From = db.Id,
                    To = bAuth.Id
                });
            }

            graph.Nodes = nodeMap.Values.ToList();
            graph.Edges = edges;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Neo4j connection error: {ex.Message}");
        }

        return graph;
    }

    private string GetPropString(INode node, string key)
    {
        if (node.Properties.TryGetValue(key, out var val)) return val?.ToString() ?? "";

        var lowerKey = key.ToLowerInvariant();
        if (node.Properties.TryGetValue(lowerKey, out val)) return val?.ToString() ?? "";

        var titleKey = char.ToUpperInvariant(key[0]) + key.Substring(1);
        if (node.Properties.TryGetValue(titleKey, out val)) return val?.ToString() ?? "";

        return "";
    }

    private Authority MapNodeToAuthority(INode node)
    {
        var id = GetPropString(node, "id");
        var name = GetPropString(node, "name");
        var parentId = GetPropString(node, "parentId");
        var depthStr = GetPropString(node, "depth");
        var classification = GetPropString(node, "classification");
        var jurisdiction = GetPropString(node, "jurisdiction");
        var location = GetPropString(node, "location");
        var description = GetPropString(node, "description");
        var head = GetPropString(node, "head");
        var kuerzel = GetPropString(node, "kuerzel");

        // Infer classification/type if empty
        if (string.IsNullOrEmpty(classification))
        {
            classification = name.ToLowerInvariant().Contains("bundestag") ? "parliament" : "ministry";
        }

        return new Authority
        {
            Id = id,
            Name = name,
            Abbrev = kuerzel,
            ParentId = string.IsNullOrEmpty(parentId) ? null : parentId,
            Depth = int.TryParse(depthStr, out var d) ? d : 0,
            Classification = classification,
            Jurisdiction = jurisdiction,
            Location = string.IsNullOrEmpty(location) ? "Berlin" : location,
            Description = description,
            Head = head
        };
    }
}
