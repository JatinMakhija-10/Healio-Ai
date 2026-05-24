$srcBytes  = [System.IO.File]::ReadAllBytes("src\lib\wellness\sampleContent.ts")
$src       = [System.Text.Encoding]::UTF8.GetString($srcBytes)
$newBatch  = [System.IO.File]::ReadAllText("scripts\batch2_cards.txt", [System.Text.Encoding]::UTF8)

$startMarker = "  // -- Batch 2"
# Try both comment styles
$start = $src.IndexOf($startMarker)
if ($start -lt 0) {
    $startMarker = "  // ── Batch 2"
    $start = $src.IndexOf($startMarker)
}
if ($start -lt 0) {
    # Find by content
    $start = $src.IndexOf("hair-oiling-safety") - 10
    # Go back to nearest newline
    $nlPos = $src.LastIndexOf("`n", $start)
    $start = $nlPos + 1
    # Go back further to the comment line
    $nlPos2 = $src.LastIndexOf("`n", $start - 2)
    $start = $nlPos2 + 1
}

$endMarker = "`r`n];"
$end = $src.LastIndexOf($endMarker)
if ($end -lt 0) {
    $end = $src.LastIndexOf("`n];")
}

Write-Host "start=$start end=$end"
Write-Host "Context at start: $($src.Substring($start, [Math]::Min(80, $src.Length - $start)))"

$patched = $src.Substring(0, $start) + $newBatch + "`r`n`r`n];"  + $src.Substring($end + $endMarker.Length)
[System.IO.File]::WriteAllText("src\lib\wellness\sampleContent.ts", $patched, [System.Text.Encoding]::UTF8)
Write-Host "Done. Length: $($patched.Length)"
