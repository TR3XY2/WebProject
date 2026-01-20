$projectPath = "C:\Users\yfund\source\repos\WebProject\newton-raphson-backend"

# Launch Backend #1 (port 5001)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$projectPath`"; dotnet run --urls=https://localhost:5001"

# Launch Backend #2 (port 5002)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$projectPath`"; dotnet run --urls=https://localhost:5002"

Write-Host "Started Backend5001 and Backend5002."
