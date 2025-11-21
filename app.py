from flask import Flask, jsonify, request, send_from_directory, render_template
from flask_sqlalchemy import SQLAlchemy
import requests
import os
import logging

# Configure basic logging to console
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, 'users.db')

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + DB_PATH
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), nullable=False)

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'email': self.email}


@app.before_request
def init_db():
    db.create_all()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/users', methods=['GET'])
def list_users():
    users = User.query.order_by(User.id).all()
    return jsonify([u.to_dict() for u in users])


@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    if not name or not email:
        return jsonify({'error': 'name and email required'}), 400

    user = User(name=name, email=email)
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())


@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}
    user.name = data.get('name', user.name)
    user.email = data.get('email', user.email)
    db.session.commit()
    return jsonify(user.to_dict())


@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'result': True})


@app.route('/api/generate', methods=['POST'])
def generate_user():
    # Server-side fetch from Random User to avoid CORS
    payload = request.get_json() or {}
    results = payload.get('results', 1)
    params = {'results': results, 'nat': 'us'}
    logger.info('Calling Random User API: %s with params=%s', 'https://randomuser.me/api/', params)

    try:
        r = requests.get('https://randomuser.me/api/', params=params, timeout=10)
        logger.info('Random User response status: %s', r.status_code)
        r.raise_for_status()
    except Exception as e:
        logger.exception('Failed to fetch random user')
        return jsonify({'error': 'failed to fetch random user', 'details': str(e)}), 502

    # Log a short snippet of the response body for debugging (not full JSON to avoid clutter)
    body_snippet = r.text[:1000]
    logger.info('Random User response snippet: %s', body_snippet)

    data = r.json()
    created = []
    for item in data.get('results', []):
        name_parts = item.get('name', {})
        full_name = ' '.join([p for p in [name_parts.get('first'), name_parts.get('last')] if p])
        email = item.get('email') or ''

        user = User(name=full_name, email=email)
        db.session.add(user)
        created.append(user)

    db.session.commit()

    # Log created users
    logger.info('Created %d user(s): %s', len(created), [u.to_dict() for u in created])

    return jsonify([u.to_dict() for u in created]), 201


if __name__ == '__main__':
    app.run(debug=True)
