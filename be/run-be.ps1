# Script chạy Spring Boot Backend nạp file .env trên Windows PowerShell

$ErrorActionPreference = "Stop"

# 1. Đọc file .env nếu tồn tại
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Write-Host "Loading environment variables from .env..." -ForegroundColor Cyan
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        # Bỏ qua các dòng trống và dòng comment bắt đầu bằng #
        if ($line -and -not $line.StartsWith("#")) {
            $name, $value = $line -split '=', 2
            if ($name -and $value) {
                $varName = $name.Trim()
                $varVal = $value.Trim()
                # Remove quotes if present
                if (($varVal.StartsWith('"') -and $varVal.EndsWith('"')) -or ($varVal.StartsWith("'") -and $varVal.EndsWith("'"))) {
                    $varVal = $varVal.Substring(1, $varVal.Length - 2)
                }
                [System.Environment]::SetEnvironmentVariable($varName, $varVal, [System.EnvironmentVariableTarget]::Process)
            }
        }
    }
} else {
    Write-Warning "File .env not found in $PSScriptRoot! App will run with system environment variables or default properties."
}

# 2. Khởi chạy Maven Spring Boot R

Write-Host "Starting Spring Boot application..." -ForegroundColor Green
.\mvnw.cmd spring-boot:run
