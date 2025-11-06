import random
from dotenv import load_dotenv
import requests
import re
import json
import os
import json 
# from langchain.llms import Ollama
from openai import OpenAI
load_dotenv()


# Print all environment variables to verify
print("All environment variables:")
for key, value in os.environ.items():
    print(f"{key}: {value}")

OPENAI_API_KEY = os.getenv("API-KEY1")
LLAMA_API_KEY = os.getenv("LLAMA-key1")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
OPENAI_URL = "https://api.openai.com/v1/chat/completions"
LLAMA_URL="https://api.groq.com/openai/v1/chat/completions"
# DEEPSEEK_URL="https://gptlab.rd.tuni.fi/GPT-Lab/resources/Otula-P40-L4/api/generate",
DEEPSEEK_URL = "https://openrouter.ai/api/v1/chat/completions"

GPT_API_KEY = os.getenv("GPT_API_KEY")
print(f"DeepSeek API Key: {os.getenv('DEEPSEEK_API_KEY')}")
# Load environment variables from .env file
api_keys = [os.getenv(f"API-KEY{i}") for i in range(1, 4)]
llama_keys = [os.getenv(f"LLAMA-key{i}") for i in range(1, 3)]

def generate_user_stories_with_epics( vision, mvp, user_analysis, model, headers):

    if model == "llama3-70b-8192" or model == "mixtral-8x7b-32768":
        url = LLAMA_URL
        headers["Authorization"] = f"Bearer {LLAMA_API_KEY}"
    else:
        url = OPENAI_URL
        headers["Authorization"] = f"Bearer {OPENAI_API_KEY}"

    prompt_content = (
    "You are a helpful assistant tasked with generating unique user stories and grouping them under relevant epics based on any project vision or MVP goal provided.\n"
    "When generating user stories, ensure they are grouped under relevant epics based on overarching themes, functionalities, or MVP goals identified. Each epic should contain multiple user stories that cover various aspects of the same theme or functionality. "
    "Aim to generate as many stories as necessary to fully cover the scope of the project, with **no upper limit on the number of user stories**. Focus on breaking down large functionalities into individual, task-specific stories.\n\n"
    "Given the project vision: '{vision}' and MVP goals: '{mvp}', and user analysis: '{user_analysis}', generate a comprehensive and distinct set of user stories that align with these core elements. "
    "Ensure each story comprehensively addresses both functional and technical aspects relevant to the project, with a focus on supporting the project's primary vision and achieving a highly detailed MVP.\n\n"
    "For each user story, provide the following details:\n"
    "1. User Story: A clear and concise description that encapsulates a specific need or problem. Example: 'As a <role>, I want to <action>, in order to <benefit>'. Each story should directly support the project's vision or contribute towards a functional MVP.\n"
    "2. Epic: The broad epic under which the user story falls. Each epic can encompass multiple related user stories that share a similar scope or functionality.\n"
    "3. Description: Detailed acceptance criteria for the user story, specifying what success looks like for the story to be considered complete, particularly in terms of MVP completion and alignment with the vision.\n\n"
    "Additional Guidance:\n"
    "- **Encourage atomic functionalities**: Create user stories for individual actions and small steps within each phase of the MVP.\n"
    "- **Ensure maximum detail**: Generate highly specific user stories that focus on even the smallest functionalities, such as scanning, logging in, generating reports, and handling errors.\n"
    "- **No upper limit**: Keep breaking down actions until all core and sub-tasks within the MVP are covered.\n\n"
    "Remember Please must use the following format for each story:\n"
    "### User Story X:\n"
    "- User Story: As a <role>, I want to <action>, in order to <benefit>.\n"
    "- Epic: <epic> (This epic may encompass multiple related user stories)\n"
    "- Description: Detailed and clear acceptance criteria that define the success of the user story, particularly in achieving MVP functionality and supporting the overall vision.\n"
    "Again Remember Please must use the provided format for each story:\n"
    ).format(vision=vision, mvp=mvp, user_analysis=user_analysis)




    # Prepare the data for the POST request to OpenAI using the Chat API format
    post_data = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant capable of generating user stories and suggesting epics from the objective."},
            {"role": "user", "content": prompt_content}
        ],
        "temperature": 0.7
    })

    response = requests.post(url, data=post_data, headers=headers)
    
    if response.status_code == 200:
        response_data = response.json()
        generated_content = response_data['choices'][0]['message']['content']
        print(generated_content)
        parsed_stories = parse_user_stories(generated_content)
        print(parsed_stories)
        return parsed_stories
    else:
        raise Exception("Failed to process the request with OpenAI: " + response.text)





def parse_user_stories(text_response):
    # Adjusted pattern to match the structured numbered list format, including the last line without a newline
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


import aiohttp  # Async HTTP client

async def process_role(input_content, image_url, model, headers, role, feedback):
    if model in ["llama3-70b-8192", "mixtral-8x7b-32768", "deepseek-r1-distill-llama-70b-specdec"]:
        url = LLAMA_URL
        headers["Authorization"] = f"Bearer {LLAMA_API_KEY}"
    elif model == "deepseek/deepseek-r1-distill-llama-70b":
        print("deep working bro",model)
        url = DEEPSEEK_URL
        headers["Authorization"] = f"Bearer {DEEPSEEK_API_KEY}"
    else:
        url = OPENAI_URL
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
        f"4. Suggestion: If this {role} role suggest anything about the stories then provide this {role} role name. Remeber role name must be same like this {role}.\n"
        
        "Stricktly provide me response in this format for each story:\n"
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

    async with aiohttp.ClientSession() as session:
            async with session.post(url, json=post_data, headers=headers) as response:
                if response.status == 200:
                    response_data = await response.json()
                    print("coes:", response_data)
                    return response_data['choices'][0]['message']['content']
                else:
                    raise Exception(f"Failed to process {role}: {await response.text()}")


def select_best_stories(responses, roles):
    """
    Filters out user stories where the suggestion role is not in the provided roles list.

    Parameters:
    - responses: List of user story responses (each response is a string).
    - roles: List of valid roles.

    Returns:
    - A string containing only the user stories where the suggestion role is in the roles list.
    """
    filtered_stories = []
    roles = [role.lower() for role in roles]  # Normalize roles to lowercase
    
    for response in responses:
        print("DEBUG RESPONSE:\n", response)  # Debugging step

        # Extract the suggestion role using regex
        match = re.search(r"- Suggestion:\s*(.+)", response)  
        
        if match:
            suggested_role = match.group(1).strip().lower()  # Normalize to lowercase
            
            if any(role in suggested_role for role in roles):  # Partial match allowed
                filtered_stories.append(response)
        else:
            filtered_stories.append(response)  # Keep responses without suggestions

    return "\n".join(filtered_stories) if filtered_stories else "No matching stories found."



def filter_stories_with_model(responses, model, headers):
    """
    Sends all user stories to the AI model and asks it to return only the best ones.

    Parameters:
    - responses: List of user story responses (strings).
    - model: AI model to use.
    - headers: Request headers (including authorization).

    Returns:
    - The best-selected user stories in the required format.
    """

    # Select API URL based on the model
    if model in ["llama3-70b-8192", "mixtral-8x7b-32768", "deepseek-r1-distill-llama-70b-specdec"]:
        url = LLAMA_URL
        headers["Authorization"] = f"Bearer {LLAMA_API_KEY}"
    elif model == "deepseek/deepseek-r1-distill-llama-70b":
        print("deep working bro",model)
        url = DEEPSEEK_URL
        headers["Authorization"] = f"Bearer {DEEPSEEK_API_KEY}"
    else:
        url = OPENAI_URL
        headers["Authorization"] = f"Bearer {OPENAI_API_KEY}"

    # Create a formatted prompt for the AI model
    prompt_content = (
        "You are an expert at analyzing user stories. You will receive a list of user stories and then return these stories.  "
        "Here are the user stories:\n\n"
        
        "Strictly provide the response in this format for each story:\n"
        "### User Story X:\n"
        "- User Story: As a <role>, I want to <action>, in order to <benefit>.\n"
        "- Epic: <epic> (This epic may encompass multiple related user stories)\n"
        "- Description: Detailed and clear acceptance criteria that define the success of the user story, particularly in achieving MVP functionality and supporting the overall vision.\n"
        "- Suggestion:\n"
        "    <The role providing the suggestion> {role}\n\n"
    )

    # Add each response to the prompt
    for idx, response in enumerate(responses, start=1):
        prompt_content += f"### User Story {idx}:\n{response}\n\n"

    # Prepare request data
    post_data = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant capable of selecting the best user stories."},
            {"role": "user", "content": prompt_content},
        ],
        "temperature": 0.7,
    })

    # Make the API call
    response = requests.post(url, data=post_data, headers=headers)

    # Parse the response
    if response.status_code == 200:
        return response.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    else:
        return f"Error: {response.status_code}, {response.text}"

def regenerate_process_role(input_content, model, headers, feedback):
    # Determine the URL and headers based on the model
    if model == "llama3-70b-8192" or model == "mixtral-8x7b-32768":
        url = LLAMA_URL
        headers["Authorization"] = f"Bearer {LLAMA_API_KEY}"
    elif model == "deepseek/deepseek-r1-distill-llama-70b":
        print("deep working bro",model)
        url = DEEPSEEK_URL
        headers["Authorization"] = f"Bearer {DEEPSEEK_API_KEY}"
    else:
        url = OPENAI_URL
        headers["Authorization"] = f"Bearer {OPENAI_API_KEY}"

    print('feedback comes',feedback)   

    if feedback is None:
        print("No feedback provided. Generating user stories without additional feedback.")
    else:
        print(f"Feedback provided: {feedback}")

     # Adjust the prompt to include feedback if provided
    feedback_section = (
        f"Additionally, incorporate the following feedback when generating user stories: '{feedback}'. "
        "Ensure the feedback directly influences the epics, user stories, or acceptance criteria as applicable.\n\n"
        if feedback else ""
    )


    # Create a role-specific prompt based on the input content
    # improvement_prompt = (
    #     "You are an expert in user story refinement. Your task is to enhance the given set of generated user stories based on the provided feedback. "
    #     "Ensure that only the aspects mentioned in the feedback are improved, while preserving the original structure, intent, and categorization of the user stories.\n\n"
    #     "Must follow the instructions of the provided feebback."
        
    #     "### Given User Stories:\n"
    #     f"{input_content['generated_stories']}\n\n"
        
    #     "### Feedback for Improvement:\n"
    #     f"'{feedback_section}'\n\n"
        
    #     "### Instructions:\n"
    #     "- **Do not change the overall structure or remove any user stories unless explicitly asked.**\n"
    #     "- **Only modify aspects that align with the feedback, ensuring all improvements are meaningful and relevant.**\n"
    #     "- **Retain the same number of stories, epics, and descriptions unless the feedback explicitly requests adding new stories.**\n"
    #     "- **If the feedback suggests adding details, expand on the relevant parts without altering other sections.**\n"
    #     "- **If the feedback requests additional user stories, create new ones that align with the project's vision and existing epics while maintaining consistency with the current structure.**\n\n"
        
    #     "### Output Format:\n"
    #     "Provide the improved user stories in the same format as originally structured, ensuring all changes align strictly with the feedback provided."
    #     "Remember Please use the following format for each story:\n"
    #     "### User Story X:\n"
    #     "- User Story: As a <role>, I want to <action>, in order to <benefit>.\n"
    #     "- Epic: <epic> (This epic may encompass multiple related user stories)\n"
    #     "- Description: Detailed and clear acceptance criteria that define the success of the user story, particularly in achieving MVP functionality and supporting the overall vision.\n"
    #     "- Suggestion: \n"
    #     f"   - Role: <The role providing the suggestion>  \n"
        
    # )

    improvement_prompt = (
        "You are an expert in user story refinement. Your task is to improve the given user stories "
        "STRICTLY based on the provided feedback. Do NOT make any modifications beyond what the feedback explicitly requests.\n\n"
        "Must follow the instructions of the provided feebback."

        "### Given User Stories:\n"
        f"{input_content['generated_stories']}\n\n"

        "### Feedback for Improvement:\n"
        f"{feedback_section}\n\n"

        "### Instructions:\n"
        "- **ONLY modify the user stories according to the feedback.** Do NOT assume changes beyond what is mentioned.\n"
        "- **Do NOT add new details unless explicitly stated in the feedback.**\n"
        "- **If the feedback asks for better grouping, reassign user stories to appropriate epics.**\n"
        "- **If the feedback points out duplication, merge or remove stories as required.**\n"
        "- **Do NOT change the number of user stories unless the feedback requests additions or removals.**\n"
        "- **Ensure the feedback directly influences epics, user stories, or acceptance criteria as applicable.**\n\n"

        "### Output Format:\n"
        "Provide the improved user stories in the same format as originally structured, ensuring all changes align strictly with the feedback provided."
        "Remember Please use the following format for each story:\n"
        "### User Story X:\n"
        "- User Story: As a <role>, I want to <action>, in order to <benefit>.\n"
        "- Epic: <epic> (This epic may encompass multiple related user stories)\n"
        "- Description: Detailed and clear acceptance criteria that define the success of the user story, particularly in achieving MVP functionality and supporting the overall vision.\n"
        "- Suggestion: \n"
        f"   - Role: <The role providing the suggestion>  \n"
    )

    # ).format(generated_stories=input_content['generated_stories'], feedback=feedback)

    # Prepare the data for the POST request
    post_data = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": f"You are a helpful assistant capable of generating user stories and suggesting epics from the objective."},
            {"role": "user", "content": improvement_prompt}
        ],
        "temperature": 0.7
    })

    response = requests.post(url, data=post_data, headers=headers)

    if response.status_code == 200:
        response_data = response.json()
        generated_content = response_data['choices'][0]['message']['content']
        print(f"Generated content for role: {generated_content}")
        return generated_content
        
    else:
        raise Exception(f"Failed to process the request for  with OpenAI: {response.text}")



