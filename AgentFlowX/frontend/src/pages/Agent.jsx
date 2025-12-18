import { useState } from "react";
import { api } from "../api";
import { startVoiceInput } from "../utils/voice";

export default function Agent() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  async function sendCommand(cmd) {
    const res = await api.post("/agent", { command: cmd });
    setResponse(JSON.stringify(res.data, null, 2));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">AI Agent</h1>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full p-2 text-black"
      />

      <div className="flex gap-2">
        <button
          onClick={() => sendCommand(input)}
          className="bg-indigo-600 px-4 py-2 rounded"
        >
          Send
        </button>

        <button
          onClick={() =>
            startVoiceInput((text) => {
              setInput(text);
              sendCommand(text);
            })
          }
          className="bg-green-600 px-4 py-2 rounded"
        >
          🎤 Speak
        </button>
      </div>

      <pre className="bg-slate-900 p-3">{response}</pre>
    </div>
  );
}
