/**
 * Minimal MCP App for RTG Comics
 *
 * This is a test app to verify MCP Apps work in Claude Desktop.
 * Uses the exact same pattern as Assa's working apps.
 */

import { App } from '@modelcontextprotocol/ext-apps';

const statusEl = document.getElementById('status')!;
const dataEl = document.getElementById('data')!;

function updateStatus(message: string, type: 'connecting' | 'connected' | 'error') {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function showData(data: unknown) {
  dataEl.style.display = 'block';
  dataEl.textContent = JSON.stringify(data, null, 2);
}

async function init() {
  try {
    // Create the App instance - exactly like Assa does
    const app = new App(
      { name: 'RTG Comics Minimal', version: '1.0.0' },
      {}, // capabilities
      { autoResize: true } // options - THIS IS CRITICAL for Claude to show the UI
    );

    // Handle initial tool result
    app.ontoolresult = (result) => {
      console.log('Received tool result:', result);
      showData(result);
    };

    // Connect - let SDK handle transport internally (DO NOT pass PostMessageTransport)
    await app.connect();

    updateStatus('Connected to host', 'connected');
    console.log('MCP App connected successfully!');

    // Show host context if available
    try {
      const context = app.getHostContext();
      if (context) {
        showData({ hostContext: context });
      }
    } catch (e) {
      console.log('Could not get host context:', e);
    }

  } catch (error) {
    console.error('Failed to connect:', error);
    updateStatus(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
  }
}

// Start the app
init();
