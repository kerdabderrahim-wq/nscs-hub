
$root = "c:\Users\Dell\Desktop\ncsc web"
$baseUrl = "."

$data = @()

# Helper to get resources recursively
function Get-Resources($path, $relativeRoot, $category) {
    $res = @()
    if (Test-Path $path) {
        $files = Get-ChildItem -Path $path -File -Recurse
        foreach ($f in $files) {
            $relPath = $f.FullName.Substring($root.Length).Replace("\", "/")
            # Use relative path from web root
            $url = "." + $relPath
            
            $res += @{
                type = $f.Extension.TrimStart(".")
                name = $f.Name
                url = $url
                category = $category
            }
        }
    }
    return $res
}

# Main scan
$yearFolders = Get-ChildItem -Path $root -Directory | Where-Object { $_.Name -match "year" }

foreach ($yf in $yearFolders) {
    # Parse folder name "2024-2025 second semester first year"
    # Logic: Find "first year", "1st year", etc.
    $yName = $yf.Name
    $yearLabel = "Unknown Year"
    $yearId = "year-unknown"
    
    if ($yName -match "first year") { $yearLabel = "1st Year"; $yearId = "year-1" }
    elseif ($yName -match "second year") { $yearLabel = "2nd Year"; $yearId = "year-2" }
    elseif ($yName -match "third year") { $yearLabel = "3rd Year"; $yearId = "year-3" }
    elseif ($yName -match "fourth year") { $yearLabel = "4th Year"; $yearId = "year-4" }
    elseif ($yName -match "fifth year") { $yearLabel = "5th Year"; $yearId = "year-5" }

    # Extract Promo (e.g. 2024-2025)
    $promoLabel = "Unknown Promo"
    if ($yName -match "(\d{4}-\d{4})") {
        $promoLabel = $matches[1]
    }

    # Extract Semester
    $semesterLabel = "Unknown Semester"
    $semesterId = "sem-unknown"
    
    if ($yName -match "first semester" -or $yName -match "fiest semester") { 
        $semesterLabel = "Semester 1"
        $semesterId = "s1" 
    }
    elseif ($yName -match "second semester") { 
        $semesterLabel = "Semester 2"
        $semesterId = "s2" 
    }
    
    # Check if year exists in data, else add
    $yearObj = $data | Where-Object { $_.id -eq $yearId }
    if ($null -eq $yearObj) {
        $yearObj = @{
            id = $yearId
            label = $yearLabel
            promos = @()
        }
        $data += $yearObj
    }

    # Check if promo exists
    $promoObj = $yearObj.promos | Where-Object { $_.id -eq $promoLabel }
    if ($null -eq $promoObj) {
        $promoObj = @{
            id = $promoLabel
            label = $promoLabel
            semesters = @()
        }
        $yearObj.promos += $promoObj
    }
    
    # Check if semester exists
    $semObj = $promoObj.semesters | Where-Object { $_.id -eq $semesterId }
    if ($null -eq $semObj) {
        $semObj = @{
            id = $semesterId
            label = $semesterLabel
            modules = @()
        }
        $promoObj.semesters += $semObj
    }

    # Get Modules (subfolders of the year folder)
    $modules = Get-ChildItem -Path $yf.FullName -Directory
    foreach ($mod in $modules) {
        # Check if module already exists in this semester
        $modName = $mod.Name
        $modObj = $semObj.modules | Where-Object { $_.name -eq $modName }
        if ($null -eq $modObj) {
            $modObj = @{
                name = $modName
                resources = @()
            }
            $semObj.modules += $modObj
        }
        
        # Scan for resources
        $children = Get-ChildItem -Path $mod.FullName
        foreach ($child in $children) {
            if ($child.PSIsContainer) {
                # specific category
                $catName = $child.Name
                $catFiles = Get-ChildItem -Path $child.FullName -File -Recurse
                foreach ($f in $catFiles) {
                     $relPath = $f.FullName.Substring($root.Length).Replace("\", "/")
                     $modObj.resources += @{
                        type = $f.Extension.TrimStart(".")
                        name = $f.Name
                        url = "." + $relPath
                        category = $catName
                     }
                }
            } else {
                # file in root of module
                 $relPath = $child.FullName.Substring($root.Length).Replace("\", "/")
                 $modObj.resources += @{
                    type = $child.Extension.TrimStart(".")
                    name = $child.Name
                    url = "." + $relPath
                    category = "General"
                 }
            }
        }
    }
}

# Convert to JSON
$json = $data | ConvertTo-Json -Depth 10

# Output as JS
"const data = $json;" | Out-File -FilePath "$root\data.js" -Encoding utf8
"export default data;" | Out-File -FilePath "$root\data.js" -Append -Encoding utf8

Write-Host "Data generation complete."
