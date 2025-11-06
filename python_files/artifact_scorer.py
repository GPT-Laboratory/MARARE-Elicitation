# backend/score_artifacts.py
from flask import request, jsonify
from flask_cors import CORS
import requests, os, json, re, time




import re, time, json
from flask import request, jsonify

STOPWORDS = {"the","is","and","to","a","of","in","for","with","on","at","by","an","it","this","that","as"}

def extract_features(text):
    words = re.findall(r"\b\w+\b", text.lower())
    return set(w for w in words if w not in STOPWORDS)

def average_sentence_length(text):
    sentences = re.split(r"[.!?]", text)
    sentences = [s.strip() for s in sentences if s.strip()]
    if not sentences: 
        return 0
    return sum(len(s.split()) for s in sentences) / len(sentences)

def score_artifacts(transcript: str, mvp: str, vision: str):
    start = time.time()
    
    transcript_features = extract_features(transcript)
    mvp_features = extract_features(mvp)
    vision_features = extract_features(vision)
    artifact_features = mvp_features | vision_features

    # Correctness
    correctness = 0
    if artifact_features:
        correctness = round(3 * len(artifact_features & transcript_features) / len(artifact_features))

    # Completeness
    completeness = 0
    if transcript_features:
        completeness = round(3 * len(artifact_features & transcript_features) / len(transcript_features))

    # Consistency (Jaccard MVP vs Vision)
    consistency = 0
    union = mvp_features | vision_features
    if union:
        consistency = round(3 * len(mvp_features & vision_features) / len(union))

    # Clarity (sentence length heuristic)
    avg_len = average_sentence_length(mvp + ". " + vision)
    if avg_len <= 10:
        clarity = 3
    elif avg_len <= 20:
        clarity = 2
    elif avg_len <= 30:
        clarity = 1
    else:
        clarity = 0

    latency_ms = round((time.time() - start) * 1000, 2)

    result = {
        "Correctness": correctness,
        "Completeness": completeness,
        "Consistency": consistency,
        "Clarity": clarity,
        "Rationale": (
            f"Artifacts overlap {len(artifact_features & transcript_features)} features "
            f"with transcript. MVP/Vision share {len(mvp_features & vision_features)} common terms. "
            f"Avg sentence length: {avg_len:.1f} words."
        ),
        "Latency": latency_ms
    }

    return result, 200

def score_artifacts_view():
    body = request.get_json(silent=True) or {}
    transcript = body.get("transcript", "").strip()
    mvp = body.get("mvp", "").strip()
    vision = body.get("vision", "").strip()

    if not transcript or not mvp or not vision:
        return jsonify({"error": "Missing transcript, mvp, or vision"}), 400

    result, code = score_artifacts(transcript, mvp, vision)
    return jsonify(result), code




