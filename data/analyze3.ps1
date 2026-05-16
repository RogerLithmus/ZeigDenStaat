$d = Import-Csv 'behoerden_graph.csv' -Delimiter ';'

# Parent ID 88 = Bundesagentur für Arbeit (616 children!)
$parent88 = $d | Where-Object {$_.Id -eq '88'}
Write-Host "Parent 88: $($parent88.Name) | $($parent88.Classification)"

# Find all Ministerien
Write-Host "`n=== ALL MINISTERIEN ==="
$d | Where-Object {$_.Classification -eq 'Ministerium'} | Group-Object Jurisdiction | Sort-Object Count -Descending | Select-Object Name, Count | Format-Table -AutoSize

Write-Host "`n=== BUNDESMINISTERIEN ==="
$d | Where-Object {$_.Classification -eq 'Ministerium' -and $_.Jurisdiction -eq 'Bund'} | Select-Object Id, Name, ParentId, Depth | Format-Table -AutoSize

Write-Host "`n=== PARENT HIERARCHY for Bund (Depth 1 items) ==="
$d | Where-Object {$_.Depth -eq '1' -and $_.Jurisdiction -eq 'Bund'} | Group-Object ParentId | Sort-Object Count -Descending | Select-Object -First 15 Name, Count | Format-Table -AutoSize

# Look at what ParentId=88 is
Write-Host "`n=== CHILDREN of Bundesagentur für Arbeit (ID=88) - first 20 ==="
$d | Where-Object {$_.ParentId -eq '88'} | Select-Object -First 20 Id, Name, Classification | Format-Table -AutoSize

# EU institutions
Write-Host "`n=== EUROPEAN UNION institutions ==="
$d | Where-Object {$_.Jurisdiction -eq 'Europäische Union' -or $_.Jurisdiction -match 'Europ'} | Select-Object -First 20 Id, Name, Classification | Format-Table -AutoSize
Write-Host "Total EU: $(($d | Where-Object {$_.Jurisdiction -match 'Europ'}).Count)"

# Look at which Bundesländer have what kind of government structure
Write-Host "`n=== NON-EDUCATION CLASSIFICATIONS per Bundesland ==="
$nonEdu = $d | Where-Object {$_.Classification -notmatch 'Schule|Grundschule|Gymnasium|Sekundar|Gemeinschafts|Berufsschule|Waldorf|F.rderschule|Berufliches Gymnasium' -and $_.Classification -ne ''}
$nonEdu | Group-Object Jurisdiction | Sort-Object Count -Descending | Select-Object Name, Count | Format-Table -AutoSize
