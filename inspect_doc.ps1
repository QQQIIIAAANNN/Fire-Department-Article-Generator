$path = "c:\Users\zx262\Downloads\發文範本.doc"
Write-Output "File exists: $(Test-Path $path)"
if (Test-Path $path) {
    $file = [System.IO.File]::OpenRead($path)
    $bytes = New-Object Byte[] 100
    $count = $file.Read($bytes, 0, 100)
    $file.Close()
    Write-Output "Read $count bytes."
    $hex = [System.BitConverter]::ToString($bytes, 0, $count)
    Write-Output "Hex: $hex"
    
    # Try to see if there is readable text inside the first few hundred bytes
    $text = [System.Text.Encoding]::UTF8.GetString($bytes, 0, $count)
    Write-Output "Text representation: $text"
}
