$path = "c:\Users\zx262\Downloads\發文範本.doc"
$outputPath = "c:\Users\zx262\.gemini\antigravity-ide\scratch\fire\extracted_template.txt"

Write-Output "Extracting strings directly from $path..."
$bytes = [System.IO.File]::ReadAllBytes($path)

# Word doc text is usually UTF-16LE or single-byte ANSI/UTF-8 depending on formatting.
# We will decode the bytes as both UTF-16LE and UTF-8, and extract readable segments.
$utf16 = [System.Text.Encoding]::GetEncoding("utf-16le").GetString($bytes)
$cleanText16 = ""
foreach ($char in $utf16.ToCharArray()) {
    $val = [int]$char
    # Keep printable ASCII, Chinese (CJK Unified Ideographs), fullwidth punctuation
    if (($val -ge 0x4e00 -and $val -le 0x9fff) -or 
        ($val -ge 32 -and $val -le 126) -or 
        ($val -ge 0x3000 -and $val -le 0x303f) -or 
        ($val -ge 0xff00 -and $val -le 0xffef) -or 
        $char -eq "`n" -or $char -eq "`r" -or $char -eq "`t") {
        $cleanText16 += $char
    }
}

# Let's write the extracted content
[System.IO.File]::WriteAllText($outputPath, $cleanText16)
Write-Output "Successfully extracted strings to $outputPath"
