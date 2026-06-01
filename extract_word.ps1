$path = "c:\Users\zx262\Downloads\發文範本.doc"
$outputPath = "c:\Users\zx262\.gemini\antigravity-ide\scratch\fire\extracted_template.txt"

try {
    Write-Output "Attempting to open Word COM object..."
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $doc = $word.Documents.Open($path)
    $text = $doc.Content.Text
    $doc.Close()
    $word.Quit()
    [System.IO.File]::WriteAllText($outputPath, $text)
    Write-Output "Successfully extracted text to $outputPath"
} catch {
    Write-Output "Failed to extract via COM object: $_"
    # Fallback: Let's read it as bytes and look for strings
    try {
        Write-Output "Falling back to regex string extraction..."
        $bytes = [System.IO.File]::ReadAllBytes($path)
        # Extract ASCII and UTF-16 printable strings
        $chars = [System.Text.Encoding]::GetEncoding("utf-16le").GetString($bytes)
        # Filter for typical Chinese and English characters
        # Chinese characters in Unicode: \u4e00-\u9fff
        $cleanText = ""
        foreach ($char in $chars.ToCharArray()) {
            $val = [int]$char
            if (($val -ge 0x4e00 -and $val -le 0x9fff) -or ($val -ge 32 -and $val -le 126) -or $char -eq "`n" -or $char -eq "`r" -or $char -eq "`t") {
                $cleanText += $char
            }
        }
        [System.IO.File]::WriteAllText($outputPath, $cleanText)
        Write-Output "Successfully extracted strings to $outputPath"
    } catch {
        Write-Output "Fallback failed: $_"
    }
}
