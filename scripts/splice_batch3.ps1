$src      = [System.IO.File]::ReadAllText("src\lib\wellness\sampleContent.ts", [System.Text.Encoding]::UTF8)
$newCards = [System.IO.File]::ReadAllText("scripts\batch3_cards.txt", [System.Text.Encoding]::UTF8)

# Find the last ]; — insert batch 3 just before it
$insertAt = $src.LastIndexOf("`r`n];")
if ($insertAt -lt 0) { $insertAt = $src.LastIndexOf("`n];") }

$patched = $src.Substring(0, $insertAt) + "`r`n" + $newCards + "`r`n];" + $src.Substring($insertAt + 4)
[System.IO.File]::WriteAllText("src\lib\wellness\sampleContent.ts", $patched, [System.Text.Encoding]::UTF8)
Write-Host "Done. Length: $($patched.Length)"
