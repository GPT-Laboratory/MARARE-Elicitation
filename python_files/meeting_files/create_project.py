
# API to create a new project
from datetime import datetime
import os
from bson import ObjectId
from dotenv import load_dotenv
from flask import request, jsonify
from pymongo import MongoClient
# from python_files.personas import personas_list
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["MVP"]  # Database name
collection = db["projects"]  # Collection name
user_stories_collection = db["user_stories"]
personas_collection = db["personas"]


# Update Story API
def update_story():
    try:
        data = request.get_json()
        story_id = data.get("_id")
        if not story_id:
            return jsonify({"error": "Story ID is required"}), 400

        # Query to find the document where stories array contains the given story_id
        filter_query = {"stories": {"$elemMatch": {"_id": ObjectId(story_id)}}}
        update_query = {
            "$set": {
                "stories.$.user_story": data.get("user_story"),
                "stories.$.description": data.get("description"),
                "stories.$.epic": data.get("epic"),
                "stories.$.suggestion": data.get("suggestion")
            }
        }

        result = user_stories_collection.update_one(filter_query, update_query)

        if result.modified_count == 0:
            return jsonify({"error": "User story not found or no changes made"}), 404

        return jsonify({"message": "User story updated successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500



# def delete_user_story_version():
#     story_id = request.view_args["story_id"]
#     if not ObjectId.is_valid(story_id):
#         return jsonify({"detail": "Invalid story ID"}), 400
    
#     result = user_stories_collection.delete_one({"_id": ObjectId(story_id)})
    
#     if result.deleted_count == 0:
#         return jsonify({"detail": "User story not found"}), 404
    
#     return jsonify({"message": "User story deleted successfully", "story_id": story_id})

def delete_user_story_version(story_id):
    if not ObjectId.is_valid(story_id):
        return jsonify({"detail": "Invalid story ID"}), 400

    result = user_stories_collection.delete_one({"_id": ObjectId(story_id)})
    
    if result.deleted_count == 0:
        return jsonify({"detail": "User story not found"}), 404

    return jsonify({
        "message": "User story deleted successfully", 
        "story_id": story_id
    }), 200



def delete_user_story(story_id):
    result = user_stories_collection.update_one(
        {"stories": {"$elemMatch": {"_id": ObjectId(story_id)}}},
        {"$pull": {"stories": {"_id": ObjectId(story_id)}}}
    )

    if result.modified_count == 0:
        return jsonify({"error": "Story not found or deletion failed"}), 404

    return jsonify({"message": "User story deleted successfully"}), 200



def fetch_projects():
    print("Fetching projects...")  # Debugging
    try:
        user_id = request.args.get("user_id")  # Get user_id from query params
        if not user_id:
            return jsonify({"detail": "User ID is required"}), 400

        projects = list(collection.find({"user_id": user_id}))  # Filter by user_id
        print(f"Fetching projects for user_id: {user_id}")  # Debugging

        return jsonify([project_serializer(p) for p in projects])
    except Exception as e:
        return jsonify({"detail": f"Error fetching projects: {str(e)}"}), 500

def get_all_user_stories():
    try:
        print("Fetching all user stories...")  # Debugging
        user_id = request.args.get("user_id")

        if not user_id:
            return jsonify({"detail": "User ID is required"}), 400

        # Create query filter - include user_id if provided
        query = {"user_id": user_id} if user_id else {}
        
        # Fetch user stories with the filter
        user_stories_list = list(user_stories_collection.find(query))

        if not user_stories_list:
            return jsonify({"message": f"No user stories found for user {user_id}"}), 404

        # # Fetch all user stories from the collection
        # user_stories_list = list(user_stories_collection.find())

        # Convert all ObjectId fields to strings
        user_stories_list = convert_objectid_to_str(user_stories_list)
        # print(user_stories_list)  # Debugging

        return jsonify(user_stories_list)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


def get_user_stories():
    try:
        project_id = request.view_args.get("project_id")
        print(f"Fetching user stories for project_id: {project_id}")  # Debugging

        if not project_id:
            return jsonify({"error": "Project ID is required"}), 400

        # Fetch all user stories with the given project_id
        user_stories_list = list(user_stories_collection.find({"project_id": project_id}))

        if not user_stories_list:
            return jsonify({"message": "No user stories found for this project"}), 404

        # Convert MongoDB ObjectId to string
        for entry in user_stories_list:
            entry["_id"] = str(entry["_id"])
            for story in entry["stories"]:
                story["_id"] = str(story["_id"])

        return jsonify(user_stories_list)  # Return the full list

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
def get_user_stories_by_project(project_id):
    try:
        print(f"Fetching user stories for project_id: {project_id}")  # Debugging
        
        # Fetch user stories with matching project_id
        user_stories_list = list(user_stories_collection.find({"project_id": project_id}))
        
        if not user_stories_list:
            return jsonify({"message": "No user stories found for this project"}), 404
        
        # Convert ObjectId fields to string
        print(user_stories_list)
        user_stories_list = convert_objectid_to_str(user_stories_list)
           
        
        return jsonify(user_stories_list)

    except Exception as e:
        return jsonify({"error": str(e)}), 500



def creating_project():
    data = request.get_json()
    project_name = data.get("project_name")
    user_id = data.get("user_id")

    if not project_name:
        return jsonify({"detail": "Project name is required"}), 400
    
    # Current date and time
    created_at = datetime.now()

    # Create a new project
    new_project = {"name": project_name, "user_id": user_id, "created_at": created_at}
    result = collection.insert_one(new_project)
    project_id = str(result.inserted_id)  # Convert ObjectId to string

    # Attach project_id and generate a new ObjectId for each persona
    # personas_with_project = [
    #     {**persona, "_id": ObjectId(), "project_id": project_id} for persona in personas_list
    # ]

    print(f"Creating project with ID: {project_id}")  # Debugging

    # Insert personas into MongoDB
    # personas_collection.insert_many(personas_with_project)

    return jsonify({
        "message": "Project created with default personas",
        "project_id": project_id,
        # "id": str(result.inserted_id)
    })

def convert_objectid_to_str(data):
    if isinstance(data, list):
        return [convert_objectid_to_str(item) for item in data]
    elif isinstance(data, dict):
        return {key: convert_objectid_to_str(value) for key, value in data.items()}
    elif isinstance(data, ObjectId):
        return str(data)
    return data


def delete_project(project_id):
    print(f"Deleting project with ID: {project_id}")  # Debugging
    try:
        project_result = collection.delete_one({"_id": ObjectId(project_id)})
        if project_result.deleted_count == 0:
            return jsonify({"detail": "Project not found"}), 404

        user_stories_result = user_stories_collection.delete_many({"project_id": project_id})
        personas_result = personas_collection.delete_many({"project_id": project_id})

        return jsonify({
            "message": "Project and related user stories deleted",
            "project_deleted": project_result.deleted_count,
            "user_stories_deleted": user_stories_result.deleted_count,
            "personas_deleted": personas_result.deleted_count
        })
    



    except Exception as e:
        return jsonify({"detail": f"Error deleting project and user stories: {str(e)}"}), 500
    

def update_project(project_id):
    data = request.get_json()
    new_name = data.get("project_name")

    print(f"Updating project with ID: {project_id}")  # Debugging

    if not new_name:
        return jsonify({"detail": "New project name is required"}), 400

    try:
        result = collection.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": {"name": new_name}}
        )

        if result.matched_count == 0:
            return jsonify({"detail": "Project not found"}), 404

        return jsonify({
            "message": "Project name updated successfully",
            "project_id": project_id,
            "updated_name": new_name
        })

    except Exception as e:
        print(f"Error updating project: {e}")  # Debugging
        return jsonify({"detail": "Invalid Project ID or server error"}), 500


# helper function
# Helper function to convert MongoDB document to dictionary
def project_serializer(project):
    return {
        "id": str(project["_id"]),  # Convert ObjectId to string
        "project_name": project["name"],
        "created_at": project["created_at"].strftime("%Y-%m-%d %H:%M:%S") if "created_at" in project else None,
    }