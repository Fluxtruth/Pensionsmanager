$process = Start-Process npx -ArgumentList "--yes", "playwright", "test", "tests/e2e/full-journey/uc-full-lifecycle/full-journey.spec.ts", "--config=temp-playwright.config.ts", "--reporter=list" -RedirectStandardOutput "test_output.txt" -RedirectStandardError "test_error.txt" -NoNewWindow -PassThru
$process.WaitForExit()
