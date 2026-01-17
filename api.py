# Get admin user by meeting_id


import asyncio
import datetime
from multiprocessing.connection import Client
import threading
from bson import ObjectId
from flask import Flask, jsonify, redirect, request, send_from_directory
from python_files.artifact_scorer import score_artifacts_view
from python_files.metrices import evaluate_teams_view
from python_files.metrices_formulas import evaluate_teams_view_with_formulas
from python_files.socketio_instance import socketio
from flask_socketio import emit, join_room, leave_room

from flask_cors import CORS
import os
import json
import base64
import io
import uuid
import time
from dotenv import load_dotenv
from pathlib import Path




# MCP imports
from fastmcp import FastMCP, Client
# from python_files.mcp_server import GLOBAL_CONFIG, async_list_tools, call_tool_func, run_mcp_server
# from slack_sdk import WebClient
# from slack_sdk.errors import SlackApiError

from python_files.langraph_agents_for_bussiness_meeting import  STORAGE_LOCK, get_or_create_meeting_storage, graph, reset_meeting_storage


from gtts import gTTS
import requests
from pymongo import MongoClient
# from python_files.final_report import createDOCXReport, get_all_reports_by_user_id, get_meeting_reports, get_report
# from python_files.final_table_prioritization import get_final_prioritization, get_final_table_prioritization
# from python_files.mcp_functions import run_async
# from python_files.mcp_openai_format import MCPAgent
from python_files.meeting_files.generate_stories_functions import generate_user_stories
# from python_files.personas import add_persona, delete_persona, get_personas, personas_list, update_persona
# from python_files.mcp_agent import IntelligentMCPAgent
from python_files.meeting_files import create_project
from python_files.meeting_files.end_call import leave_call
from python_files.meeting_files.create_project import delete_project, delete_user_story, delete_user_story_version, fetch_projects, get_all_user_stories, creating_project, get_user_stories_by_project, update_project, update_story
# from python_files.prioritization import  handle_final_prioritization_workflow_sync, run_agents_workflow_sync
# from python_files.rag_processing import  format_project_data, generate_unique_filename, process_project_files, validate_file_upload
from python_files.turn_stun_servers import webrtc_config_view
# from python_files.upgrade_user_story import upgrade_story

# Load environment variables
load_dotenv()


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, 'dist')

app = Flask(__name__, static_folder=DIST_DIR, static_url_path='')


MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["MVP"]  # Database name
mcp_configurations = db["mcp_configurations"]  # Collection name for project reports
db2 = client["Admins"]
admin_collections= db2["admins"]  # Collection name for admin users
transcript_history = []


# MCP Server Setup

MCP_SERVERS = {
    "notion": "http://localhost:3000/mcp",
}

# Initialize MCP


# Global dynamic state for MCP
ACTIVE_TOOLS = []
DYNAMIC_TOKENS = {}

# Environment variables for MCP
NOTION_API_KEY = os.getenv("NOTION_API_KEY")
NOTION_DATABASE_ID = os.getenv("NOTION_DATABASE_ID")
# SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN")
JIRA_URL = os.getenv("JIRA_URL")  
JIRA_EMAIL = os.getenv("JIRA_EMAIL")
JIRA_API_TOKEN = os.getenv("JIRA_API_TOKEN")

print("notin key in api ", NOTION_API_KEY)
# AUTH_TOKENS = {
#     "notion": NOTION_API_KEY,
# }


# OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

import mimetypes
mimetypes.add_type('application/javascript', '.js')

from python_files.socketio_instance import socketio
socketio.init_app(app, async_mode='threading', cors_allowed_origins='*')


@app.route('/')
def serve_root():
    return send_from_directory(DIST_DIR, 'index.html')

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory(os.path.join(DIST_DIR, 'assets'), filename)

@app.route('/<path:path>')
def serve_react_app(path):
    file_path = os.path.join(DIST_DIR, path)
    if os.path.exists(file_path):
        return send_from_directory(DIST_DIR, path)
    else:
        # fallback for React Router
        return send_from_directory(DIST_DIR, 'index.html')

# app = Flask(__name__, static_folder='dist', static_url_path='')
# app = Flask(__name__)
CORS(app)


import mimetypes
mimetypes.add_type('application/javascript', '.js')

from python_files.socketio_instance import socketio



# socketio = socketio(app, async_mode='threading', cors_allowed_origins='*')

socketio.init_app(app, async_mode='threading', cors_allowed_origins='*')


# print("Using async_mode:", socketio.async_mode)

# Store rooms data - this will be our source of truth for room membership
rooms = {}
screen_sharers = {}  # { roomId: userId }
room_admins = {}
pending_join_requests = {}
active_reactions = {}
# Store active socket connections
active_connections = set()
raised_users_by_room = {}
users={}

# Store active agent offers per meeting
active_agents = {}  # { meeting_id: { "offer": offer_sdp, "agentId": "openai-agent" } }


# OpenAI API key from environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Function to try import RAG process if available
# try:
#     import rag_process
# except ImportError:
#     rag_process = None
#     print("RAG process module not found, skipping import")

# Serve static files

@app.route('/api1/ephemeral-key', methods=['POST'])
def get_ephemeral_key():
    url = "https://api.openai.com/v1/realtime/sessions"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-realtime-2025-08-28",
        "voice": "echo"
        # "voice": "ash"
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.ok:
        return jsonify(response.json())
    else:
        return jsonify({"error": response.text}), response.status_code

@app.route('/<project_id>/<meeting_id>')
def serve_meeting_page_with_meeting(project_id, meeting_id):
    return send_from_directory(app.static_folder, 'index.html')

# @app.route('/', defaults={'path': ''})
# @app.route('/<path:path>')
# def serve(path):
#     if path and os.path.exists(os.path.join(app.static_folder, path)):
#         return send_from_directory(app.static_folder, path)
#     else:
#         return send_from_directory(app.static_folder, 'index.html')



# Debug helper to print room state
# def print_room_state():
#     print("\n=== CURRENT ROOM STATE ===")
#     for room_id, users in rooms.items():
#         print(f"Room {room_id}: {len(users)} users")
#         for i, user in enumerate(users):
#             # print(f"  User {i+1}: {user['userId']} (active: {user['userId'] in active_connections})")
#     print("==========================\n")

# Socket.IO event handlers
@socketio.on('connect')
def handle_connect():
    print(f"A user connected: {request.sid}")
    active_connections.add(request.sid)
    print(f"Active connections: {len(active_connections)}")
    # print_room_state()
    
    # Send user ID to client
    emit('user-ID', request.sid)



@socketio.on('join-room')
def handle_join_room(data):
    print(f"Received join-room data: {data}")  # Debug log
    user_id = request.sid
    meeting_id = data.get('meetingId')
    mic_enabled = data.get('micEnabled', False)
    video_enabled = data.get('videoEnabled', False)
    agent = data.get('agent', False)
    agent_name = data.get('agentName', '')  # Use a default value if not present
    remote_name = data.get('userName', '')
    aid = data.get('aid', None)  # Get aid from data if available

    print(f"{remote_name} {aid} is name in backend")

    
    # Validation
    if meeting_id is None:
        print("Error: No meetingId provided")
        return
    
        
    
    
    # Initialize room if it doesn't exist
    if meeting_id not in rooms:
        rooms[meeting_id] = []
        room_admins[meeting_id] = {
            'userId': user_id,
            "aid": aid,
        }

        # Save admin status in db with expiry time and user id
        from datetime import datetime, timedelta, timezone
        expiry_time = datetime.now(timezone.utc) + timedelta(hours=1)
        admin_doc = {
            'meeting_id': meeting_id,
            'user_id': aid,
            'is_admin': True,
            'is_agent': agent,
            'agent_Name': agent_name,
            'exp': expiry_time.isoformat()
        }
        try:
            admin_collections.insert_one(admin_doc)
            print(f"Admin status saved in db for meeting {meeting_id}, user {aid}, expires at {expiry_time}")
        except Exception as e:
            print(f"Error saving admin status in db: {e}")
        
    print(f"Room Admin for room {meeting_id}: {room_admins[meeting_id]}")

    # if len(rooms[meeting_id]) == 0:
    #     # If the room is empty, set the user as the admin
    #     room_admins[meeting_id] = request.sid
    #     print(f"User {request.sid} is the admin of room {meeting_id}")
    #     emit('admin-status', {'isAdmin': True}, to=user_id)


    # Add user to the room with Socket.IO room
    join_room(meeting_id)

    # Check if user is already in the room
    user_exists = False
    for user in rooms[meeting_id]:
        if user['userId'] == request.sid:
            user['micEnabled'] = mic_enabled
            user['isAgent'] = agent
            user['agentName'] = agent_name
            user['remoteName'] = remote_name
            user['videoEnabled'] = video_enabled
            user_exists = True
            break

    # Add this check for OpenAI agent
    # is_openai_agent = data.get('isOpenAIAgent', False)
    # openai_session_id = data.get('openaiSessionId', None)
    
    # If user doesn't exist in the room, add them
    if not user_exists:
        # if is_openai_agent:
        #     rooms[meeting_id].append({
        #          'userId': request.sid,
        #         'micEnabled': mic_enabled,
        #         'isAgent': agent,
        #         'agentName': agent_name,
        #         'remoteName': remote_name,
        #         'videoEnabled': video_enabled,
        #         'isOpenAIAgent': is_openai_agent,  # Add this flag
        #         'openaiSessionId': openai_session_id,  # Link to OpenAI session
        #     })
        #     print(f"OpenAI Agent {request.sid} added to room {meeting_id}")
        # else:
            rooms[meeting_id].append({
                'userId': request.sid,
                'micEnabled': mic_enabled,
                'isAgent': agent,
                'agentName': agent_name,
                'remoteName': remote_name,
                'videoEnabled': video_enabled,
            })

    print(f"User {request.sid} joined room {meeting_id} with mic {mic_enabled} and agent {agent} named {agent_name} videoEnabled {video_enabled}")
    
    # Print all users in the room for debugging
    print(f"All users in room {meeting_id}:")
    for i, user in enumerate(rooms[meeting_id]):
        print(f"  User {i+1}: {user['userId']}")
    
    # Broadcast to others in the room that a new user connected
    emit('user-connected', {
        'userId': request.sid,
        'micEnabled': mic_enabled,
        'isAgent': agent,
        'agentName': agent_name,
        'remoteName': remote_name,
        'videoEnabled': video_enabled,
        # 'isOpenAIAgent': is_openai_agent,
    }, to=meeting_id, skip_sid=request.sid)
    # }, to=meeting_id,)

    
    # Get latest user joined
    latest_user = next((user for user in rooms[meeting_id] if user['userId'] == request.sid), None)
    
    if latest_user:
        data = remote_name or request.sid[:4]
        welcome_text = f"Welcome {data} in the room"
        
        try:
            # Generate welcome audio
            tts = gTTS(text=welcome_text, lang='en')
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            audio_base64 = base64.b64encode(audio_buffer.read()).decode('utf-8')
            
            # Send audio to the new user
            emit('welcome-audio', {'audio': audio_base64}, to=request.sid)
            print(f"Welcome audio sent to user {request.sid}")
        except Exception as e:
            print(f"Error generating audio: {e}")
    
    print(f"Total users in the room after new user joined: {len(rooms[meeting_id])}")
    # print_room_state()


    # Check if someone is sharing screen in this room
    is_screen_sharing = False
    sharing_user_id = None
    
    if meeting_id in screen_sharers:
        is_screen_sharing = True
        sharing_user_id = screen_sharers[meeting_id]
    
    # Notify the new user about screen sharing status
    emit('screen-sharing-status', {
        'isSharing': is_screen_sharing,
        'userId': sharing_user_id
    })
    
    # If someone is sharing screen, notify them about the new user
    if is_screen_sharing:
        emit('new-user-for-screen', {
            'newUserId': request.sid,
            'roomId': meeting_id,
            'screenSharing': True
        }, to=sharing_user_id)
    for user in rooms[meeting_id]:
            userId= user['userId']
            micEnabled= user['micEnabled']
            isAgent= user.get('isAgent', False)
            agentName= user.get('agentName', '')
            remoteName=user.get('remoteName','')
            videoEnabled= user.get('videoEnabled','')
            print(f"Data for users: {userId},  {videoEnabled}, {remoteName}")
    # Send the list of existing peers to the newly joined user
    emit('existing-peers', [
        {
            'userId': user['userId'],
            'micEnabled': user['micEnabled'],
            'isAgent': user.get('isAgent', False),
            'agentName': user.get('agentName', ''),
            'remoteName': user.get('remoteName',''),
            'videoEnabled': user.get('videoEnabled','')
        } for user in rooms[meeting_id]
    ],
    room=meeting_id
    )


        # After notifying peers...
    captions_enabled = room_admins[meeting_id].get("captions", False)
    if captions_enabled:
        emit("captions-status", {
            "enableCaptions": True,
            "message": "Transcription activated by admin"
        }, to=request.sid)


    screen_sharer_id = screen_sharers.get(meeting_id)
    if screen_sharer_id:
        print(f"Notifying screen sharer {screen_sharer_id} to send screen to new user {request.sid}")
        emit('new-user-for-screen', {
            'newUserId': request.sid,
            'roomId': meeting_id,
            'screenSharing': True
        }, to=screen_sharer_id)


@socketio.on('openai-agent-audio')
def handle_openai_agent_audio(data):
    meeting_id = data.get('meetingId')
    audio_data = data.get('audioData')
    agent_id = data.get('agentId')
    
    if meeting_id in rooms:
        # Broadcast OpenAI agent audio to all peers in the room except the creator
        emit('openai-agent-audio-stream', {
            'agentId': agent_id,
            'audioData': audio_data,
            'agentName': 'OpenAI Assistant'
        }, to=meeting_id, skip_sid=request.sid)


@socketio.on('openai-agent-value')
def handle_active_agent(data):
    meeting_id = data.get('meetingId')
    activeAgent = data.get('activeAgent')
    user_id = request.sid
   
    if meeting_id in rooms:
        # Broadcast OpenAI agent audio to all peers in the room except the creator
        print(f'openai-agent-value in backend {activeAgent}')
        emit('openai-agent-value', {
            'activeAgent': activeAgent,
        }, to=meeting_id,  skip_sid=request.sid)


@socketio.on('openai-agent-ready')
def handle_agent_ready(data):
    meeting_id = data.get('meetingId')
    ready = data.get('ready')
   
    if meeting_id in rooms:
        print(f'openai-agent-ready in backend {ready}')
        emit('openai-agent-ready', {
            'ready': ready,
        }, to=meeting_id, skip_sid=request.sid)






@socketio.on('request-to-join')
def handle_request_to_join(data):
    meeting_id = data.get('meetingId')
    user_id = request.sid
    s_id = data.get('s_id', None)  # Get aid from data if available
    print(f"User {user_id} requested to join meeting {meeting_id}")

    if meeting_id not in rooms:
        emit('join-error', {'message': 'Meeting does not exist'}, to=user_id)
        return
    
    # Get admin for this room
    ids = room_admins.get(meeting_id)
    admin_id = ids.get('userId') 
    print(f"Admin for room {meeting_id}: {admin_id}")
    
    if not admin_id:
        emit('join-error', {'message': 'No admin available'}, to=user_id)
        return
    
    # Store the request
    if meeting_id not in pending_join_requests:
        pending_join_requests[meeting_id] = {}
    
    pending_join_requests[meeting_id][user_id] = {
        'userId': user_id,
        'name': data.get('name'),
        'micEnabled': data.get('micEnabled', False),
        'videoEnabled': data.get('videoEnabled', False),
        's_id': data.get('s_id', None)  # Store aid if available
    }

    print(f"Pending join requests for meeting {meeting_id}: {pending_join_requests[meeting_id]}")
    
    # Notify admin
    emit('join-request', {
        'userId': user_id,
        'userData': pending_join_requests[meeting_id][user_id],
        'meetingId': meeting_id
    }, to=admin_id)




# --- Agent sends Offer ---
# --- Agent sends Offer ---
@socketio.on('agent-peer-offer')
def handle_agent_offer(data):
    meeting_id = data.get('meetingId')
    agent_id = data.get('fromUserId')
    offer = data.get('offer')
    to_user_id = data.get('toUserId')
    
    if meeting_id not in active_agents:
        active_agents[meeting_id] = {}
    active_agents[meeting_id]["agentId"] = agent_id
    print(f"🤖 Received agent offer for meeting {meeting_id} (target: {to_user_id})")
    
    payload = {
        'offer': offer,
        'fromUserId': agent_id,
        'remoteName': data.get('remoteName', 'AI Assistant'),
        'is_openai_agent': data.get('is_openai_agent', True)
    }
    
    if to_user_id:
        emit('agent-offer', payload, to=to_user_id)
    else:
        emit('agent-offer', payload, to=meeting_id, include_self=False)
    
    print(f"📤 Broadcasted agent offer to meeting {meeting_id}")

# --- Peer sends Answer back to Agent ---
@socketio.on('peer-agent-answer')
def handle_peer_answer(data):
    meeting_id = data.get('meetingId')
    print(f"📥 Peer sent answer for meeting {meeting_id}")
    emit('agent-peer-answer', data, to=meeting_id)

# --- Agent ICE → Peers ---
@socketio.on('agent-ice')
def handle_agent_ice(data):
    meeting_id = data.get('meetingId')
    to_user_id = data.get('toUserId')
    data['fromUserId'] = data.get('fromUserId') or request.sid
    print(f"🧊 Forwarding agent ICE to meeting {meeting_id} target={to_user_id}")  # Add this log
    if to_user_id:
        emit('agent-ice-candidate', data, to=to_user_id)
    else:
        emit('agent-ice-candidate', data, to=meeting_id, include_self=False)

# --- Peer ICE → Agent ---
@socketio.on('peer-agent-ice')
def handle_peer_ice(data):
    meeting_id = data.get('meetingId')
    data['fromUserId'] = request.sid
    target_agent = data.get('toUserId') or active_agents.get(meeting_id, {}).get("agentId")
    print(f"📤 Forwarding peer ICE to agent in {meeting_id} target={target_agent}")  # Add this log
    if target_agent:
        emit('peer-agent-ice', data, to=target_agent)
    else:
        emit('peer-agent-ice', data, to=meeting_id)




@socketio.on('captions-toggled')
def handle_captions_toggled(data):
    meeting_id = data.get('meetingId')
    user_id = data.get('userId')
    enable_captions = data.get('enableCaptions', False)

    print(f"Captions toggled in room {meeting_id} by {user_id}: {enable_captions}")

    # Store captions state for this meeting
    if meeting_id not in rooms:
        print(f"Error: Room {meeting_id} does not exist")
        return
    
    # Save captions state
    if "captions" not in room_admins[meeting_id]:
        room_admins[meeting_id]["captions"] = False
    room_admins[meeting_id]["captions"] = enable_captions

    # Broadcast the state to all users in the room
    if enable_captions:
        message = "Transcription activated by admin"
    else:
        message = "Transcription deactivated by admin"

    emit("captions-status", {
        "enableCaptions": enable_captions,
        "message": message
    }, room=meeting_id)
  

@socketio.on('approve-join')
def handle_approve_join(data):
    meeting_id = data.get('meetingId')
    user_id = data.get('userId')
    admin_id = request.sid
    print(f"Admin {admin_id} approved join request for user {user_id} in meeting {meeting_id}")
    approved = data.get('approved', False)
    print("aproved", approved)
    # Verify admin status
    ids = room_admins.get(meeting_id)
    admin = ids.get('userId') 
    print("admin in approve", admin)
    if admin != admin_id:
        emit('error', {'message': 'Only admin can approve requests'}, to=admin_id)
        return
    
    if meeting_id not in pending_join_requests or user_id not in pending_join_requests[meeting_id]:
        emit('error', {'message': 'Invalid join request'}, to=admin_id)
        return
    
    if approved:
        # Add user to room (using your existing join-room logic)
        print("inside the approved")
        user_data = pending_join_requests[meeting_id][user_id]
        emit('join-approved', {
            'meetingId': meeting_id
        }, to=user_id)
        
        join_room(meeting_id)
        rooms[meeting_id].append({
            'userId': user_id,
            'micEnabled': user_data['micEnabled'],
            'isAdmin': False,
            'isAgent': False,
            'videoEnabled':user_data['videoEnabled']
        })
        
        # Notify all participants
        # emit('user-connected', {
        #     'userId': user_id,
        #     'micEnabled': user_data['micEnabled']
        # }, to=meeting_id,skip_sid=request.sid)
        
        
        # Send existing peers to new user
        emit('existing-peers', [
            {'userId': u['userId'], 'micEnabled': u['micEnabled'], 'videoEnabled': u['videoEnabled']} 
            for u in rooms[meeting_id] if u['userId'] != user_id
        ], to=user_id)
        
        # Notify requester
        # emit('join-approved', {
        #     'meetingId': meeting_id
        # }, to=user_id)
    else:
        # Notify requester
        emit('join-rejected', {
            'meetingId': meeting_id,
            'reason': data.get('reason', 'Request denied')
        }, to=user_id)
    
    # Clean up
    del pending_join_requests[meeting_id][user_id]


@socketio.on('send-reaction')
def handle_reaction(data):
    """
    Handle incoming reactions and broadcast to all other clients
    """
    try:
        # Validate incoming data
        if not all(key in data for key in ['userId', 'reaction']):
            raise ValueError("Invalid reaction data format")
        
        # Add timestamp
        reaction_data = {
            'userId': data['userId'],
            'reaction': data['reaction'],
            'timestamp': int(time.time() * 1000) 
             # Milliseconds for consistency with JS
        }
        
        # Store reaction (optional)
        if data['userId'] not in active_reactions:
            active_reactions[data['userId']] = []
        active_reactions[data['userId']].append(reaction_data)
        
        # Broadcast to all clients except sender
        emit('receive-reaction', 
             reaction_data,
             broadcast=True,
             include_self=False)
        
        # Log for debugging
        print(f"Reaction received from {data['userId']}: {data['reaction']}")
        
    except Exception as e:
        print(f"Error handling reaction: {str(e)}")
        emit('reaction-error', {'message': str(e)})

# Optional: Cleanup old reactions periodically
def cleanup_reactions():
    while True:
        current_time = int(time.time() * 1000)
        expired = current_time - 5000  # 5 second TTL for reactions
        
        for user_id in list(active_reactions.keys()):
            active_reactions[user_id] = [
                r for r in active_reactions[user_id]
                if r['timestamp'] > expired
            ]
            if not active_reactions[user_id]:
                del active_reactions[user_id]
        
        time.sleep(10)  # Run cleanup every 10 seconds

@socketio.on("hand_toggle")
def handle_hand_toggle(data):
    meeting_id = data.get("meetingId")
    user_id = data.get("userId")
    raised = data.get("raised")
    userName = data.get("userName")
    
    print(f"Hand toggle: User {user_id} in meeting {meeting_id}, raised: {raised}")
    
    # Initialize meeting room if not exists
    if meeting_id not in raised_users_by_room:
        raised_users_by_room[meeting_id] = []
    
    # Add or remove user from raised hands list
    if raised:
        # Add user to raised hands list if not already there
        if user_id not in raised_users_by_room[meeting_id]:
            raised_users_by_room[meeting_id].append(user_id)
    else:
        # Remove user from raised hands list
        if user_id in raised_users_by_room[meeting_id]:
            raised_users_by_room[meeting_id].remove(user_id)
    
    # Broadcast updated raised hands list to all participants in the meeting
    emit("update_hands", {
        "raisedUsers": raised_users_by_room[meeting_id],
        "userName": userName,
        "isRaised": raised
    }, room=meeting_id)



@socketio.on('offer')
def handle_offer(data):
    to_sid = data.get('to')
    print(f"data in offer ${data}")
    offer = data.get('offer')
    if to_sid and offer:
        emit('offer', {
            'from': request.sid,
            'offer': offer,
            'isAgent': data.get('agent'),
            'agentName': data.get('agentName'),
            'remoteName': data.get('userName'),
            'videoEnabled': data.get('enableVideo'),
            'micEnabled': data.get('enableAudio'),
            # 'isOpenAIAgent': data.get('isOpenAIAgent', False),
        }, to=to_sid)

@socketio.on('answer')
def handle_answer(data):
    to_sid = data.get('to')
    answer = data.get('answer')
    if to_sid and answer:
        emit('answer', {
            'from': request.sid,
            'answer': answer,
            'isAgent': data.get('isAgent'),
            'agentName': data.get('agentName'),
            'remoteName': data.get('remoteName'),
            'videoEnabled': data.get('videoEnabled'),
            'micEnabled': data.get('micEnabled'),
            # 'isOpenAIAgent': data.get('isOpenAIAgent', False),
        }, to=to_sid)


@socketio.on('ice-candidate')
def handle_ice_candidate(data):
    to_sid = data.get('to')
    candidate = data.get('candidate')
    if to_sid and candidate:
        emit('ice-candidate', {'from': request.sid, 'candidate': candidate}, to=to_sid)

@socketio.on('register-screen-sharer')
def register_screen_sharer(data):
    """Register a user as the screen sharer for a room"""
    room_id = data.get('roomId')
    if room_id:
        screen_sharers[room_id] = request.sid
        print(f"User {request.sid} registered as screen sharer for room {room_id}")

@socketio.on('screen-share')
def handle_screen_share(data):
    room_id = data.get('roomId')
    offer = data.get('offer')
    to_user_id = data.get('to')
    
    if room_id and offer:
        # Register as screen sharer
        screen_sharers[room_id] = request.sid
        print(f"User {request.sid} sharing screen in meeting {room_id}")
        
        if to_user_id:
            # Direct to specific user
            emit('screen-share', {
                'userId': request.sid,
                'roomId': room_id,
                'offer': offer
            }, to=to_user_id)
        else:
            # Broadcast to the room (excluding sender)
            emit('screen-share', {
                'userId': request.sid,
                'roomId': room_id,
                'offer': offer
            }, to=room_id, skip_sid=request.sid)

@socketio.on('screen-answer')
def handle_screen_answer(data):
    to_user_id = data.get('to')
    answer = data.get('answer')
    
    if to_user_id and answer:
        print(f"Screen answer from {request.sid} to {to_user_id}")
        emit('screen-answer', {
            'from': request.sid,
            'answer': answer
        }, to=to_user_id)

@socketio.on('screen-candidate')
def handle_screen_candidate(data):
    to_user_id = data.get('to')
    candidate = data.get('candidate')
    
    if to_user_id and candidate:
        print(f"Screen ICE candidate from {request.sid} to {to_user_id}")
        emit('screen-candidate', {
            'from': request.sid,
            'candidate': candidate
        }, to=to_user_id)

@socketio.on('stop-screen-share')
def handle_stop_screen_share(data):
    room_id = data.get('roomId')
    
    if room_id:
        print(f"User {request.sid} stopped sharing screen in meeting {room_id}")
        emit('stop-screen-share', {
            'userId': request.sid,
            'roomId': room_id
        }, to=room_id, skip_sid=request.sid)
        
        # Remove from screen sharers
        if screen_sharers.get(room_id) == request.sid:
            del screen_sharers[room_id]

@socketio.on('screen-sharing-status')
def handle_screen_sharing_status(data):
    room_id = data.get('roomId')
    is_sharing = data.get('isSharing')
    user_id = data.get('userId')
    
    # Forward the screen sharing status to all other users in the room
    emit('screen-sharing-status', {
        'isSharing': is_sharing,
        'userId': user_id
    }, to=room_id, skip_sid=request.sid)

@socketio.on('get-room-users')
def get_room_users(data):
    room_id = data.get('roomId')
    if room_id and room_id in rooms:
        # Return list of user IDs in the room
        users = [user['userId'] for user in rooms[room_id]]
        print(f"Users in meeting {room_id}: {users}")
        return users
    return []

@socketio.on('video-toggle')
def handle_video_toggle(data):
    user_id = data.get('userId')
    enabled = data.get('enabled')
    if user_id is None or enabled is None:
        return
    print(f"Broadcasting video-toggle: {user_id}, {enabled}")

    meeting_id = None
    for room_id, room_users in rooms.items():
        for user in room_users:
            
            if user['userId'] == user_id:
                meeting_id = room_id
                user['videoEnabled'] = enabled
                print(f"video state updated  {user} ")
                break
        if meeting_id:
            break
    
    print(f"video toogle data {data}")
    if meeting_id:
        emit('video-toggle', {'userId': user_id, 'enabled': enabled}, 
             to=meeting_id, skip_sid=request.sid)


@socketio.on('audio-toggle')
def handle_audio_toggle(data):
    user_id = data.get('userId')
    enabled = data.get('enabled')
    if user_id is None or enabled is None:
        return
    
    print(f"Broadcasting audio-toggle: {user_id}, {enabled}")
    
    # Find room this user is in
    meeting_id = None
    for room_id, room_users in rooms.items():
        for user in room_users:
            if user['userId'] == user_id:
                meeting_id = room_id
                user['micEnabled'] = enabled
                print("Audio state updated")
                break
        if meeting_id:
            break
    
    if meeting_id:
        emit('audio-toggle', {'userId': user_id, 'enabled': enabled}, 
             to=meeting_id, skip_sid=request.sid)

@socketio.on('end-meeting')
def handle_end_meeting(meeting_id):
    if meeting_id in rooms:
        # Notify all users in the room
        for user in rooms[meeting_id]:
            emit('meeting-ended', {'message': 'The meeting has ended.'}, to=user['userId'])
        
        # Clear the room
        del rooms[meeting_id]
        print(f"Room {meeting_id} has been ended and all users removed.")
        # print_room_state()

@socketio.on('leave-room')
def handle_leave_room(meeting_id):
    if meeting_id in rooms:
        # Find and remove the user
        user_index = -1
        for i, user in enumerate(rooms[meeting_id]):
            if user['userId'] == request.sid:
                user_index = i
                break
        
        if user_index != -1:
            user = rooms[meeting_id][user_index]
            rooms[meeting_id].pop(user_index)
            
            # Check if user created an agent and remove it
            if user.get('isAgentCreator'):
                rooms[meeting_id] = [u for u in rooms[meeting_id] 
                                    if u.get('agentCreatorId') != request.sid]
        
        # Leave the room
        leave_room(meeting_id)
        
        # Delete room if empty
        if not rooms[meeting_id]:
            del rooms[meeting_id]
            print(f"Room {meeting_id} is deleted because all users left.")
        else:
            # Notify other users in the room
            emit('user-disconnected', request.sid, to=meeting_id)
    
    print(f"{request.sid} left room {meeting_id}")
    # print_room_state()



@socketio.on('broadcast_transcripts')
def handle_broadcast_transcripts(data):
    """
    Handle incoming transcripts and broadcast to all participants in the meeting.
    """
    meeting_id = data.get('meetingId')
    transcripts = data.get('transcripts', [])
    
    # if not meeting_id or not transcripts:
    #     print("Invalid data received for broadcasting transcripts")
    #     return
    
    print(f"Broadcasting transcripts for meeting {meeting_id}: {transcripts}")
    
    # Store the transcripts in the history
    transcript_history.append({
        'meetingId': meeting_id,
        'transcripts': transcripts,
        'timestamp': datetime.datetime.now().isoformat()
    })
    
    # Broadcast to all users in the room
    if meeting_id in rooms:
        for user in rooms[meeting_id]:
            emit('transcripts_shared', {
                'meetingId': meeting_id,
                'transcripts': transcripts
            }, to=user['userId'])


meeting_results = {}

# Add this to your socket handlers file

# @socketio.on('transcripts')
# def get_local_transcript(data):
#     meeting_id = str(data.get("meetingId"))
#     transcripts = data.get("transcripts")
#     team_config = data.get("teamConfig", {})  # Get team configuration
    
#     print(f"📥 Received NEW transcript chunks for meeting {meeting_id}")
#     print(f"📝 Transcript content: {transcripts}")
#     print(f"⚙️ Team configuration: {team_config}")
    
#     # Show current storage state
#     with STORAGE_LOCK:
#         for team_key, data in TEAMS_STORAGE.items():
#             transcript_count = len(data['all_transcripts'])
#             mvp_length = len(data['mvp'])
#             vision_length = len(data['vision'])
#             print(f"📊 {team_key}: {transcript_count} transcripts, MVP: {mvp_length} chars, Vision: {vision_length} chars")
    
#     state = {
#         "transcripts": transcripts,
#         "team_config": team_config  # Pass configuration to state
#     }
    
#     print(f"🤖 Processing transcripts with enhanced memory system...")
#     output = graph.invoke(state)
    
#     # Get the accumulated data from storage (which includes new + previous content)
#     final_data = {}
#     with STORAGE_LOCK:
#         final_data = {
#             "team_a_vision": TEAMS_STORAGE["team_a"]["vision"],
#             "team_a_mvp": TEAMS_STORAGE["team_a"]["mvp"],
#             "team_b_vision": TEAMS_STORAGE["team_b"]["vision"], 
#             "team_b_mvp": TEAMS_STORAGE["team_b"]["mvp"],
#             "team_c_vision": TEAMS_STORAGE["team_c"]["vision"],
#             "team_c_mvp": TEAMS_STORAGE["team_c"]["mvp"],
#         }
    
#     print("📤 Sending accumulated team data to frontend:")
#     for key, value in final_data.items():
#         print(f"  {key}: {len(value)} characters")
    
#     emit("agent_updates", final_data)


# # Optional: Add endpoint to reset storage for new meetings
# @socketio.on('reset_meeting')
# def reset_meeting_data(data):
#     meeting_id = str(data.get("meetingId"))
#     print(f"🔄 Resetting data for meeting {meeting_id}")
#     reset_teams_storage()
#     emit("meeting_reset", {"status": "success", "meeting_id": meeting_id})

# # Optional: Add endpoint to get current storage state
# @socketio.on('get_current_state')
# def get_current_state(data):
#     meeting_id = str(data.get("meetingId"))
#     with STORAGE_LOCK:
#         current_state = {
#             "meeting_id": meeting_id,
#             "teams": {}
#         }
#         for team_key, team_data in TEAMS_STORAGE.items():
#             current_state["teams"][team_key] = {
#                 "mvp": team_data["mvp"],
#                 "vision": team_data["vision"],
#                 "transcript_count": len(team_data["all_transcripts"]),
#                 "processing_rounds": len(team_data["processing_history"])
#             }
    
#     emit("current_state", current_state)







# ---------------- Updated Socket Handlers ----------------
@socketio.on('transcripts')
def get_local_transcript(data):
    meeting_id = str(data.get("meetingId"))
    transcripts = data.get("transcripts")
    team_config = data.get("teamConfig", {})
    
    print(f"📥 Received NEW transcript chunks for meeting {meeting_id}")
    print(f"📝 Transcript content: {transcripts}")
    print(f"⚙️ Team configuration: {team_config}")
    
    # Show current storage state for this meeting
    meeting_storage = get_or_create_meeting_storage(meeting_id)
    with STORAGE_LOCK:
        for team_key, data in meeting_storage.items():
            transcript_count = len(data['all_transcripts'])
            mvp_length = len(data['mvp'])
            vision_length = len(data['vision'])
            print(f"📊 {team_key} (Meeting {meeting_id}): {transcript_count} transcripts, MVP: {mvp_length} chars, Vision: {vision_length} chars")
    
    state = {
        "meeting_id": meeting_id,  # Add meeting_id to state
        "transcripts": transcripts,
        "team_config": team_config
    }
    
    print(f"🤖 Processing transcripts with enhanced memory system...")
    output = graph.invoke(state)
    
    # Get the accumulated data from storage for this specific meeting
    final_data = {}
    meeting_storage = get_or_create_meeting_storage(meeting_id)
    with STORAGE_LOCK:
        final_data = {
            "team_a_vision": meeting_storage["team_a"]["vision"],
            "team_a_mvp": meeting_storage["team_a"]["mvp"],
            "team_b_vision": meeting_storage["team_b"]["vision"],
            "team_b_mvp": meeting_storage["team_b"]["mvp"],
            "team_c_vision": meeting_storage["team_c"]["vision"],
            "team_c_mvp": meeting_storage["team_c"]["mvp"],
        }
    
    print("📤 Sending accumulated team data to frontend:")
    for key, value in final_data.items():
        print(f" {key}: {len(value)} characters")
    
    emit("agent_updates", final_data)

@socketio.on('reset_meeting')
def reset_meeting_data(data):
    meeting_id = str(data.get("meetingId"))
    print(f"🔄 Resetting data for meeting {meeting_id}")
    reset_meeting_storage(meeting_id)
    emit("meeting_reset", {"status": "success", "meeting_id": meeting_id})

@socketio.on('get_current_state')
def get_current_state(data):
    meeting_id = str(data.get("meetingId"))
    meeting_storage = get_or_create_meeting_storage(meeting_id)
    
    with STORAGE_LOCK:
        current_state = {
            "meeting_id": meeting_id,
            "teams": {}
        }
        for team_key, team_data in meeting_storage.items():
            current_state["teams"][team_key] = {
                "mvp": team_data["mvp"],
                "vision": team_data["vision"],
                "transcript_count": len(team_data["all_transcripts"]),
                "processing_rounds": len(team_data["processing_history"])
            }
    
    emit("current_state", current_state)


@socketio.on('mvpvision-updates')
def handle_mvpvision_updates(data):
    try:
        print(f"Received MVP Vision updates: {data}")

        meeting_id = data.get('meetingId')
        if meeting_id not in rooms:
            emit('error', {'message': 'Meeting does not exist'}, to=request.sid)
            return

        print(f"Broadcasting MVP Vision updates to meeting {meeting_id}")

        # Broadcast once to all in the room except sender
        emit('mvpvision-updates', data, to=meeting_id, skip_sid=request.sid)

    except Exception as e:
        print(f"Error handling MVP Vision updates: {str(e)}")
        emit('error', {'message': f'Failed to process updates: {str(e)}'}, to=request.sid)


@socketio.on('disconnect')
def handle_disconnect():
    print(f"User disconnected: {request.sid}")
    active_connections.discard(request.sid)
    
    # Check if the disconnected user was screen sharing in any room
    rooms_to_notify = []
    for room_id, sharer_id in list(screen_sharers.items()):
        if sharer_id == request.sid:
            print(f"Screen sharer {request.sid} disconnected from room {room_id}")
            rooms_to_notify.append(room_id)
            # Remove them from screen sharers
            del screen_sharers[room_id]
    
    # Remove user from all rooms they were part of
    for meeting_id in list(rooms.keys()):
        # Find and remove the user and their agent
        initial_count = len(rooms[meeting_id])
        rooms[meeting_id] = [user for user in rooms[meeting_id]
                             if user['userId'] != request.sid
                             and user.get('agentCreatorId') != request.sid]
                
        final_count = len(rooms[meeting_id])
        if initial_count != final_count:
            print(f"Removed user {request.sid} from room {meeting_id}. Users remaining: {final_count}")
            
            # Check if this room had screen sharing from the disconnected user
            if meeting_id in rooms_to_notify:
                # Notify other users that screen sharing has ended
                emit('screen-sharer-disconnected', {
                    'userId': request.sid,
                    'roomId': meeting_id
                }, to=meeting_id)
                
                # Also emit screen sharing status update
                emit('screen-sharing-status', {
                    'roomId': meeting_id,
                    'isSharing': False,
                    'userId': request.sid
                }, to=meeting_id)
                
                print(f"Notified room {meeting_id} that screen sharing ended due to user disconnect")
        
        # Delete room if empty
        if not rooms[meeting_id]:
            del rooms[meeting_id]
            # Also clean up screen sharers for this room if it exists
            if meeting_id in screen_sharers:
                del screen_sharers[meeting_id]
            print(f"Room {meeting_id} is deleted because all users left.")
        else:
            # Notify other users in the room about regular disconnect
            emit('user-disconnected', request.sid, to=meeting_id)
# add code for broadcasting activateAgent state to all users in the room
# Add this new socket handler to your backend

@socketio.on('agent-state-changed')
def handle_agent_state_change(data):
    """
    Handle agent state changes and broadcast to all participants in the meeting
    """
    try:
        meeting_id = data.get('meetingId')
        user_id = data.get('userId', request.sid)
        activate_agent = data.get('activateAgent', False)
        
        print(f"Agent state changed by user {user_id} in meeting {meeting_id}: {activate_agent}")
        
        # Validate meeting exists
        if meeting_id not in rooms:
            emit('error', {'message': 'Meeting does not exist'}, to=user_id)
            return
        
        # Verify user is in the meeting
        user_in_meeting = any(u['userId'] == user_id for u in rooms[meeting_id])
        if not user_in_meeting:
            emit('error', {'message': 'User not in meeting'}, to=user_id)
            return
        
        # Optional: Only allow admin to change agent state
        # Uncomment below if you want only admin control
        # admin_id = room_admins.get(meeting_id)
        # if user_id != admin_id:
        #     emit('error', {'message': 'Only admin can change agent state'}, to=user_id)
        #     return
        
        # Store the agent state for this meeting (optional)
        # You might want to add a meeting_agent_states dictionary
        if 'meeting_agent_states' not in globals():
            global meeting_agent_states
            meeting_agent_states = {}
        
        meeting_agent_states[meeting_id] = activate_agent
        
        # Broadcast to all participants in the meeting
        emit('agent-state-update', {
            # 'meetingId': meeting_id,
            'userId': user_id,
            'activateAgent': activate_agent,
            'timestamp': int(time.time() * 1000)
        }, to=meeting_id, skip_sid=request.sid)
        
        print(f"Agent state broadcasted to meeting {meeting_id}: {activate_agent}")
        
    except Exception as e:
        print(f"Error handling agent state change: {str(e)}")
        emit('error', {'message': f'Failed to update agent state: {str(e)}'}, to=request.sid)

# Optional: Add handler to get current agent state when joining
@socketio.on('get-agent-state')
def handle_get_agent_state(data):
    """
    Get current agent state for a meeting when user joins
    """
    try:
        meeting_id = data.get('meetingId')
        user_id = request.sid
        
        if meeting_id not in rooms:
            emit('error', {'message': 'Meeting does not exist'}, to=user_id)
            return
        
        # Get current agent state for the meeting
        current_state = meeting_agent_states.get(meeting_id, False)
        
        emit('agent-state-update', {
            # 'meetingId': meeting_id,
            'userId': 'system',
            'activateAgent': current_state,
            'timestamp': int(time.time() * 1000)
        }, to=user_id)
        
        print(f"Sent current agent state to user {user_id}: {current_state}")
        
    except Exception as e:
        print(f"Error getting agent state: {str(e)}")
        emit('error', {'message': f'Failed to get agent state: {str(e)}'}, to=request.sid)

app.add_url_rule('/leaveCall', view_func=leave_call, methods=['POST'])
app.add_url_rule('/projects', view_func=fetch_projects, methods=['GET'])
app.add_url_rule('/user_stories', view_func=get_all_user_stories, methods=['GET'])
app.add_url_rule('/project_user_stories/<project_id>', view_func=get_user_stories_by_project, methods=['GET'])

app.add_url_rule('/create-project', view_func=creating_project, methods=['POST'])
app.add_url_rule('/delete-project/<project_id>', view_func=delete_project, methods=['DELETE'])
app.add_url_rule('/update-project/<project_id>', view_func=update_project, methods=['PUT'])

app.add_url_rule('/generate-user-stories', view_func=generate_user_stories, methods=['POST'])


app.add_url_rule('/update_story', view_func=update_story, methods=['PUT'])
app.add_url_rule('/delete-user-story/<story_id>', view_func=delete_user_story, methods=['DELETE'])
app.add_url_rule('/delete-user-story-version/<story_id>', view_func=delete_user_story_version, methods=['DELETE'])


app.add_url_rule('/evaluate_teams', view_func=evaluate_teams_view, methods=['POST'])
app.add_url_rule('/evaluate_teams_with_formulas', view_func=evaluate_teams_view_with_formulas, methods=['POST'])

app.add_url_rule('/score_artifacts', view_func=score_artifacts_view, methods=['POST'])

# app.add_url_rule('/webrtc/config', view_func=webrtc_config_view, methods=['GET'])



websocket_connections = {}




# Configuration
UPLOAD_FOLDER = 'uploads'
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'pdf'}

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# import asyncio
# from mcp_openai_format import MCPAgent






mcp_agent = None



@app.route('/set-admin/<meeting_id>', methods=['POST'])
def set_admin_id(meeting_id):
    try:
        data = request.get_json()
        user_id = data.get('userId')
        a_id = data.get('aid')
        admin_doc = admin_collections.find_one({
            'meeting_id': meeting_id,
            'is_admin': True,
        })
        if user_id:
            # If room_admins already has an entry, update userId, else create new
            if meeting_id in room_admins and admin_doc.get('user_id') == a_id:
                room_admins[meeting_id]={
                    'userId': user_id,
                     'aid' : a_id
                }
            return jsonify({'success': True, 'message': f'Admin userId set for meeting {meeting_id}', 'userId': user_id})
        else:
            return jsonify({'success': False, 'error': 'No user_id provided'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/get-admin/<meeting_id>', methods=['GET'])
def get_admin_by_meeting_id(meeting_id):
    try:
        admin_doc = admin_collections.find_one({
            'meeting_id': meeting_id,
            'is_admin': True,
        })
        print("admin_doc", admin_doc)
        if admin_doc:
        
            return jsonify({
                'success': True,
                'user_id': admin_doc.get('user_id'),
                'agentName': admin_doc.get('agent_Name'),
                'isAgent': admin_doc.get('is_agent'),
                'exp': admin_doc.get('exp'),
            })
        else:
            return jsonify({'success': False, 'error': 'No admin found for this meeting'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.before_request
def startup():
    """Initialize services on startup"""
    # Only run once by checking if already initialized
    if not hasattr(startup, 'initialized'):
        print("🚀 Starting Flask application...")
        startup.initialized = True

# if __name__ == '__main__':
#     port = int(os.getenv('PORT', '5000'))
#     # Using eventlet as the async server
#     socketio.run(app, host='0.0.0.0', port=port, debug=True, allow_unsafe_werkzeug=True)  # For development only
    
if __name__ == '__main__':
    # Start MCP server in a separate thread
    print("🔧 Starting MCP server on port 3030...")
    # threading.Thread(target=run_mcp_server, daemon=True).start()
    
    # Start main Flask application
    port = int(os.getenv('PORT', '5000'))
    print(f"🌐 Starting Flask application on port {port}...")
    socketio.run(app, host='0.0.0.0', port=port, debug=True, allow_unsafe_werkzeug=False)

