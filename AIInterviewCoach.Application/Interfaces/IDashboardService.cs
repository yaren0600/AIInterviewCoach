using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AIInterviewCoach.Application.DTOs;

namespace AIInterviewCoach.Application.Interfaces;

/// <summary>
/// Dashboard işlemleri yapan bir servis olacaksa,
/// GetDashboardAsync metodunu içermek zorunda.
/// IDashboardServiice: Dashboard servisinin sözleşmesidir.
/// </summary>
public interface IDashboardService
{
    Task<DashboardDto> GetDashboardAsync(int userId);
}