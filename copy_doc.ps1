$downloadsPath = "c:\Users\zx262\Downloads"
$targetPath = "c:\Users\zx262\.gemini\antigravity-ide\scratch\fire\template.doc"

Write-Output "Searching for .doc files in $downloadsPath..."
$files = Get-ChildItem -Path $downloadsPath -Filter "*.doc"
if ($files) {
    foreach ($file in $files) {
        Write-Output "Found file: $($file.FullName) (Size: $($file.Length) bytes)"
        try {
            Copy-Item -Path $file.FullName -Destination $targetPath -Force
            Write-Output "Successfully copied to $targetPath"
        } catch {
            Write-Output "Failed to copy: $_"
        }
    }
} else {
    Write-Output "No .doc files found in $downloadsPath"
}
