#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// State management
interface State {
	baseUrl: string;
	token: string | null;
	cookie: string | null;
	username: string | null;
	password: string | null;
	challengeMap: Record<string, number>;
}

const state: State = {
	baseUrl: process.env.BASE_URL || "https://demo.ctfd.io",
	token: null,
	cookie: null,
	username: null,
	password: null,
	challengeMap: {},
};

// HTTP helper functions
async function fetchJson<T>(
	url: string,
	options: RequestInit = {}
): Promise<T> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		"User-Agent": "ctfd-mcp-server/1.0.0",
	};

	// Merge with any existing headers
	if (options.headers) {
		const existingHeaders = options.headers as Record<string, string>;
		Object.assign(headers, existingHeaders);
	}

	if (state.token) {
		headers["Authorization"] = `Token ${state.token}`;
	}
	if (state.cookie) {
		headers["Cookie"] = state.cookie;
	}

	const res = await fetch(url, { ...options, headers });

	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(
			`CTFd API error ${res.status} for ${url}${
				text ? `: ${text.slice(0, 300)}` : ""
			}`
		);
	}

	return (await res.json()) as T;
}

async function postJson<T>(
	url: string,
	body: any,
	options: RequestInit = {}
): Promise<T> {
	return fetchJson<T>(url, {
		...options,
		method: "POST",
		body: JSON.stringify(body),
	});
}

// CTFd API functions
async function login(username: string, password: string): Promise<any> {
	const url = `${state.baseUrl}/api/v1/users/login`;
	const payload = {
		name: username,
		password: password,
	};

	try {
		const response = await postJson<any>(url, payload);
		const token = response?.data?.token;

		if (token) {
			state.username = username;
			state.password = password;
			state.token = token;
			return { success: true, token };
		}

		return { success: false, error: "No token in response" };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

async function listChallenges(category?: string): Promise<any> {
	const url = `${state.baseUrl}/api/v1/challenges`;

	try {
		const response = await fetchJson<any>(url);
		let challenges = response?.data || [];

		// Update challenge map
		for (const ch of challenges) {
			if (ch.name && ch.id) {
				state.challengeMap[ch.name] = ch.id;
			}
		}

		// Filter by category if provided
		if (category) {
			challenges = challenges.filter((c: any) => c.category === category);
		}

		return { data: challenges };
	} catch (error) {
		// Try to refresh login if we have credentials
		if (state.username && state.password) {
			await login(state.username, state.password);
			// Retry the request
			try {
				const response = await fetchJson<any>(url);
				const challenges = response?.data || [];

				for (const ch of challenges) {
					if (ch.name && ch.id) {
						state.challengeMap[ch.name] = ch.id;
					}
				}

				return { data: challenges };
			} catch (retryError) {
				return {
					error:
						retryError instanceof Error
							? retryError.message
							: String(retryError),
				};
			}
		}

		return {
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

async function getChallenge(identifier: string): Promise<any> {
	let challengeId: number | null = null;

	// Check if identifier is a number
	if (/^\d+$/.test(identifier)) {
		challengeId = parseInt(identifier, 10);
	} else {
		// Look up by name
		challengeId = state.challengeMap[identifier] || null;

		// If not in map, try to refresh the list
		if (!challengeId) {
			await listChallenges();
			challengeId = state.challengeMap[identifier] || null;
		}

		if (!challengeId) {
			return { error: "challenge_not_found" };
		}
	}

	const url = `${state.baseUrl}/api/v1/challenges/${challengeId}`;

	try {
		const response = await fetchJson<any>(url);
		return { data: response?.data };
	} catch (error) {
		// Try to refresh login if we have credentials
		if (state.username && state.password) {
			await login(state.username, state.password);
			try {
				const response = await fetchJson<any>(url);
				return { data: response?.data };
			} catch (retryError) {
				return {
					error:
						retryError instanceof Error
							? retryError.message
							: String(retryError),
				};
			}
		}

		return {
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

async function submitFlag(
	challengeName: string | undefined,
	challengeId: number | undefined,
	flag: string
): Promise<any> {
	if (!flag) {
		return { error: "no_flag" };
	}

	let targetId: number | null = null;

	if (challengeId) {
		targetId = challengeId;
	} else if (challengeName) {
		targetId = state.challengeMap[challengeName] || null;

		if (!targetId) {
			await listChallenges();
			targetId = state.challengeMap[challengeName] || null;
		}

		if (!targetId) {
			return { error: "challenge_not_found" };
		}
	} else {
		return { error: "no_challenge_specified" };
	}

	const url = `${state.baseUrl}/api/v1/challenges/attempt`;
	const payload = {
		challenge_id: targetId,
		submission: flag,
	};

	try {
		const response = await postJson<any>(url, payload);
		return response;
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

async function getScoreboard(): Promise<any> {
	const url = `${state.baseUrl}/api/v1/scoreboard`;

	try {
		const response = await fetchJson<any>(url);
		return { data: response?.data };
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

async function getUserProgress(): Promise<any> {
	const url = `${state.baseUrl}/api/v1/users/me`;

	try {
		const response = await fetchJson<any>(url);
		return { data: response?.data };
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

async function healthCheck(): Promise<any> {
	const headers: Record<string, string> = {
		"User-Agent": "ctfd-mcp-server/1.0.0",
	};

	if (state.token) {
		headers["Authorization"] = `Token ${state.token}`;
	}
	if (state.cookie) {
		headers["Cookie"] = state.cookie;
	}

	try {
		const response = await fetch(`${state.baseUrl}/api/v1/challenges`, {
			method: "HEAD",
			headers,
		});

		return {
			status: response.ok ? "ok" : "error",
			baseUrl: state.baseUrl,
			authenticated: !!state.token,
			statusCode: response.status,
		};
	} catch (error) {
		return {
			status: "error",
			baseUrl: state.baseUrl,
			authenticated: !!state.token,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

// Initialize MCP server
const server = new McpServer({
	name: "ctfd-mcp-server",
	version: "1.0.0",
});

// Register tools

server.registerTool(
	"set_base_url",
	{
		description: "Set the base URL for the CTFd instance.",
		inputSchema: {
			url: z.string().url().describe("CTFd instance base URL (e.g., https://demo.ctfd.io)"),
		},
	},
	async ({ url }) => {
		state.baseUrl = url.replace(/\/+$/, ""); // Remove trailing slashes
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify({ status: "ok", baseUrl: state.baseUrl }, null, 2),
				},
			],
		};
	}
);

server.registerTool(
	"set_token",
	{
		description: "Set authentication token for CTFd API.",
		inputSchema: {
			token: z.string().describe("CTFd authentication token"),
		},
	},
	async ({ token }) => {
		state.token = token;
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify({ status: "token_set" }, null, 2),
				},
			],
		};
	}
);

server.registerTool(
	"set_cookie",
	{
		description: "Set session cookie for CTFd authentication.",
		inputSchema: {
			cookie: z.string().describe("CTFd session cookie"),
		},
	},
	async ({ cookie }) => {
		state.cookie = cookie;
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify({ status: "cookie_set" }, null, 2),
				},
			],
		};
	}
);

server.registerTool(
	"login",
	{
		description: "Login to CTFd with username and password.",
		inputSchema: {
			username: z.string().describe("CTFd username"),
			password: z.string().describe("CTFd password"),
		},
	},
	async ({ username, password }) => {
		const result = await login(username, password);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}
);

server.registerTool(
	"challenges",
	{
		description: "List all challenges from CTFd, with optional category filter.",
		inputSchema: {
			category: z
				.string()
				.optional()
				.describe("Optional category to filter challenges"),
		},
	},
	async ({ category }) => {
		const result = await listChallenges(category);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}
);

server.registerTool(
	"challenge",
	{
		description:
			"Get details for a specific challenge by name or ID.",
		inputSchema: {
			identifier: z
				.string()
				.describe("Challenge name or numeric ID"),
		},
	},
	async ({ identifier }) => {
		const result = await getChallenge(identifier);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}
);

server.registerTool(
	"submit_flag",
	{
		description: "Submit a flag for a challenge.",
		inputSchema: {
			challenge_name: z
				.string()
				.optional()
				.describe("Challenge name (if not using challenge_id)"),
			challenge_id: z
				.number()
				.int()
				.optional()
				.describe("Challenge ID (if not using challenge_name)"),
			flag: z.string().describe("Flag to submit"),
		},
	},
	async ({ challenge_name, challenge_id, flag }) => {
		const result = await submitFlag(challenge_name, challenge_id, flag);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}
);

server.registerTool(
	"scoreboard",
	{
		description: "Get the CTFd scoreboard.",
		inputSchema: {},
	},
	async () => {
		const result = await getScoreboard();
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}
);

server.registerTool(
	"progress",
	{
		description: "Get the current user's progress and solves.",
		inputSchema: {},
	},
	async () => {
		const result = await getUserProgress();
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}
);

server.registerTool(
	"health",
	{
		description: "Check health status of the CTFd connection.",
		inputSchema: {},
	},
	async () => {
		const result = await healthCheck();
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}
);

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("ctfd-mcp-server running on stdio");
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
