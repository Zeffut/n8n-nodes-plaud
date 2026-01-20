# n8n-nodes-plaud

This is an n8n community node that lets you interact with the [Plaud AI](https://plaud.ai) API to manage your audio recordings.

[Plaud](https://plaud.ai) is the world's #1 AI note-taking brand, offering voice recorders that automatically transcribe and summarize your conversations.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Credentials

To use this node, you need a Plaud bearer token:

1. Go to [plaud.ai](https://plaud.ai) and log in
2. Open DevTools (F12) → Network tab
3. Refresh the page
4. Find any request to `api.plaud.ai` or `api-euc1.plaud.ai`
5. Copy the `Authorization` header value (without the "Bearer " prefix)

### Regions

Select the appropriate region based on your account location:
- **Europe (EU)** - `api-euc1.plaud.ai`
- **United States (US)** - `api.plaud.ai`
- **Asia Pacific (APAC)** - `api-apac.plaud.ai`

## Nodes

### Plaud

Regular node for interacting with your Plaud recordings.

#### Resources & Operations

**Device**
- **List** - List all devices linked to your account

**Recording**
- **Get Many** - Retrieve recordings with pagination and sorting options
- **Get Download URL** - Get a temporary download URL for a recording
- **Download** - Download a recording as binary data (WAV or Opus format)
- **Update Filename** - Rename a recording

### Plaud Trigger

Polling trigger that fires when new recordings are detected.

- Configurable polling interval (set in workflow settings)
- Returns the latest recording when testing
- Tracks seen recordings to avoid duplicates

## Usage Examples

### Download new recordings automatically

1. Add **Plaud Trigger** node
2. Add **Plaud** node with operation "Download"
3. Set Recording ID to `{{ $json.id }}`
4. Connect to your storage (Google Drive, S3, etc.)

### Get all recordings metadata

1. Add **Plaud** node
2. Select Resource: Recording, Operation: Get Many
3. Enable "Return All" or set a limit

## Compatibility

- Tested with n8n version 1.0+
- Requires Node.js 18+

## Resources

- [Plaud Official Website](https://plaud.ai)
- [Plaud Developer Documentation](https://docs.plaud.ai)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
