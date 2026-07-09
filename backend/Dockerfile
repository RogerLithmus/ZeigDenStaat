# Stage 1: Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files for restoring dependencies
COPY ["src/ZeigDenStaat.WebApi/ZeigDenStaat.WebApi.csproj", "src/ZeigDenStaat.WebApi/"]
COPY ["src/ZeigDenStaat.Application/ZeigDenStaat.Application.csproj", "src/ZeigDenStaat.Application/"]
COPY ["src/ZeigDenStaat.Domain/ZeigDenStaat.Domain.csproj", "src/ZeigDenStaat.Domain/"]
COPY ["src/ZeigDenStaat.Infrastructure/ZeigDenStaat.Infrastructure.csproj", "src/ZeigDenStaat.Infrastructure/"]

# Restore packages
RUN dotnet restore "src/ZeigDenStaat.WebApi/ZeigDenStaat.WebApi.csproj"

# Copy the rest of the source files
COPY src/ src/

# Build and publish WebApi
WORKDIR "/src/src/ZeigDenStaat.WebApi"
RUN dotnet publish "ZeigDenStaat.WebApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Set environment and URLs
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "ZeigDenStaat.WebApi.dll"]
