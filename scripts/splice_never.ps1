# Read source file as UTF-8 bytes -> string
$srcBytes  = [System.IO.File]::ReadAllBytes("src\app\api\chat\route.ts")
$src       = [System.Text.Encoding]::UTF8.GetString($srcBytes)

# Read the replacement section from file (avoids inline string escaping issues)
$newSection = [System.IO.File]::ReadAllText("scripts\new_never_section.txt", [System.Text.Encoding]::UTF8)

# Locate old section boundaries
$startMarker = "[WHAT HEALIO NEVER DOES]"
$closeToken  = "``;"   # the ` ; that closes SYSTEM_PROMPT template literal

$start    = $src.IndexOf($startMarker)
$closePos = $src.IndexOf($closeToken, $start)

if ($start -lt 0 -or $closePos -lt 0) {
    Write-Host "MARKERS NOT FOUND: start=$start closePos=$closePos"; exit 1
}

# Build patched file: everything before old section + new section + closing token onwards
$patched = $src.Substring(0, $start) + $newSection + "`r`n" + $src.Substring($closePos)
[System.IO.File]::WriteAllText("src\app\api\chat\route.ts", $patched, [System.Text.Encoding]::UTF8)
Write-Host "Done. File length: $($patched.Length)"
