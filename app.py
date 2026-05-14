import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        "status": "operational",
        "message": "All defense matrices are active and fully operational.",
        "threatLevel": "Low",
        "uptime": "99.99%"
    })

@app.route('/api/deploy', methods=['POST'])
def deploy_system():
    data = request.json
    company_name = data.get('companyName')
    email = data.get('email')
    
    if not company_name or not email:
        return jsonify({"success": False, "error": "Missing required fields"}), 400
        
    # Simulate deployment logic
    return jsonify({
        "success": True,
        "message": f"Deployment initiated for {company_name}. A representative will contact {email} shortly.",
        "deploymentId": "AEGIS-SYS-" + str(hash(email))[-4:]
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
