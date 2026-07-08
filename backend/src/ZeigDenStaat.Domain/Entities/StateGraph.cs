using System.Collections.Generic;

namespace ZeigDenStaat.Domain.Entities;

public class StateGraph
{
    public List<Authority> Nodes { get; set; } = new();
    public List<Edge> Edges { get; set; } = new();
}
