param(
  [string]$Project = "storyline-6cd69",
  [string]$Region = "asia-southeast1",
  [string]$Service = "storyline",
  [string]$RuntimeServiceAccount = "storyline-cloud-run@storyline-6cd69.iam.gserviceaccount.com",
  [string]$GeminiSecret = "storyline-gemini-api-key",
  [string]$SessionSecret = "storyline-session-secret",
  [string]$ShareSecret = "storyline-share-token-secret"
)

$gcloud = Get-Command gcloud -ErrorAction SilentlyContinue
if (-not $gcloud) {
  throw "gcloud was not found on PATH. Install the Google Cloud CLI before running this script."
}

$args = @(
  "run", "deploy", $Service,
  "--source", ".",
  "--project", $Project,
  "--region", $Region,
  "--allow-unauthenticated",
  "--port", "3000",
  "--memory", "512Mi",
  "--cpu", "0.08",
  "--concurrency", "1",
  "--min-instances", "0",
  "--max-instances", "2",
  "--timeout", "300",
  "--execution-environment", "gen1",
  "--service-account", $RuntimeServiceAccount,
  "--set-env-vars", "NODE_ENV=production,FIREBASE_PROJECT_ID=$Project",
  "--set-secrets", "GEMINI_API_KEY=$GeminiSecret:latest,SESSION_SECRET=$SessionSecret:latest,SHARE_TOKEN_SECRET=$ShareSecret:latest"
)

& $gcloud.Source @args
