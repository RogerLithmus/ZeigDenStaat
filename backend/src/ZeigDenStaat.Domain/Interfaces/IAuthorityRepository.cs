using System.Threading.Tasks;
using ZeigDenStaat.Domain.Entities;

namespace ZeigDenStaat.Domain.Interfaces;

public interface IAuthorityRepository
{
    Task<StateGraph> GetStateGraphAsync();
}
