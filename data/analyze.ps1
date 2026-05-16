$d = Import-Csv 'behoerden_graph.csv' -Delimiter ';'

Write-Host "=== BASIC STATS ==="
Write-Host "Total records: $($d.Count)"
$wp = ($d | Where-Object {$_.ParentId -ne ''})
Write-Host "With ParentId: $($wp.Count)"
Write-Host "Without ParentId: $($d.Count - $wp.Count)"
Write-Host "Unique Classifications: $(($d | Select-Object -ExpandProperty Classification -Unique).Count)"
Write-Host "Unique Jurisdictions: $(($d | Select-Object -ExpandProperty Jurisdiction -Unique).Count)"

Write-Host "`n=== PARENT NODES (Depth 1) ==="
$d | Where-Object {$_.Depth -eq '1'} | Select-Object Id, Name, ParentId, Depth, Classification, Jurisdiction | Format-Table -AutoSize

Write-Host "`n=== CHILD NODES (Depth 2, first 20) ==="
$d | Where-Object {$_.Depth -eq '2'} | Select-Object -First 20 Id, Name, ParentId, Depth, Classification, Jurisdiction | Format-Table -AutoSize

Write-Host "`n=== TOP PARENT IDs (which authorities have most children) ==="
$d | Where-Object {$_.ParentId -ne ''} | Group-Object -Property ParentId | Sort-Object -Property Count -Descending | Select-Object -First 20 Name, Count | Format-Table -AutoSize

Write-Host "`n=== CLASSIFICATION by JURISDICTION (top combos) ==="
$d | Group-Object -Property Classification, Jurisdiction | Sort-Object -Property Count -Descending | Select-Object -First 30 Name, Count | Format-Table -AutoSize

Write-Host "`n=== BUND (Federal) institutions by Classification ==="
$d | Where-Object {$_.Jurisdiction -eq 'Bund'} | Group-Object -Property Classification | Sort-Object -Property Count -Descending | Select-Object -First 25 Name, Count | Format-Table -AutoSize
