from functools import wraps
from flask import request, jsonify
from firebase_admin import auth

def firebase_guard(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):

        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorisation token missing or malformed"}), 400
        
        token = auth_header.split(' ')[1]
        
        try:
            decoded_token = auth.verify_id_token(token)
            if 'email' not in decoded_token:
                return jsonify({"error": "The token does not contain a valid email address."}), 400
                
            return f(decoded_token, *args, **kwargs)
            
        except Exception as e:
            return jsonify({"error": "Invalid authorisation token", "details": str(e)}), 401
            
    return decorated_function