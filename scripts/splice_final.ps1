$srcBytes   = [System.IO.File]::ReadAllBytes("src\app\api\chat\route.ts")
$src        = [System.Text.Encoding]::UTF8.GetString($srcBytes)
$newSection = [System.IO.File]::ReadAllText("scripts\new_final_output.txt", [System.Text.Encoding]::UTF8)

$startMarker = "const FINAL_DIAGNOSIS_OUTPUT_RULES"
$endMarker   = "`r`n`r`n// LATENCY_WARN"

$start = $src.IndexOf($startMarker)
$end   = $src.IndexOf("`r`n`r`n// LATENCY_WARN", $start)

if ($start -lt 0 -or $end -lt 0) {
    Write-Host "MARKERS NOT FOUND: start=$start end=$end"
    # Try fallback end marker
    $end = $src.IndexOf("// LATENCY_WARN", $start) - 2
    Write-Host "Fallback end=$end"
}

if ($start -lt 0 -or $end -lt 0) { Write-Host "ABORT"; exit 1 }

$patched = $src.Substring(0, $start) + $newSection + "`r`n`r`n" + $src.Substring($end + 4)
[System.IO.File]::WriteAllText("src\app\api\chat\route.ts", $patched, [System.Text.Encoding]::UTF8)
Write-Host "Done. File length: $($patched.Length)"
