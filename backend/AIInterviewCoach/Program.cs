using System.Text;
using AIInterviewCoach.Application.Interfaces;
using AIInterviewCoach.Infrastructure.Persistence;
using AIInterviewCoach.Infrastructure.Services;
using AIInterviewCoach.Infrastructure.Settings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);



builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"));
});
builder.Services.AddScoped<IAuthService, AuthService>();
// Bu ne demek? Biri IAuthService isterse ona AuthService ver.
// Bu da Dependency Injection mantığıdır.

builder.Services.AddScoped<IPositionService, PositionService>();

builder.Services.AddScoped<IInterviewService, InterviewService>();

builder.Services.AddHttpClient<IAiQuestionGenerationService, AiQuestionGenerationService>();

// Bu kısımda, uygulamanın farklı bölümlerinde kullanacağımız servisleri Dependency Injection ile ekliyoruz.
//builder.Services.AddScoped<IAiEvaluationService, AiEvaluationService>();

builder.Services.AddHttpClient<IAiEvaluationService, AiEvaluationService>();

// Bu kısımda, uygulamanın farklı bölümlerinde kullanacağımız servisleri Dependency Injection ile ekliyoruz.
builder.Services.AddHttpClient<IStudyPlanAiService, StudyPlanAiService>();
//
builder.Services.AddHttpClient<IAiAnswerRewriteService, AiAnswerRewriteService>();

builder.Services.Configure<AiProviderSettings>(
    builder.Configuration.GetSection("AiProvider"));

builder.Services.AddScoped<IDashboardService, DashboardService>();

builder.Services.AddScoped<IResumeService, ResumeService>();

builder.Services.AddScoped<IStudyPlanService, StudyPlanService>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });
//Burada ASP.NET Core şunu söylüyoruz: "Eğer bir kullanıcı JWT ile giriş yaparsa, bu token'ı doğrulamak için bu ayarları kullan."
// Bu ayarlar, token'ın geçerliliğini, imzasını ve diğer bilgilerini kontrol eder.
// Bu, uygulamanın güvenliğini sağlamak için önemlidir.

builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "AI Interview Coach API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT token giriniz. Örnek: Bearer token_degeri"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
//Swagger, API'nizin dokümantasyonunu otomatik olarak oluşturur ve test etmenizi sağlar.
//Burada Swagger'a JWT ile giriş yapabilmek için gerekli ayarları ekliyoruz.

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
Console.WriteLine("========== AI CONFIG ==========");
Console.WriteLine($"Provider: {builder.Configuration["AiProvider:Provider"]}");
Console.WriteLine($"Model: {builder.Configuration["AiProvider:Model"]}");
Console.WriteLine($"ApiKey Exists: {!string.IsNullOrEmpty(builder.Configuration["AiProvider:ApiKey"])}");
Console.WriteLine("==============================="); Console.WriteLine("========== AI CONFIG ==========");
Console.WriteLine($"Provider: {builder.Configuration["AiProvider:Provider"]}");
Console.WriteLine($"Model: {builder.Configuration["AiProvider:Model"]}");
Console.WriteLine($"ApiKey Exists: {!string.IsNullOrEmpty(builder.Configuration["AiProvider:ApiKey"])}");
Console.WriteLine("===============================");
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();

//Bu kısımda sıra önemli çünkü önce UseAuthentication() çağrılır, sonra UseAuthorization() çağrılır.
//Bu, önce kullanıcının kimliğini doğrulamak, sonra yetkilendirme kontrollerini yapmak için gereklidir.

