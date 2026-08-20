# Feature: Show Database Environment

## Technical Overview
We need to display the current Supabase environment (Dev or Prod) on the "Datenbank" page under the "Cloud DB" section. This will help users immediately see which database they are connected to.

## User Story
As a user, I want to see which Supabase environment (Dev or Prod) I am currently connected to on the database settings page, so that I don't accidentally make changes in the wrong environment.

## Acceptance Criteria
- On the "Datenbank" page, under "Cloud DB", an indicator is shown for the current database environment.
- The environment is correctly determined based on the Supabase URL or environment variables.
- The UI matches the existing design of the page.
