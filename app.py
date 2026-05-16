import os
import datetime
import jwt
import random
import mimetypes
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from passlib.hash import pbkdf2_sha256
from dotenv import load_dotenv

# Add MIME type for JSX
mimetypes.add_type('application/javascript', '.jsx')

load_dotenv()

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'aegis-quantum-shield-2026-secret')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///aegis_vault.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Database Models ---

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    company = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # User Settings
    vpn_active = db.Column(db.Boolean, default=False)
    security_level = db.Column(db.String(20), default='LOW')
    
    # Relationships
    threats = db.relationship('MitigatedThreat', backref='user', lazy=True)

class MitigatedThreat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    threat_type = db.Column(db.String(50))
    origin_ip = db.Column(db.String(50))
    action_taken = db.Column(db.String(200))
    location = db.Column(db.String(100))
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class Deployment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    status = db.Column(db.String(50), default='PENDING')
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

# Create Database
with app.app_context():
    db.create_all()

# --- Auth Decorator ---

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            # Handle Bearer token
            if token.startswith('Bearer '):
                token = token.split(' ')[1]
            
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

# --- Routes ---

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# -- Authentication API --

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    company = data.get('company')
    
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'User already exists'}), 400
        
    hashed_password = pbkdf2_sha256.hash(password)
    new_user = User(email=email, password=hashed_password, company=company)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'User registered successfully'})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not pbkdf2_sha256.verify(password, user.password):
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config['SECRET_KEY'])
    
    return jsonify({
        'success': True,
        'token': token,
        'user': {
            'email': user.email,
            'company': user.company,
            'vpn_active': user.vpn_active,
            'security_level': user.security_level
        }
    })

# -- User Settings API --

@app.route('/api/user/settings', methods=['GET'])
@token_required
def get_settings(current_user):
    return jsonify({
        'vpn_active': current_user.vpn_active,
        'security_level': current_user.security_level
    })

@app.route('/api/user/settings', methods=['POST'])
@token_required
def update_settings(current_user):
    data = request.json
    if 'vpn_active' in data:
        current_user.vpn_active = data['vpn_active']
    if 'security_level' in data:
        current_user.security_level = data['security_level']
        
    db.session.commit()
    return jsonify({'success': True})

# -- Dashboard & Threat Data API --

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        "status": "operational",
        "message": "All defense matrices are active and fully operational.",
        "threatLevel": "Low",
        "uptime": "99.9994%",
        "activeNodes": 1024,
        "blockedToday": 1492031,
        "lastBreach": "None detected",
        "neuralSync": "98.7%",
        "quantumEntropy": "0.00042"
    })

@app.route('/api/nodes', methods=['GET'])
def get_nodes():
    nodes = []
    for i in range(48):
        nodes.append({
            "id": i,
            "load": random.randint(10, 95),
            "status": "ACTIVE" if random.random() > 0.05 else "WARNING",
            "sector": random.choice(["ALPHA", "BETA", "GAMMA", "DELTA"])
        })
    return jsonify(nodes)

@app.route('/api/threats/history', methods=['GET'])
@token_required
def get_threat_history(current_user):
    threats = MitigatedThreat.query.filter_by(user_id=current_user.id).order_by(MitigatedThreat.timestamp.desc()).limit(20).all()
    return jsonify([{
        'id': t.id,
        'type': t.threat_type,
        'origin': t.origin_ip,
        'action': t.action_taken,
        'location': t.location,
        'timestamp': t.timestamp.isoformat()
    } for t in threats])

@app.route('/api/mitigate', methods=['POST'])
@token_required
def mitigate_threat(current_user):
    data = request.json
    threat_data = data.get('threat')
    
    new_threat = MitigatedThreat(
        user_id=current_user.id,
        threat_type=threat_data.get('type'),
        origin_ip=threat_data.get('origin'),
        action_taken=threat_data.get('action'),
        location=threat_data.get('location')
    )
    db.session.add(new_threat)
    db.session.commit()
    
    return jsonify({
        "success": True,
        "message": f"Threat neutralized and logged in Aegis Vault.",
        "mitigationId": f"AEGIS-MIT-{new_threat.id}"
    })

@app.route('/api/deploy', methods=['POST'])
def deploy_system():
    data = request.json
    company_name = data.get('companyName')
    email = data.get('email')
    
    if not company_name or not email:
        return jsonify({"success": False, "error": "Missing required fields"}), 400
        
    new_deployment = Deployment(company_name=company_name, email=email)
    db.session.add(new_deployment)
    db.session.commit()
    
    return jsonify({
        "success": True,
        "message": f"Deployment initiated for {company_name}. Encryption keys generated.",
        "deploymentId": f"AEGIS-SYS-{new_deployment.id}"
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
