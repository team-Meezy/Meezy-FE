import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('클라이언트 연결');

  ws.on('message', (data) => {
    const message = data.toString();

    // 모든 클라이언트에게 브로드캐스트
    clients.forEach((client) => {
      if (client.readyState === ws.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('클라이언트 연결 종료');
  });
});

console.log('WebSocket 서버 실행중 (ws://localhost:8080)');
