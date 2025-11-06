# socketio_instance.py
from flask_socketio import SocketIO

socketio = SocketIO(async_mode='threading', cors_allowed_origins='*')
