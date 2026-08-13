$docxPath = "c:\Users\JATIN\Desktop\Healio.AI\GGG\Healio_AI_Comprehensive_Audit.docx"
$outPath = "c:\Users\JATIN\Desktop\Healio.AI\GGG\docx_text.txt"

Add-Type -Assembly System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)
$entry = $zip.Entries | Where-Object { $_.Name -eq "document.xml" }
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xml = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()

$text = $xml -replace '<[^>]+>', ''
$text = $text -replace '&amp;', '&'
$text = $text -replace '&lt;', '<'
$text = $text -replace '&gt;', '>'
$text = $text -replace '&quot;', '"'
$text = $text -replace '\s+', ' '
$text | Out-File -Encoding UTF8 $outPath
Write-Host "Done"
