import re
from flask import  json, request, jsonify
import requests
import time
import os



# Set your OpenAI API key as environment variable for safety
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") or "YOUR_OPENAI_KEY_HERE"

def evaluate_team_metrics(transcript, teams):
    start_time = time.time()

    prompt = f"""
You are an AI evaluator. I will give you a meeting transcript and a list of teams with their vision and MVP.

Transcript:
{transcript}

Teams:
"""
    for team in teams:
        prompt += f"\nTeam: {team['name']}\nVision: {team['vision']}\nMVP: {team['mvp']}\n"

    prompt += """
For each team, calculate the following metrics:
1. Hallucination Rate (HR) → % of features mentioned in team output NOT present in the transcript.
2. Coverage (CV) → % of transcript features present in the team output.
3. Semantic Similarity (SSIM) → a score from 0 to 1 (1 = identical meaning, 0 = completely unrelated).
4. Latency → assume same for all teams for now (can put 0).

Return the output in JSON format like this:
{
  "teams": [
    {"name": "Team Name", "HR": 0.25, "CV": 0.75, "SSIM": 0.85, "Latency": 0},
    ...
  ]
}
"""

    # Direct HTTP request to OpenAI API
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}"
    }
    payload = {
        "model": "gpt-4o-mini",  # or gpt-5-mini
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0
    }

    response = requests.post(url, headers=headers, json=payload)
    result = response.json()

   

    result_text = result['choices'][0]['message']['content']

# Extract JSON inside ```json ... ``` if it exists
    json_match = re.search(r"```json\s*(\{.*?\})\s*```", result_text, re.DOTALL)
    if json_match:
        json_str = json_match.group(1)
    else:
        # fallback: try to find first { ... } block
        json_match = re.search(r"(\{.*\})", result_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            return {"error": "No JSON found in OpenAI response", "raw_response": result_text}

# Now safely parse
    try:
        metrics = json.loads(json_str)
    except Exception as e:
        metrics = {"error": f"Failed to parse JSON: {str(e)}", "raw_response": result_text}


    total_time = time.time() - start_time
    if "teams" in metrics:
        for team in metrics["teams"]:
            team["Latency"] = round(total_time, 2)

    return metrics

def evaluate_teams_view():
    data = request.get_json()
    transcript = data.get("transcript", "")
    teams = data.get("teams", [])

    if not transcript or not teams:
        return jsonify({"error": "Missing transcript or teams data"}), 400

    metrics = evaluate_team_metrics(transcript, teams)
    return jsonify(metrics)

# Add route like your other endpoints


