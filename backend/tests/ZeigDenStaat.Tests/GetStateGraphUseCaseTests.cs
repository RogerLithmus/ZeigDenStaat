using System.Collections.Generic;
using System.Threading.Tasks;
using NSubstitute;
using Xunit;
using ZeigDenStaat.Application.UseCases;
using ZeigDenStaat.Domain.Entities;
using ZeigDenStaat.Domain.Interfaces;

namespace ZeigDenStaat.Tests;

public class GetStateGraphUseCaseTests
{
    [Fact]
    public async Task ExecuteAsync_ShouldCallRepository_AndReturnData()
    {
        // Arrange
        var repository = Substitute.For<IAuthorityRepository>();
        var expectedGraph = new StateGraph
        {
            Nodes = new List<Authority>
            {
                new() { Id = "bundestag", Name = "Deutscher Bundestag" },
                new() { Id = "bmf", Name = "Bundesministerium der Finanzen" }
            },
            Edges = new List<Edge>
            {
                new() { From = "bundestag", To = "bmf" }
            }
        };
        
        repository.GetStateGraphAsync().Returns(Task.FromResult(expectedGraph));
        var useCase = new GetStateGraphUseCase(repository);

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Nodes.Count);
        Assert.Single(result.Edges);
        Assert.Equal("bundestag", result.Nodes[0].Id);
        Assert.Equal("bmf", result.Nodes[1].Id);
        
        // Verify repository interaction
        await repository.Received(1).GetStateGraphAsync();
    }
}
