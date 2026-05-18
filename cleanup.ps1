# Limpeza de duplicatas - Gestor Financeiro
# Execute no PowerShell como:  powershell -ExecutionPolicy Bypass -File cleanup.ps1

$ErrorActionPreference = 'Stop'
Write-Host '=== Removendo arquivos duplicados ===' -ForegroundColor Yellow

# Usar Join-Path + caminho sem cifrão usando caminho literal com single quotes
$FRONT = 'F:\Area de trabalho\aplicativos\Programacao\Projetos$$\$\Projeto Financeiro\postgre\front-end'

function Remove-Safe {
    param([string]$Path)
    if (Test-Path -LiteralPath $Path) {
        Remove-Item -LiteralPath $Path -Recurse -Force
        Write-Host "OK: removido $Path" -ForegroundColor Green
    } else {
        Write-Host "SKIP: $Path nao existe" -ForegroundColor Gray
    }
}

Remove-Safe (Join-Path $FRONT 'login')
Remove-Safe (Join-Path $FRONT 'extrato.html')
Remove-Safe (Join-Path $FRONT 'extrato')
Remove-Safe (Join-Path $FRONT 'js')
Remove-Safe (Join-Path $FRONT 'css')
Remove-Safe (Join-Path $FRONT 'sw.js')
Remove-Safe (Join-Path $FRONT 'manifest.json')
Remove-Safe (Join-Path $FRONT 'extrato.js')
Remove-Safe (Join-Path $FRONT 'imgs\img')

Write-Host '`n=== Limpeza concluída! ===' -ForegroundColor Yellow
