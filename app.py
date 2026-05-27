import os
import sqlite3
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import dotenv

dotenv.load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'default-key')

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, 'hancom_food_db.db')

# 초기에 등록되어 있는 구성원 명단 (동적 가입 허용)
ALLOWED_USERS = ["홍길동"]

def get_db_connection():
    try:
        connection = sqlite3.connect(DB_PATH)
        connection.row_factory = sqlite3.Row
        return connection
    except sqlite3.Error as e:
        print(f"❌ SQLite 연결 실패: {e}")
        return None

def init_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS menu_opinions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                user_name TEXT NOT NULL,
                menu_type TEXT NOT NULL,
                menu_name TEXT NOT NULL,
                notes TEXT,
                votes INTEGER DEFAULT 0
            );
        ''')
        conn.commit()
        cursor.close()
        conn.close()
        print("🎉 DB 및 구성원 투표 테이블 준비 완료")
    except sqlite3.Error as e:
        print(f"❌ SQLite 초기화 실패: {e}")

init_db()

# --- [ 로그인 / 라우팅 제어 ] ---

@app.route('/')
def index():
    if 'username' in session:
        return redirect(url_for('menu_choice'))
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username', '').strip()
    
    if username in ALLOWED_USERS:
        session['username'] = username
        return redirect(url_for('menu_choice'))
    else:
        return '''
            <script>
                alert("❌ 등록되지 않은 구성원 이름입니다. 멤버 등록을 먼저 진행해 주세요.");
                window.location.href = "/";
            </script>
        '''
    
@app.route('/register', methods=['POST'])
def register():
    username = request.form.get('username', '').strip()
    if not username:
        return '<script>alert("이름을 정확히 입력해주세요."); window.location.href = "/";</script>'
    
    if username in ALLOWED_USERS:
        return f'''
            <script>
                alert("💡 '{username}'님은 이미 등록되어 있는 구성원입니다. SIGN IN 버튼을 눌러 로그인해 주세요.");
                window.location.href = "/";
            </script>
        '''
    else:
        ALLOWED_USERS.append(username)
        return f'''
            <script>
                alert("🎉 '{username}'님이 구성원으로 등록되었습니다! 로그인 후 이용해 주세요.");
                window.location.href = "/";
            </script>
        '''

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/menu-choice')
def menu_choice():
    if 'username' not in session:
        return redirect(url_for('index'))
    return render_template('menu.html', username=session['username'])

# --- [ 데이터 활용 API ] ---

@app.route('/api/menus', methods=['GET'])
def get_menus():
    if 'username' not in session: return jsonify({"error": "Unauthorized"}), 401
    date = request.args.get('date')
    time = request.args.get('time')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM menu_opinions WHERE date = ? AND time = ?", (date, time))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    
    menus = [{"id": r["id"], "user": r["user_name"], "type": r["menu_type"], "menu": r["menu_name"], "notes": r["notes"], "votes": r["votes"]} for r in rows]
    return jsonify(menus)

@app.route('/api/menus', methods=['POST'])
def add_menu():
    if 'username' not in session: return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    user_name = session.get('username', '구성원')
    menu_type = data.get('type', '🛵 배달 음식')
    menu_name = data.get('menu', '')
    
    cursor.execute("INSERT INTO menu_opinions (date, time, user_name, menu_type, menu_name, notes) VALUES (?, ?, ?, ?, ?, ?)",
                   (data['date'], data['time'], user_name, menu_type, menu_name, data.get('notes', '')))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/menus/<int:menu_id>', methods=['PUT'])
def update_menu(menu_id):
    if 'username' not in session: return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE menu_opinions SET menu_name = ?, notes = ? WHERE id = ?", (data.get('menu', ''), data.get('notes', ''), menu_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/menus/<int:menu_id>', methods=['DELETE'])
def delete_menu(menu_id):
    if 'username' not in session: return jsonify({"error": "Unauthorized"}), 401
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM menu_opinions WHERE id = ?", (menu_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/vote', methods=['POST'])
def vote_menu():
    if 'username' not in session: return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE menu_opinions SET votes = votes + 1 WHERE id = ?", (data['id'],))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)