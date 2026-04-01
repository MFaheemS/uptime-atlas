import { queryClient } from './queryClient';

let ws: WebSocket | null = null;
let reconnectDelay = 1000;

function getWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/api/ws`;
}

export function connectWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  ws = new WebSocket(getWsUrl());

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'monitor:status') {
        queryClient.setQueryData(
          ['monitors'],
          (old: unknown[] | undefined) =>
            old?.map((m: any) => (m.id === msg.monitorId ? { ...m, ...msg.data } : m)) ?? old,
        );
        queryClient.setQueryData(['monitor', msg.monitorId], (old: any) =>
          old ? { ...old, ...msg.data } : old,
        );
      }
    } catch {
      // ignore parse errors
    }
  };

  ws.onclose = () => {
    setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
      connectWebSocket();
    }, reconnectDelay);
  };

  ws.onopen = () => {
    reconnectDelay = 1000;
  };
}

export function disconnectWebSocket() {
  ws?.close();
  ws = null;
}
