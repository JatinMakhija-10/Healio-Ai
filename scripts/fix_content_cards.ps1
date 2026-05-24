$src = [System.IO.File]::ReadAllText("src\lib\wellness\sampleContent.ts", [System.Text.Encoding]::UTF8)

# 1. Rename summary: -> whatItIs: (only in the new batch — all are in batch 2)
$src = $src -replace "    summary: '(.*?)',`r`n    evidenceLabel:", {
    param($m)
    $text = $m.Groups[1].Value
    "    whatItIs: '$text',`r`n    evidenceSummary: '$text',`r`n    evidenceLabel:"
}

# 2. Fix category values
$src = $src -replace "category: 'self_care',", "category: 'preventive',"
$src = $src -replace "category: 'lifestyle',", "category: 'preventive',"
$src = $src -replace "category: 'sleep',", "category: 'sleep_stress',"
$src = $src -replace "category: 'hygiene',", "category: 'preventive',"
$src = $src -replace "category: 'nutrition',", "category: 'preventive',"
$src = $src -replace "category: 'traditional',", "category: 'kitchen_care',"

# 3. Fix hair-oiling category specifically (self_care -> skin_hair)
# Already changed to preventive above — override the hair-oiling one
$src = $src -replace "(id: 'hair-oiling-safety'.*?category: )'preventive'", "`${1}'skin_hair'" 

# 4. Fix seasonal-food-habits category (preventive -> seasonal)
$src = $src -replace "(id: 'seasonal-food-habits'.*?category: )'preventive'", "`${1}'seasonal'"

# 5. Fix mild-seasonal-allergies season (spring -> summer)
$src = $src -replace "season: 'spring',", "season: 'summer',"

[System.IO.File]::WriteAllText("src\lib\wellness\sampleContent.ts", $src, [System.Text.Encoding]::UTF8)
Write-Host "Done. Length: $($src.Length)"
