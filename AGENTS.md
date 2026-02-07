# agents.md

This repository uses Windsurf Agents. Follow these rules whenever generating or editing code.

## Package Manager

- **Always use `bun`** as the package manager for all operations.
  - Install packages: `bun add <package>`
  - Install dev dependencies: `bun add -d <package>`
  - Run scripts: `bun run <script>`
  - Do NOT use `npm`, `yarn`, or `pnpm`.

## UI & Components

- Prefer **shadcn/ui** components wherever possible.
- If the required shadcn/ui component is not available in the project, **install it first** using `bun add` (then use it).
- Keep styling consistent with the existing design system:
  - Use Tailwind utility classes.
  - Use the existing theme tokens/colors already defined in the project (avoid introducing arbitrary new colors).

## React Component Conventions

- **New React component filenames must be kebab-case**.
  - Example: `user-avatar.tsx`, `sign-in-form.tsx`
- **React component names must be PascalCase**.
  - Example: `UserAvatar`, `SignInForm`

## General

- Keep changes minimal and aligned with the requested task.
- Do not add backend logic unless explicitly requested.
