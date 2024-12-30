$headers = @{
    'Authorization' = 'Bearer msy_oa7fQE0u5LfmoDSluVbfNwFmMuZy6cXei3cd'
    'Content-Type' = 'application/json'
}

$body = @{
    text = 'A simple cube'
    mode = 'mesh'
    format = 'glb'
} | ConvertTo-Json

Write-Host "Testing Meshy API..."
Write-Host "Headers: $($headers | ConvertTo-Json)"
Write-Host "Body: $body"

try {
    $response = Invoke-RestMethod -Method Post -Uri 'https://api.meshy.ai/v2/text-to-3d/tasks' -Headers $headers -Body $body
    Write-Host "Response: $($response | ConvertTo-Json -Depth 10)"
} catch {
    Write-Host "Error: $_"
    Write-Host "Response: $($_.ErrorDetails.Message)"
} 