'use client';

import { useWebSocket } from '../hooks/useWebSocket';

export function TeamJoined() {
  const { messages, input, setInput, sendMessage } = useWebSocket();
  return (
    <div>
      <div>
        {messages.map((msg, i) => (
          <div key={i}>{msg}</div>
        ))}
      </div>

      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={sendMessage}>전송</button>
    </div>
  );
}
