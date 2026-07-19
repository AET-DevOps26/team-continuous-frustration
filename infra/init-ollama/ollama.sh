#!/bin/bash

# Start Ollama in the background.
/bin/ollama serve &
# Record Process ID.
pid=$!

# Pause for Ollama to start.
sleep 5

echo "🔴 Retrieve embedding..."
ollama pull nomic-embed-text
echo "🟢 Done!"

if [ "$*" = "--pull-llm" ]; then
    echo "🔴 Retrieve LLM..."
    ollama pull qwen3:0.6b
    echo "🟢 Done!"
fi

# Wait for Ollama process to finish.
wait $pid
