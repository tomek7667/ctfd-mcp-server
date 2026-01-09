# CTFd MCP Server

[![npm version](https://img.shields.io/npm/v/ctfd-mcp-server.svg)](https://www.npmjs.com/package/ctfd-mcp-server) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight and extensible Model Context Protocol (MCP) server for interacting with any CTFd instance.
This project enables AI tools and automation to authenticate, retrieve challenges, and submit flags through MCP tools.

## Overview

This project acts as a bridge between CTFd and AI-driven systems by providing a unified interface.
It supports multiple authentication modes, dynamic base URL control, and direct MCP tool integration.

The server is validated using the official demo instance at https://demo.ctfd.io.

## Features

- Dynamic BASE_URL configuration
- Token and cookie authentication
- Username/password login
- List challenges with optional filtering
- Submit flags programmatically
- Compatible with MCP-based AI tools (Claude, Codex, Amp, Gemini)
- Clean and extensible TypeScript codebase

## Quickstart

### Option 1: npx (no install)

```bash
npx ctfd-mcp-server
```

### Option 2: Global install

```bash
pnpm install -g ctfd-mcp-server
ctfd-mcp-server
```

### Option 3: From source

```bash
git clone https://github.com/tomek7667/ctfd-mcp-server.git
cd ctfd-mcp-server
pnpm install
pnpm run build
pnpm start
```

## Tools

| Tool                                                | Description                                      |
| --------------------------------------------------- | ------------------------------------------------ |
| `set_base_url(url)`                                 | Set the base URL for the CTFd instance           |
| `set_token(token)`                                  | Set authentication token                         |
| `set_cookie(cookie)`                                | Set session cookie                               |
| `login(username, password)`                         | Login with credentials                           |
| `challenges(category?)`                             | List challenges, optionally filtered by category |
| `challenge(identifier)`                             | Get challenge details by name or ID              |
| `submit_flag(challenge_name?, challenge_id?, flag)` | Submit a flag                                    |
| `scoreboard()`                                      | Get the CTFd scoreboard                          |
| `progress()`                                        | Get current user's progress                      |
| `health()`                                          | Check connection health                          |

---

## Client Setup

### Claude Desktop

Claude Desktop supports MCP servers via a JSON configuration file.

**Config file location:**

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Using npx (recommended):**

```json
{
	"mcpServers": {
		"ctfd": {
			"command": "npx",
			"args": ["-y", "ctfd-mcp-server"],
			"env": {
				"BASE_URL": "https://demo.ctfd.io",
				"CTFD_TOKEN": "<your ctfd api token>"
			}
		}
	}
}
```

**Using global install:**

```json
{
	"mcpServers": {
		"ctfd": {
			"command": "ctfd-mcp-server",
			"env": {
				"BASE_URL": "https://demo.ctfd.io",
				"CTFD_TOKEN": "<your ctfd api token>"
			}
		}
	}
}
```

Restart Claude Desktop after editing the config.

---

### OpenAI Codex CLI

Codex CLI stores MCP configuration in `~/.codex/config.toml`.

**Using the CLI:**

```bash
codex mcp add ctfd -- npx -y ctfd-mcp-server
```

**Or edit `~/.codex/config.toml` directly:**

```toml
[mcp_servers.ctfd]
command = "npx"
args = ["-y", "ctfd-mcp-server"]

[mcp_servers.ctfd.env]
BASE_URL = "https://demo.ctfd.io"
CTFD_TOKEN = "<your ctfd api token>"
```

Use `/mcp` in the Codex TUI to verify the server is connected.

---

### Amp

Amp supports MCP servers via the `amp.mcpServers` setting in VS Code `settings.json`.

**Config file location (VS Code):**

- **macOS**: `~/Library/Application Support/Code/User/settings.json`
- **Windows**: `%APPDATA%\Code\User\settings.json`
- **Linux**: `~/.config/Code/User/settings.json`

**Using npx (recommended):**

```json
{
	"amp.mcpServers": {
		"ctfd": {
			"command": "npx",
			"args": ["-y", "ctfd-mcp-server"],
			"env": {
				"BASE_URL": "https://demo.ctfd.io",
				"CTFD_TOKEN": "<your ctfd api token>"
			}
		}
	}
}
```

**Via CLI:**

```bash
amp mcp add ctfd npx -y ctfd-mcp-server
```

---

### Gemini CLI

Gemini CLI stores MCP configuration in `~/.gemini/settings.json`.

**Using npx (recommended):**

```json
{
	"mcpServers": {
		"ctfd": {
			"command": "npx",
			"args": ["-y", "ctfd-mcp-server"],
			"env": {
				"BASE_URL": "https://demo.ctfd.io",
				"CTFD_TOKEN": "<your ctfd api token>"
			}
		}
	}
}
```

**Via CLI:**

```bash
gemini mcp add ctfd npx -- -y ctfd-mcp-server
```

Use `/mcp` in Gemini CLI to verify server status.

---

## Docker

```bash
docker build -t ctfd-mcp-server .
docker run -i ctfd-mcp-server
```

For clients that support Docker-based MCP servers:

```json
{
	"mcpServers": {
		"ctfd": {
			"command": "docker",
			"args": ["run", "-i", "--rm", "ctfd-mcp-server"]
		}
	}
}
```

---

## Compatibility

| Feature   | Supported             |
| --------- | --------------------- |
| Transport | stdio                 |
| Node.js   | >=18.0.0              |
| Platforms | macOS, Linux, Windows |

### Tested Clients

| Client           | Status      |
| ---------------- | ----------- |
| Claude Desktop   | ✅ Verified |
| OpenAI Codex CLI | ✅ Verified |
| Amp              | ✅ Verified |
| Gemini CLI       | ✅ Verified |

---

## Environment Variables

| Variable   | Description            | Default                |
| ---------- | ---------------------- | ---------------------- |
| `BASE_URL` | CTFd instance base URL | `https://demo.ctfd.io` |

---

## Development

```bash
# Clone and install
git clone https://github.com/tomek7667/ctfd-mcp-server.git
cd ctfd-mcp-server
pnpm install

# Build
pnpm run build

# Run
pnpm start

# Watch mode (auto-rebuild)
pnpm run watch
```

---

## Support

For support, email jamescotid@gmail.com or open an issue through the GitHub repository.
Community contributions and improvements are always welcome.

## License

[MIT](https://github.com/tomek7667/ctfd-mcp-server/blob/main/LICENSE)
