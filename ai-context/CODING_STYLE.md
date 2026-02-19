# CODING_STYLE.md

## General Style
- Write readable, boring code.
- Small functions with clear names.
- Avoid deep nesting.
- Prefer early returns.

## Naming
- Use English only.
- Use descriptive names:
  - good: createProductHandler
  - bad: doStuff

## API Design
- Use REST-style routes.
- Return consistent JSON shapes.
- Include clear error messages.

Example response:
{
  "success": true,
  "data": {}
}

Error response:
{
  "success": false,
  "error": "Message"
}

## Frontend
- Organize by feature, not by file type.
- Keep components small.
- Separate UI from data fetching logic.

## Backend
- Organize by module:
  /modules/products
  /modules/orders
  /modules/auth

## Comments
- Explain WHY, not WHAT.
