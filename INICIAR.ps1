$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Write-Host 'IMPULSO: abra http://localhost:8794 no navegador. Mantenha esta janela aberta durante o uso.'
& node (Join-Path $PSScriptRoot 'serve.cjs')
