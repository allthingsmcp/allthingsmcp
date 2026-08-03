# Diagram language

## Node taxonomy

- Host/application: neutral slate, monitor/application glyph.
- MCP client: action blue, client glyph.
- MCP server: semantic green, hexagon/server glyph.
- Gateway or authorization server: violet, shield/gateway glyph.
- Data or external service: neutral gray, database/cloud glyph.
- User: outline figure, always named by role when relevant.

## Edges

- Solid navy: request/response or direct transport connection.
- Dashed navy: discovery, routing, or out-of-band relationship.
- Violet dashed: telemetry or policy signal.
- Green highlight: current step or successful verification.

Never encode meaning by color alone. Use labels, line styles, or shapes. Avoid crossed edges, ornamental gradients, faux 3D, and unlabeled arrows. Keep node text short and explain nuance in nearby prose.
