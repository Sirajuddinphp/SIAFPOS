# Desktop Runtime Access Patch

Integrated on top of the existing first-activation flow without replacing it.

Flow:
1. First cloud activation (`/activation`).
2. Runtime access screen.
3. Start 15-day trial or activate yearly license.
4. Runtime verification on every startup.
5. Offline grace follows the value returned by the cloud API (default 48 hours).

Cloud endpoints:
- `POST /api/v1/runtime/trial/start`
- `POST /api/v1/runtime/yearly/activate`
- `GET /api/v1/runtime/verify`

The runtime token is stored only in the Electron main process store and is removed from IPC responses before they reach the renderer.
