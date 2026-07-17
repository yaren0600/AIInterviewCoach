FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY AIInterviewCoach.sln ./

COPY AIInterviewCoach/AIInterviewCoach.csproj AIInterviewCoach/
COPY AIInterviewCoach.Application/AIInterviewCoach.Application.csproj AIInterviewCoach.Application/
COPY AIInterviewCoach.Domain/AIInterviewCoach.Domain.csproj AIInterviewCoach.Domain/
COPY AIInterviewCoach.Infrastructure/AIInterviewCoach.Infrastructure.csproj AIInterviewCoach.Infrastructure/

RUN dotnet restore AIInterviewCoach.sln

COPY . .

RUN dotnet publish AIInterviewCoach/AIInterviewCoach.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "AIInterviewCoach.dll"]