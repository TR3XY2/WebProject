FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY *.csproj ./
RUN dotnet restore

# Скопіювати весь проект і збілдити
COPY . ./ 
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish ./

ENV ASPNETCORE_URLS=http://+:5000
# Підключення до БД через змінну CONNECTIONSTRINGS__DEFAULTCONNECTION
# Точка входу
ENTRYPOINT ["dotnet", "newton-raphson-backend.dll"]
