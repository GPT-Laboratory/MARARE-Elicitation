import time
import re
from flask import request, jsonify

def extract_features(text):
    """
    Very simple keyword extractor: split by words, lowercase, remove stopwords/punctuation.
    In real-world, replace with spaCy, NLTK, or KeyBERT.
    """
    stopwords = {"the","is","and","to","a","of","in","for","with","on","at","by","an"}
    words = re.findall(r"\b\w+\b", text.lower())
    return set(w for w in words if w not in stopwords)

def calculate_metrics(transcript, teams):
    start_time = time.time()
    latency_ms = round((time.time() - start_time) * 1000, 2)  # in ms


    transcript_features = extract_features(transcript)
    results = []

    for team in teams:
        team_text = f"{team['vision']} {team['mvp']}"
        team_features = extract_features(team_text)

        if not team_features:
            hr = 0
        else:
            hr = len(team_features - transcript_features) / len(team_features)

        if not transcript_features:
            cv = 0
        else:
            cv = len(team_features & transcript_features) / len(transcript_features)

        # Jaccard similarity
        union = team_features | transcript_features
        ssim = len(team_features & transcript_features) / len(union) if union else 0

        results.append({
            "name": team["name"],
            "HR": round(hr, 3),
            "CV": round(cv, 3),
            "SSIM": round(ssim, 3),
            "Latency": latency_ms
        })

    return {"teams": results}

def evaluate_teams_view_with_formulas():
    data = request.get_json()
    transcript = data.get("transcript", "")
    teams = data.get("teams", [])

    if not transcript or not teams:
        return jsonify({"error": "Missing transcript or teams data"}), 400

    metrics = calculate_metrics(transcript, teams)
    return jsonify(metrics)
