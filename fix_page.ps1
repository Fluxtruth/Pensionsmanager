$path = 'c:\Users\fluxt\OneDrive\Documents\Coding Projects\Pensionsmanager\src\app\buchungen\page.tsx'
$lines = Get-Content $path
$newLines = $lines[0..1842] + $lines[1863..($lines.Count-1)]
$newLines | Set-Content $path -Encoding UTF8
Write-Host "Fixed file."
