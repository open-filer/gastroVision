export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    if (!env.HF_TOKEN) {
      return new Response(JSON.stringify({ error: 'HF_TOKEN is not defined in Cloudflare dashboard.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const blob = await request.blob();
    if (!blob || blob.size === 0) {
      return new Response(JSON.stringify({ error: 'No image file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Helper to generate a random session hash for Gradio
    const sessionHash = Math.random().toString(36).substring(2, 12);
    const spaceUrl = "https://maxiu-uzumaki-gastrovision.hf.space";

    // 1. Upload file to Hugging Face Space /upload endpoint
    const uploadFormData = new FormData();
    uploadFormData.append('files', blob);

    const uploadResponse = await fetch(`${spaceUrl}/gradio_api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.HF_TOKEN}`
      },
      body: uploadFormData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      return new Response(JSON.stringify({ error: `Hugging Face upload failed: ${errorText}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const uploadResult = await uploadResponse.json();
    const tempFilePath = uploadResult[0];

    // 2. Submit prediction request to the Space queue
    const joinResponse = await fetch(`${spaceUrl}/gradio_api/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.HF_TOKEN}`
      },
      body: JSON.stringify({
        data: [
          {
            path: tempFilePath,
            meta: { _type: "gradio.FileData" }
          }
        ],
        event_data: null,
        fn_index: 0,
        trigger_id: null,
        session_hash: sessionHash
      })
    });

    if (!joinResponse.ok) {
      const errorText = await joinResponse.text();
      return new Response(JSON.stringify({ error: `Failed to join prediction queue: ${errorText}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Listen to the SSE stream to get the final result
    const streamResponse = await fetch(`${spaceUrl}/gradio_api/queue/data?session_hash=${sessionHash}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.HF_TOKEN}`,
        'Accept': 'text/event-stream'
      }
    });

    if (!streamResponse.ok) {
      return new Response(JSON.stringify({ error: 'Failed to establish event stream with Hugging Face Space.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const reader = streamResponse.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let predictionResult = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // Hold onto the last incomplete line

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6).trim();
          try {
            const dataObj = JSON.parse(dataStr);
            if (dataObj.msg === "process_completed") {
              predictionResult = dataObj.output;
              break;
            } else if (dataObj.msg === "process_failed" || dataObj.msg === "queue_full") {
              return new Response(JSON.stringify({ error: `Hugging Face Space prediction failed: ${dataObj.message || 'Unknown error'}` }), {
                status: 502,
                headers: { 'Content-Type': 'application/json' }
              });
            }
          } catch (e) {
            // Ignore JSON parse errors for non-JSON lines or heartbeat pings
          }
        }
      }

      if (predictionResult) {
        break;
      }
    }

    if (!predictionResult) {
      return new Response(JSON.stringify({ error: "Prediction completed without returning result data." }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(predictionResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
