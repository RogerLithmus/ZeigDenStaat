using Neo4j.Driver;
using ZeigDenStaat.Application.UseCases;
using ZeigDenStaat.Domain.Interfaces;
using ZeigDenStaat.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();

// Configure CORS for frontend access
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configure Neo4j Driver and Register Clean Architecture layers
var neo4jSection = builder.Configuration.GetSection("Neo4j");
var uri = neo4jSection["Uri"];
var username = neo4jSection["Username"];
var password = neo4jSection["Password"];

Console.WriteLine(uri + " " + username + " " + password);

if (!string.IsNullOrEmpty(uri))
{
    // Register the Neo4j driver as a singleton
    builder.Services.AddSingleton<IDriver>(sp =>
        GraphDatabase.Driver(uri, AuthTokens.Basic(username, password)));
    builder.Services.AddScoped<IAuthorityRepository, Neo4jAuthorityRepository>();
}
else
{
    // Register fallback without driver
    builder.Services.AddScoped<IAuthorityRepository, Neo4jAuthorityRepository>();
}

// Register Use Case
builder.Services.AddScoped<GetStateGraphUseCase>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();

app.MapGet("/api/state-graph", async (GetStateGraphUseCase useCase) =>
{
    var result = await useCase.ExecuteAsync();
    return Results.Ok(result);
})
.WithName("GetStateGraph");

app.Run();
