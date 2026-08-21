# Bug: Input Length Limits and Display Truncation

## Technical Overview
Currently, the application allows entering arbitrarily long names for guests and potentially other entities. This leads to broken layouts and masks when these long strings are rendered in the UI. We need to introduce input validation limits at the application level and also ensure long strings are visually truncated gracefully in the UI.

## User Story
As a user, I want input fields to have reasonable character limits (e.g., 100 characters for names) so that I cannot accidentally break the layout by pasting huge texts. Furthermore, any long names should be truncated visually in tables or dialogs so that the application remains usable and visually appealing.

## Acceptance Criteria
- [ ] Name inputs (and other relevant text fields) have a maximum character limit (e.g., 100 characters) enforced by the form validation schema.
- [ ] UI components displaying these names use CSS techniques (like `text-overflow: ellipsis`) or a substring utility to gracefully truncate very long text.
- [ ] Database/API limits (if any) are aligned with these frontend limits to prevent errors.
