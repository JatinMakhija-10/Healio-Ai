$srcBytes  = [System.IO.File]::ReadAllBytes("src\lib\wellness\sampleContent.ts")
$src       = [System.Text.Encoding]::UTF8.GetString($srcBytes)
$newBatch  = [System.IO.File]::ReadAllText("scripts\batch2_cards.txt", [System.Text.Encoding]::UTF8)

# Find start: the line that contains "Batch 2"
$batch2Line = $src.IndexOf("Batch 2")
# Walk back to start of that line
$lineStart = $src.LastIndexOf("`n", $batch2Line) + 1
$start = $lineStart

# Find end: last ]; in the file
$endMarker = "`r`n];"
$end = $src.LastIndexOf($endMarker)
if ($end -lt 0) { $endMarker = "`n];"; $end = $src.LastIndexOf($endMarker) }

Write-Host "start=$start end=$end"
$patched = $src.Substring(0, $start) + $newBatch + "`r`n`r`n];" + $src.Substring($end + $endMarker.Length)
[System.IO.File]::WriteAllText("src\lib\wellness\sampleContent.ts", $patched, [System.Text.Encoding]::UTF8)
Write-Host "Done. Length: $($patched.Length)"
