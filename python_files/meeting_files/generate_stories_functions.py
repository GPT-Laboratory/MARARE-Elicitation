


import os
import re
from dotenv import load_dotenv
from flask import request, jsonify
from bson import ObjectId
from datetime import datetime
import base64
import random
from pymongo import MongoClient  # Changed from AsyncIOMotorClient
import requests

from python_files.meeting_files.create_project import convert_objectid_to_str

# Load environment variables from .env file
load_dotenv()

for key, value in os.environ.items():
    print(f"{key}: {value}")

OPENAI_API_KEY = os.getenv("API-KEY1")
LLAMA_API_KEY = os.getenv("LLAMA-key1")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
OPENAI_URL = "https://api.openai.com/v1/chat/completions"
LLAMA_URL="https://api.groq.com/openai/v1/chat/completions"
DEEPSEEK_URL = "https://openrouter.ai/api/v1/chat/completions"

GPT_API_KEY = os.getenv("GPT_API_KEY")
print(f"DeepSeek API Key: {os.getenv('DEEPSEEK_API_KEY')}")

# Load API keys
api_keys = [os.getenv(f"API-KEY{i}") for i in range(1, 4)]
llama_keys = [os.getenv(f"LLAMA-key{i}") for i in range(1, 3)]

MONGO_URI = os.getenv("MONGO_URI")

# Use synchronous MongoDB client
client = MongoClient(
    MONGO_URI,
    tls=True,
    tlsAllowInvalidCertificates=True
)
           
db = client["MVP"]  # Database name
user_stories_collection = db["user_stories"]  # Collection name
prioritization_collection = db["prioritization_collection"]
final_table_prioritizations = db["final_table_prioritizations"]

def generate_user_stories():
    try:
        data = request.get_json()

        if not data or 'vision' not in data:
            return jsonify({'error': 'Missing required data: vision'}), 400

        headers = {
            "Authorization": f"Bearer {random.choice(api_keys)}",
            "Content-Type": "application/json"
        }

        model = data['model']
        agenda = data['agenda']
        vision = data['vision']
        mvp = data.get('mvp', '')  # Use .get() with default
        user_analysis = data.get('user_analysis', '')  # Use .get() with default
        feedback = data.get('feedback')
        request_id = data.get("request_id")
        context_image = data.get("context_image")
        agents = data.get("agents", [])  # Use .get() with default
        new_version = data.get("new_version", False)
        meeting_transcript = data.get("meeting_transcript", "")

        roles = [agent["role"] for agent in agents] if agents else []
        project_id = data.get("project_id")
        selected_user_story = data.get("selectedUserStory")
        user_id = data.get("user_id")

        print(f"selected user story: {selected_user_story}")
        print(f"feedback: {feedback}")
        print(f"project ID: {project_id}")
        utc_time = datetime.utcnow()


        # ✅ If model is empty string → just save MVP and Vision
        if model == "":
            try:
                user_stories_collection.insert_one({
                    "project_id": project_id,
                    "agenda": agenda,                 # empty
                    "vision": vision,
                    "mvp": mvp,
                    "meeting_transcript": meeting_transcript,     # empty
                    "agents": [],                  # empty
                    "model": "",                   # empty string
                    "stories": [],                 # empty
                    "user_id": user_id,
                    "created_at": str(utc_time)
                })

                return jsonify({
                    "message": "MVP and Vision stored successfully (model is empty)"
                }), 200

            except Exception as e:
                print(f"Database error (model empty): {e}")
                return jsonify({"error": f"Database operation failed: {str(e)}"}), 500
        else:
            image_data = None
            if context_image:
                try:
                    image_data = base64.b64decode(context_image)
                except Exception as e:
                    print(f"Error decoding image: {e}")

            input_content = {
                "vision": vision,
                "mvp": mvp,
                "user_analysis": user_analysis,
                "previous_response": None
            }

            print(f"roles comes: {roles}")

            # Run role processors synchronously
            responses = []
            for role in roles[:2]:
                try:
                    response = process_role(input_content, context_image, model, headers, role, feedback)
                    responses.append(response)
                except Exception as e:
                    print(f"Error processing role {role}: {e}")
                    return jsonify({"error": f"Failed to process role {role}: {str(e)}"}), 500

            print("Generated responses:", responses)

            try:
                best_stories = filter_stories_with_model(responses, model, headers)
                final_response = parse_user_stories(best_stories)
            except Exception as e:
                print(f"Error filtering/parsing stories: {e}")
                return jsonify({"error": f"Failed to process stories: {str(e)}"}), 500

            

            for story in final_response:
                story["_id"] = ObjectId()
                story["created_at"] = str(utc_time)

            # Handle database operations with proper error handling
            try:
                if selected_user_story:
                    existing_entry = user_stories_collection.find_one({"_id": ObjectId(selected_user_story)})
                    if existing_entry:
                        if new_version:
                            user_stories_collection.insert_one({
                                "project_id": project_id,
                                "agenda": agenda,
                                "vision": vision,
                                "mvp": mvp,
                                "meeting_transcript": meeting_transcript,
                                "agents": agents,
                                "model": model,
                                "stories": final_response,
                                "user_id": user_id,
                                "created_at": str(utc_time)
                            })
                        else:
                            user_stories_collection.update_one(
                                {"_id": ObjectId(selected_user_story)},
                                {"$push": {"stories": {"$each": final_response}}}
                            )
                    else:
                        user_stories_collection.insert_one({
                            "project_id": project_id,
                            "agenda": agenda,
                            "vision": vision,
                            "mvp": mvp,
                            "meeting_transcript": meeting_transcript,
                            "agents": agents,
                            "model": model,
                            "stories": final_response,
                            "user_id": user_id,
                            "created_at": str(utc_time)
                        })
                else:
                    user_stories_collection.insert_one({
                        "project_id": project_id,
                        "agenda": agenda,
                        "vision": vision,
                        "mvp": mvp,
                        "meeting_transcript": meeting_transcript,
                        "agents": agents,
                        "model": model,
                        "stories": final_response,
                        "user_id": user_id,
                        "created_at": str(utc_time)
                    })
            except Exception as e:
                print(f"Database error: {e}")
                return jsonify({"error": f"Database operation failed: {str(e)}"}), 500

            return jsonify({
                "message": "User stories generated and stored successfully",
                "final_response": convert_objectid_to_str(final_response)
            })

    except Exception as e:
            print(f"Unexpected error in generate_user_stories: {e}")
            return jsonify({"error": str(e)}), 500
            

        

def process_role(input_content, image_url, model, headers, role, feedback):
    try:
        if model in ["llama3-70b-8192", "mixtral-8x7b-32768", "deepseek-r1-distill-llama-70b-specdec"]:
            url = LLAMA_URL
            headers = headers.copy()  # Don't modify original headers
            headers["Authorization"] = f"Bearer {LLAMA_API_KEY}"
        elif model == "deepseek/deepseek-r1-distill-llama-70b":
            print("deep working bro", model)
            url = DEEPSEEK_URL
            headers = headers.copy()
            headers["Authorization"] = f"Bearer {DEEPSEEK_API_KEY}"
        else:
            url = OPENAI_URL
            headers = headers.copy()
            headers["Authorization"] = f"Bearer {OPENAI_API_KEY}"

        if feedback is None:
            print("No feedback provided. Generating user stories without additional feedback.")
        else:
            print(f"Feedback provided: {feedback}")

        feedback_section = (
            f"Additionally, incorporate the following feedback: '{feedback}'.\n\n"
            if feedback else ""
        )

        prompt_content = (
            "You are a helpful assistant tasked with generating unique user stories and grouping them under relevant epics based on any project vision or MVP goal provided.\n"
            "When generating user stories, ensure they are grouped under relevant epics based on overarching themes, functionalities, or MVP goals identified. Each epic should contain multiple user stories that cover various aspects of the same theme or functionality. "
            "Aim to generate as many stories as necessary to fully cover the scope of the project, with **no upper limit on the number of user stories**. Focus on breaking down large functionalities into individual, task-specific stories.\n\n"
            f"Given the project vision: '{input_content['vision']}' and MVP goals: '{input_content['mvp']}', and user analysis: '{input_content['user_analysis']}', generate a comprehensive and distinct set of user stories that align with these core elements. "
            "Ensure each story comprehensively addresses both functional and technical aspects relevant to the project, with a focus on supporting the project's primary vision and achieving a highly detailed MVP.\n\n"
            + feedback_section +
            "For each user story, provide the following details:\n"
            "1. User Story: A clear and concise description that encapsulates a specific need or problem. Example: 'As a <role>, I want to <action>, in order to <benefit>'. Each story should directly support the project's vision or contribute towards a functional MVP.\n"
            "2. Epic: The broad epic under which the user story falls. Each epic can encompass multiple related user stories that share a similar scope or functionality.\n"
            "3. Description: Detailed acceptance criteria for the user story, specifying what success looks like for the story to be considered complete, particularly in terms of MVP completion and alignment with the vision.\n\n"
            f"4. Suggestion: If this {role} role suggest anything about the stories then provide this {role} role name. Remember role name must be same like this {role}.\n"
            
            "Strictly provide me response in this format for each story:\n"
            "### User Story X:\n"
            "- User Story: As a <role>, I want to <action>, in order to <benefit>.\n"
            "- Epic: <epic> (This epic may encompass multiple related user stories)\n"
            "- Description: Detailed and clear acceptance criteria that define the success of the user story, particularly in achieving MVP functionality and supporting the overall vision. \n"
            "- Suggestion: \n"
            f"    <The role providing the suggestion> {role} \n"
        )

        print(f"Processing role: {role}")

        post_data = {
            "model": model,
            "messages": [
                {"role": "system", "content": f"You are a {role} expert."},
                {"role": "user", "content": prompt_content},
            ],
            "temperature": 0.7,
        }

        response = requests.post(url, json=post_data, headers=headers, timeout=60)
        if response.status_code == 200:
            response_data = response.json()
            print("Received:", response_data)
            return response_data['choices'][0]['message']['content']
        else:
            print(f"API Error for {role}: {response.status_code}, {response.text}")
            raise Exception(f"Failed to process {role}: {response.text}")
    
    except requests.exceptions.RequestException as e:
        print(f"Request error for {role}: {e}")
        raise Exception(f"Network error processing {role}: {str(e)}")
    except Exception as e:
        print(f"Unexpected error processing {role}: {e}")
        raise

def filter_stories_with_model(responses, model, headers):
    try:
        if model in ["llama3-70b-8192", "mixtral-8x7b-32768", "deepseek-r1-distill-llama-70b-specdec"]:
            url = LLAMA_URL
            headers = headers.copy()
            headers["Authorization"] = f"Bearer {LLAMA_API_KEY}"
        elif model == "deepseek/deepseek-r1-distill-llama-70b":
            print("deep working bro", model)
            url = DEEPSEEK_URL
            headers = headers.copy()
            headers["Authorization"] = f"Bearer {DEEPSEEK_API_KEY}"
        else:
            url = OPENAI_URL
            headers = headers.copy()
            headers["Authorization"] = f"Bearer {OPENAI_API_KEY}"

        prompt_content = (
            "You are an expert at analyzing user stories. You will receive a list of user stories and then return these stories...\n"
            "Strictly provide the response in this format for each story:\n"
            "### User Story X:\n"
            "- User Story: As a <role>, I want to <action>, in order to <benefit>.\n"
            "- Epic: <epic>...\n"
            "- Description: ...\n"
            "- Suggestion:\n"
            "    <The role providing the suggestion> {role}\n\n"
        )

        for idx, response_text in enumerate(responses, start=1):
            prompt_content += f"### User Story {idx}:\n{response_text}\n\n"

        post_data = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a helpful assistant capable of selecting the best user stories."},
                {"role": "user", "content": prompt_content},
            ],
            "temperature": 0.7,
        }

        response = requests.post(url, json=post_data, headers=headers, timeout=60)
        if response.status_code == 200:
            print("Response from filtering stories:", response.json())
            return response.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        else:
            print(f"Filter API Error: {response.status_code}, {response.text}")
            return f"Error: {response.status_code}, {response.text}"
    
    except requests.exceptions.RequestException as e:
        print(f"Request error in filter_stories_with_model: {e}")
        raise Exception(f"Network error filtering stories: {str(e)}")
    except Exception as e:
        print(f"Unexpected error in filter_stories_with_model: {e}")
        raise

def parse_user_stories(text_response):
    try:
        pattern = re.compile(
            r"### User Story \d+:\n"
            r"- User Story: (.*?)\n"
            r"- Epic: (.*?)\n"
            r"- Description: (.*?)(?:\n- Suggestion: (.*?))?(?=\n### User Story \d+:|\Z)",
            re.DOTALL
        )

        matches = pattern.findall(text_response)
        user_stories = []

        for match in matches:
            user_stories.append({
                "user_story": match[0].strip(),
                "epic": match[1].strip(),
                "description": match[2].strip(),
                "suggestion": match[3].strip() if match[3] else "No suggestions provided",
            })

        if not user_stories:
            user_stories.append({
                "user_story": "User story not provided",
                "epic": "Epic not provided",
                "description": "Description not provided",
                "suggestion": "Suggestion not provided",
            })

        return user_stories
    
    except Exception as e:
        print(f"Error parsing user stories: {e}")
        return [{
            "user_story": "Error parsing user stories",
            "epic": "Error",
            "description": f"Parsing failed: {str(e)}",
            "suggestion": "No suggestions available",
        }]