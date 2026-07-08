using System.Threading.Tasks;
using ZeigDenStaat.Domain.Entities;
using ZeigDenStaat.Domain.Interfaces;

namespace ZeigDenStaat.Application.UseCases;

public class GetStateGraphUseCase
{
    private readonly IAuthorityRepository _repository;

    public GetStateGraphUseCase(IAuthorityRepository repository)
    {
        _repository = repository;
    }

    public Task<StateGraph> ExecuteAsync()
    {
        return _repository.GetStateGraphAsync();
    }
}
