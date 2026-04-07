/**
 * MCP Bridge - Bridge between app.js and MCP Apps SDK
 *
 * This module provides the connection between the MCP App and the host (Claude)
 * using the @modelcontextprotocol/ext-apps SDK.
 *
 * PRD items: 11.2.1, 11.2.2, 11.2.3, 11.2.4, 11.2.5
 */

import { App } from '@modelcontextprotocol/ext-apps';

// App singleton instance
let app: App | null = null;

// Connection state
let connected = false;

// Tool result callback
let toolResultCallback: ((result: unknown) => void) | null = null;

/**
 * Check if the bridge is connected to the host.
 */
export const isConnected = (): boolean => connected;

/**
 * Get the host context (theme, locale, etc.) from the connected app.
 * Returns undefined if not connected.
 */
export function getHostContext() {
  if (!app || !connected) {
    return undefined;
  }
  return app.getHostContext();
}

/**
 * Set the callback function that will be called when tool results are received.
 * This allows app.js to handle initial tool data sent by the host.
 *
 * @param callback - Function to call when tool results arrive
 */
export function setToolResultHandler(callback: (result: unknown) => void): void {
  toolResultCallback = callback;
}

/**
 * Call a tool on the MCP server via the host.
 *
 * @param name - The name of the tool to call
 * @param args - Arguments to pass to the tool
 * @returns The tool result
 */
export async function callServerTool(
  name: string,
  args: Record<string, unknown> = {}
): Promise<unknown> {
  if (!app || !connected) {
    throw new Error('MCP bridge not connected. Call connect() first.');
  }

  const result = await app.callServerTool({
    name,
    arguments: args,
  });

  return result;
}

/**
 * Connect to the MCP host using PostMessageTransport.
 * This should be called once when the app initializes.
 */
export async function connect(): Promise<void> {
  if (connected) {
    console.warn('MCP bridge already connected');
    return;
  }

  // Create the App instance
  app = new App(
    {
      name: 'RTG Comic Reader',
      version: '1.0.0',
    },
    {
      // Declare capabilities the app supports
    },
    {
      autoResize: true,
    }
  );

  // Set up tool result handler to receive initial tool data
  app.ontoolresult = (params) => {
    if (toolResultCallback) {
      toolResultCallback(params);
    } else {
      console.warn('[MCP Bridge] ontoolresult fired but no callback set');
    }
  };

  // NOTE: Removed ontoolinput handler - minimal app doesn't use it and works
  // The ontoolresult handler should be sufficient for receiving initial data

  // Connect to the host - SDK handles PostMessage transport internally
  // Note: Do NOT pass a custom transport - let SDK handle it for proper autoResize
  await app.connect();

  connected = true;
}

/**
 * Get the App instance for advanced usage.
 * Returns null if not connected.
 */
export function getApp(): App | null {
  return app;
}

/**
 * Open an external URL in the host browser.
 * MCP apps can't navigate directly from within an iframe, so we use
 * the SDK's openLink method to request the host open the URL.
 *
 * @param url - The URL to open
 * @returns Promise resolving to result with isError flag if host denied the request
 */
export async function openLink(url: string): Promise<{ isError?: boolean }> {
  if (!app || !connected) {
    // Fallback: not connected to MCP host
    return { isError: true };
  }

  try {
    const result = await app.openLink({ url });
    return result;
  } catch (error) {
    console.error('Failed to open link via MCP SDK:', error);
    return { isError: true };
  }
}
