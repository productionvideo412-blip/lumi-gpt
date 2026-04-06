# Lumi GPT

This project has been updated to use open-source model endpoints instead of Lovable cloud AI.

Environment variables expected by the Supabase functions:

- `OPEN_SOURCE_API_URL` — base URL for your open-source model API
- `OPEN_SOURCE_API_KEY` — API key or bearer token for your model endpoint (optional if not required)
- `OPEN_SOURCE_CHAT_MODEL` — default chat model name (defaults to `llama-3-70b`)
- `OPEN_SOURCE_IMAGE_MODEL` — default image model name (defaults to `stable-diffusion-xl`)

Supabase function behavior:

- `/functions/v1/chat` forwards chat messages to the open-source model API using the chat completions endpoint
- `/functions/v1/generate` routes image generation through the open-source image endpoint and text generation through the open-source chat endpoint

If you are self-hosting, point `OPEN_SOURCE_API_URL` at your OpenAI-compatible local model server or your provider's inference endpoint.
