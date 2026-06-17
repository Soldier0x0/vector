# Vector Pipeline UI

React + TypeScript frontend for managing Vector pipelines. Talks to `vector-ui-backend` on `http://localhost:4000`.

## Stack

- Vite + React + TypeScript
- Tailwind CSS (BRIEFR design tokens)
- React Flow (pipeline builder)
- Monaco Editor (VRL)
- cmdk (command palette), sonner (toasts), recharts, framer-motion

## Development

```bash
cd vector-ui
npm install
npm run dev
```

The dev server proxies `/api` and `/ws` to `localhost:4000`.

## Routes

| Route | Description |
|-------|-------------|
| `/builder` | Pipeline graph editor |
| `/vrl/:transformId` | VRL editor with test panel |
| `/monitor` | Live metrics via WebSocket |
| `/templates` | VRL template library |
| `/audit` | Config change audit log |

## Project Structure

```
vector-ui/src/
├── api/           # Backend client
├── components/
│   ├── shell/     # App shell, sidebar, top bar, command palette
│   ├── ui/        # Shared UI primitives
│   ├── builder/   # Pipeline builder + React Flow nodes
│   ├── vrl/       # VRL editor
│   ├── monitor/   # Live monitor
│   ├── templates/ # Template library
│   └── audit/     # Audit log
├── hooks/
├── lib/           # Schemas, templates, utilities
├── routes/
├── stores/        # Zustand app state
└── types/
```
