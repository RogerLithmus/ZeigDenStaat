# fetch_graph_data.ps1

Set-Location -Path $PSScriptRoot

$outputCsv = "behoerden_graph.csv"
$nextUrl = "https://fragdenstaat.de/api/v1/publicbody/?format=json&limit=500&offset=0"
$page = 1

$allData = [System.Collections.Generic.List[PSCustomObject]]::new()

Write-Host "🚀 Starte Turbo-Download..." -ForegroundColor Cyan

while (![string]::IsNullOrEmpty($nextUrl)) {
    # Ein Ladebalken ist viel schneller als hunderte Textzeilen ins Terminal zu drucken
    Write-Progress -Activity "Lade Behörden von FragDenStaat herunter" -Status "Seite $page | Bisher gesammelt: $($allData.Count)"
    
    try {
        $response = Invoke-RestMethod -Uri $nextUrl -Method Get
        
        foreach ($item in $response.objects) {
            $parentId = $null
            if ($null -ne $item.parent) {
                if ($item.parent -match "/(\d+)/") {
                    $parentId = $matches[1]
                }
            }
            
            $allData.Add([PSCustomObject]@{
                Id             = $item.id
                Name           = $item.name
                ParentId       = $parentId
                Depth          = $item.depth
                Classification = if ($null -ne $item.classification) { $item.classification.name } else { "" }
                Jurisdiction   = if ($null -ne $item.jurisdiction) { $item.jurisdiction.name } else { "" }
            })
        }
        
        $nextUrl = $response.meta.next
        $page++
        
        # KEIN Start-Sleep mehr! Wir laden so schnell wie möglich.
    } 
    catch {
        # Falls FragDenStaat unsere IP wegen "Spam" kurz blockt (Rate Limit 429), 
        # machen wir 2 Sekunden Pause und versuchen genau diese Seite nochmal.
        Write-Progress -Activity "Lade Behörden von FragDenStaat herunter" -Status "Server bittet um Pause. Warte 2 Sekunden..."
        Start-Sleep -Seconds 2
    }
}

# Ladebalken ausblenden
Write-Progress -Activity "Lade Behörden von FragDenStaat herunter" -Completed

Write-Host "`nExportiere $($allData.Count) Datensätze in die CSV-Datei..." -ForegroundColor Cyan

$allData | Export-Csv -Path $outputCsv -NoTypeInformation -Encoding UTF8 -Delimiter ";"

Write-Host "✅ Fertig in Rekordzeit! Deine CSV liegt im aktuellen Ordner." -ForegroundColor Green