# Contributing

Thanks for your interest in contributing to ctfd-mcp-server!

## Development Setup

```bash
git clone https://github.com/tomek7667/ctfd-mcp-server.git
cd ctfd-mcp-server
pnpm install
pnpm run build
```

## Making Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run checks:
   ```bash
   pnpm run typecheck
   pnpm run build
   pnpm test
   ```
5. Commit your changes (`git commit -m 'Add my feature'`)
6. Push to your fork (`git push origin feature/my-feature`)
7. Open a Pull Request

## Code Style

- Follow existing code patterns
- Use TypeScript strict mode
- Keep commits focused and atomic

## Adding New Tools

To add a new CTFd API endpoint:

1. Add the tool registration in `src/index.ts`
2. Follow the existing pattern with `server.registerTool()`
3. Use Zod schemas for input validation
4. Return JSON-stringified results

## Pull Request Guidelines

- Keep PRs focused on a single change
- Include a clear description of what and why
- Ensure CI passes
- Update README if adding new features

## Questions?

Open an issue for questions or discussion.
