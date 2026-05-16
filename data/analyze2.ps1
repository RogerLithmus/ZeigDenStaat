$d = Import-Csv 'behoerden_graph.csv' -Delimiter ';'

Write-Host "=== TOP PARENT NODES (id=88, 135, 86, 94, 87, 84) ==="
$parentIds = @('88','135','86','94','87','84','280','155','114','947','90')
foreach ($pid in $parentIds) {
    $parent = $d | Where-Object {$_.Id -eq $pid} | Select-Object -First 1
    $childCount = ($d | Where-Object {$_.ParentId -eq $pid}).Count
    Write-Host "ID $pid -> $($parent.Name) | Classification: $($parent.Classification) | Jurisdiction: $($parent.Jurisdiction) | Children: $childCount"
}

Write-Host "`n=== CLASSIFICATION CATEGORIES (semantic grouping) ==="
Write-Host "`nEDUCATION-related:"
$eduClass = $d | Where-Object {$_.Classification -match 'Schule|Grundschule|Gymnasium|Sekundar|Gemeinschafts|Berufsschule|Hochschule|Universit|Fachhochschule|Waldorf|F.rderschule|Akademie'} 
Write-Host "  Total education institutions: $($eduClass.Count)"
$eduClass | Group-Object -Property Classification | Sort-Object Count -Descending | Select-Object -First 15 Name, Count | Format-Table -AutoSize

Write-Host "`nJUSTICE-related:"
$justClass = $d | Where-Object {$_.Classification -match 'Gericht|Staatsanwalt|Justizvollzug|Rechtsanwalt'}
Write-Host "  Total justice institutions: $($justClass.Count)"
$justClass | Group-Object -Property Classification | Sort-Object Count -Descending | Select-Object Name, Count | Format-Table -AutoSize

Write-Host "`nSECURITY-related:"
$secClass = $d | Where-Object {$_.Classification -match 'Polizei|Feuerwehr|Bundeswehr|THW|Bundespolizei'}
Write-Host "  Total security institutions: $($secClass.Count)"
$secClass | Group-Object -Property Classification | Sort-Object Count -Descending | Select-Object Name, Count | Format-Table -AutoSize

Write-Host "`nADMINISTRATION-related:"
$admClass = $d | Where-Object {$_.Classification -match 'Gemeinde|Stadt|Landkreis|Ministerium|B.rgeramt|Ordnungsamt|Sozialamt|Jugendamt|Bauamt|Kulturamt|Umweltamt|Gesundheitsamt|Schulamt|Finanzamt|Forst|Veterinär'}
Write-Host "  Total administration institutions: $($admClass.Count)"
$admClass | Group-Object -Property Classification | Sort-Object Count -Descending | Select-Object -First 20 Name, Count | Format-Table -AutoSize

Write-Host "`nINFRASTRUCTURE-related:"
$infraClass = $d | Where-Object {$_.Classification -match 'Stadtwerke|Verkehr|Sparkasse|Krankenhaus|Abfall|Abwasser|Wasser|IT-Dienstleister|Wohnungs'}
Write-Host "  Total infrastructure institutions: $($infraClass.Count)"
$infraClass | Group-Object -Property Classification | Sort-Object Count -Descending | Select-Object Name, Count | Format-Table -AutoSize

Write-Host "`n=== RECORDS WITH EMPTY Classification ==="
$empty = $d | Where-Object {$_.Classification -eq ''}
Write-Host "Count: $($empty.Count)"
$empty | Select-Object -First 10 Id, Name, Jurisdiction | Format-Table -AutoSize
