from flask import *
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import *
from flask_migrate import *
from werkzeug.utils import secure_filename
# from sqlalchemy.orm import contains_eager
from sqlalchemy.sql.expression import func, select
from datetime import *
from werkzeug.security import check_password_hash, generate_password_hash
from moviepy.editor import VideoFileClip
from flask_socketio import SocketIO, leave_room, join_room, send, emit

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:123@localhost/v-chat'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
app.config['UPLOAD_FOLDER'] = 'static/img/'
app.config['SECRET_KEY'] = "_mmr_2007"
db = SQLAlchemy(app)
migrate = Migrate(app, db)
socketio: SocketIO = SocketIO(app, engineio_logger=True, async_handlers=True)


class User(db.Model):
    __tablename__ = "user"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    username = Column(String)
    gmail = Column(String)
    password = Column(String)
    img = Column(String)
    messages = db.relationship("UsersMessages", backref="user", order_by=desc("UsersMessages.id"))
    status = Column(DateTime)
    file = db.relationship("File", backref="user", order_by="File.id")
    comment = db.relationship("Comment", backref="user", order_by="Comment.id")
    like = db.relationship("Like", backref="user", order_by="Like.id")

    def add(self):
        db.session.add(self)
        db.session.commit()

    def json(self):
        info = {
            'username': self.username,
            'name': self.name,
            'img': f'http://192.168.100.13:5002/{self.img}'
        }
        return info


class UsersChat(db.Model):
    __tablename__ = "users_chat"
    id = Column(Integer, primary_key=True)
    first_person = Column(Integer, ForeignKey('user.id'))
    second_person = Column(Integer, ForeignKey('user.id'))
    first = db.relationship("User", foreign_keys=[first_person])
    second = db.relationship("User", foreign_keys=[second_person])
    messages = db.relationship('UsersMessages', backref="user_chat", order_by="UsersMessages.id")


class UsersMessages(db.Model):
    __tablename__ = "users_messages"
    id = Column(Integer, primary_key=True)
    chat_id = Column(Integer, ForeignKey('users_chat.id'))
    text = Column(String)
    date = Column(DateTime)
    user_id = Column(Integer, ForeignKey('user.id'))

    def add(self):
        db.session.add(self)
        db.session.commit()

    def json(self):
        info = {
            'user_id': self.user_id,
            'text': self.text
        }
        return info


class File(db.Model):
    __tablename__ = "file"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    date = Column(DateTime)
    user_id = Column(Integer, ForeignKey('user.id'))
    url = Column(String)
    video = Column(Boolean)
    photo = Column(Boolean)
    like = db.relationship("Like", backref="file", order_by="Like.id")
    comment = db.relationship("Comment", backref="file", order_by="Comment.id")

    def add_commit(self):
        db.session.add(self)
        db.session.commit()


class Like(db.Model):
    __tablename__ = "like"
    id = Column(Integer, primary_key=True)
    file_id = Column(Integer, ForeignKey('file.id'))
    user_id = Column(Integer, ForeignKey('user.id'))

    def add_commit(self):
        db.session.add(self)
        db.session.commit()


class Comment(db.Model):
    __tablename__ = "comment"
    id = Column(Integer, primary_key=True)
    comment_text = Column(String)
    file_id = Column(Integer, ForeignKey('file.id'))
    user_id = Column(Integer, ForeignKey('user.id'))

    def add_commit(self):
        db.session.add(self)
        db.session.commit()


def get_current_user():
    user = None
    if "username" in session:
        user = User.query.filter(
            or_(User.username == session['username'], User.gmail == session['username'])).first()
    return user


def video_folder():
    return "static/video"


def photo_folder():
    return "static/photo"


def user_photo_folder():
    return "static/user_img"


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/v-chat', methods=['POST', 'GET'])
def home():
    user = get_current_user()
    video_all = File.query.filter(File.user_id == user.id, File.video == True).all()
    photo_all = File.query.filter(File.user_id == user.id, File.photo == True).all()
    user_all = User.query.filter(User.id != user.id).order_by(func.random()).all()

    return render_template('chat.html', user=user, video_all=video_all, photo_all=photo_all, user_all=user_all)


@socketio.on('message')
def message(data):
    user = get_current_user()
    print(data)
    if data['data']['type'] == 'check':
        chat_id = session.get('chat_id')
        get_chat = UsersChat.query.filter(UsersChat.id == chat_id).first()
        info = []
        print(True)
        for massage in get_chat.messages:
            info.append(massage.json())
    else:
        chat_id = data['data']['chat_id']
        get_chat = UsersChat.query.filter(UsersChat.id == chat_id).first()
        message_get = UsersMessages(user_id=user.id, text=data['data']['msg'], chat_id=get_chat.id, date=datetime.now())
        message_get.add()
        messages = []
        for message in get_chat.messages:
            messages.append(message.json())
        info = {
            "messages": messages,
            "user": {
                "user_id": user.id,
                "username": user.username
            }
        }
    emit('massage', {"info": info}, broadcast=True)


@app.route('/add_chat', methods=['POST'])
def add_chat():
    user = get_current_user()
    username = request.get_json()['username']
    get_user = User.query.filter(User.username == username).first()
    if get_user:
        user_chat1 = UsersChat.query.filter(UsersChat.first_person == user.id,
                                            UsersChat.second_person == get_user.id).first()
        user_chat2 = UsersChat.query.filter(UsersChat.second_person == user.id,
                                            UsersChat.first_person == get_user.id).first()
        if not user_chat1 and not user_chat2:
            user_chat = UsersChat(first_person=user.id, second_person=get_user.id)
            user_chat.add()
        else:
            if user_chat1:
                user_chat = user_chat1
            else:
                user_chat = user_chat2
        massages = []
        for massage in user_chat.messages:
            massages.append(massage.json())
        session['chat_id'] = user_chat.id
        return jsonify({
            'chat_id': user_chat.id,
            'massages': massages,
            'user_id': user.id,
            'user': get_user.json()
        })


@app.route('/get_comment/<int:file_id>')
def get_comment(file_id):
    comment_list = []
    comments = Comment.query.filter(Comment.file_id == file_id).all()
    for comment in comments:
        info = {
            "id": comment.id,
            "comment_text": comment.comment_text,
            "username": comment.user.username,
            "user_img": comment.user.img
        }
        comment_list.append(info)
    return jsonify({
        "comment_list": comment_list
    })


@app.route('/comment', methods=['POST'])
def comment():
    user = get_current_user()
    comment_text = request.get_json().get('comment_text')
    file_id = request.get_json().get('file_id')
    add = Comment(comment_text=comment_text, user_id=user.id, file_id=file_id)
    add.add_commit()
    comment_all = Comment.query.filter(Comment.file_id == file_id).order_by(Comment.id).all()
    user_one = User.query.filter(User.id == user.id).first()
    comment_list = []
    for comment in comment_all:
        info = {
            "id": comment.id,
            "comment_text": comment.comment_text,
            "username": comment.user.username,
            "user_img": comment.user.img
        }
        comment_list.append(info)
    return jsonify({
        "comment_list": comment_list
    })


@app.route('/likes/<int:file_id>')
def likes(file_id):
    user = get_current_user()
    file_one = Like.query.filter(Like.file_id == file_id, Like.user_id == user.id).first()
    info = []
    exist = False
    if not file_one:
        add = Like(file_id=file_id, user_id=user.id)
        add.add_commit()
        exist = True
    else:
        db.session.delete(file_one)
        db.session.commit()

    return jsonify({
        "exist": exist
    })


@app.route('/get_user/<int:file_id>')
def get_user(file_id):
    files = File.query.filter(File.id == file_id).all()
    user_list = []
    for user in files:
        user = {
            "username": user.user.username,
            "user_img": user.user.img,
            "user_text": user.name
        }
        user_list.append(user)
    return jsonify({
        "user_list": user_list
    })


@app.route('/get_likes')
def get_likes():
    info = []
    user = get_current_user()
    likes = Like.query.filter(Like.user_id == user.id).all()
    for like in likes:
        like_info = {
            "file_id": like.file_id
        }
        info.append(like_info)
    return jsonify({
        "likes": info
    })


@app.route('/register', methods=['POST', 'GET'])
def register():
    user = get_current_user()
    if request.method == "POST":
        name = request.form.get('name')
        username = request.form.get('user_name')
        gmail = request.form.get('gmail')
        password = request.form.get('password')
        hashed_password = generate_password_hash(password, method="sha256")
        img = request.files.get('img')
        if img:
            img_name = secure_filename(img.filename)
            app.config["UPLOAD_FOLDER"] = user_photo_folder()
            img.save(os.path.join(app.config["UPLOAD_FOLDER"], img_name))
            url = "static/user_img/" + img_name
            add = User(name=name, username=username, gmail=gmail, password=hashed_password, img=url)
            add.add_commit()
        return redirect(url_for('login'))
    return render_template('register.html', user=user)


@app.route('/login', methods=['POST', 'GET'])
def login():
    user = get_current_user()
    if request.method == "POST":
        username = request.form.get('user_name')
        password = request.form.get('password')
        get_user = User.query.filter(or_(User.username == username, User.gmail == username)).first()
        if get_user:
            checked = check_password_hash(get_user.password, password)
            session['username'] = username
            if checked:
                return redirect(url_for('home'))
            else:
                return redirect(url_for('login'))
    return render_template('register.html', user=user)


@app.route('/register_video', methods=['POST'])
def register_video():
    user = get_current_user()
    name = request.form.get('name')
    video_file = request.files.get('video')
    if video_file:
        video_name = secure_filename(video_file.filename)
        app.config["UPLOAD_FOLDER"] = video_folder()
        video_path = os.path.join(app.config["UPLOAD_FOLDER"], video_name)
        video_file.save(video_path)
        clip = VideoFileClip(video_path)
        new_width = 640
        new_height = 480
        resized_clip = clip.resize((new_width, new_height))
        resized_video_path = os.path.join(app.config["UPLOAD_FOLDER"], 'resized_' + video_name)
        resized_clip.write_videofile(resized_video_path, codec='libx264')
        url = 'static/video/' + 'resized_' + video_name
        add = File(name=name, url=url, date=datetime.now().today(), user_id=user.id, video=True, photo=False)
        add.add_commit()
    video_all = File.query.filter(File.user_id == user.id, File.video == True).order_by(File.id).all()
    video_list = []
    for video in video_all:
        info = {
            "id": video.id,
            "name": video.name,
            "url": video.url
        }
        video_list.append(info)
    return jsonify({
        "video_list": video_list
    })


@app.route('/register_photo', methods=['POST'])
def register_photo():
    user = get_current_user()
    name = request.form.get('photo_name')
    photo_file = request.files.get('photo_url')
    if photo_file:
        photo_name = secure_filename(photo_file.filename)
        app.config["UPLOAD_FOLDER"] = photo_folder()
        photo_file.save(os.path.join(app.config["UPLOAD_FOLDER"], photo_name))
        url = "static/user_img/" + photo_name
        add = File(name=name, url=url, date=datetime.now().today(), user_id=user.id, video=False, photo=True)
        add.add_commit()
    photo_all = File.query.filter(File.user_id == user.id, File.photo == True).order_by(File.id).all()
    photo_list = []
    for photo in photo_all:
        info = {
            "id": photo.id,
            "name": photo.name,
            "url": photo.url
        }
        photo_list.append(info)
    return jsonify({
        "photo_list": photo_list
    })


@app.route('/random_file', methods=['POST'])
def random_file():
    file_all = File.query.order_by(func.random()).all()
    file_list_all = []
    for file in file_all:
        info = {
            "id": file.id,
            "name": file.name,
            "url": file.url,
            "video": file.video,
            "photo": file.photo,
            "username": file.user.username,
            "user_img": file.user.img
        }
        file_list_all.append(info)
    return jsonify({
        "file_list_all": file_list_all
    })


if __name__ == '__main__':
    socketio.run(app, debug=True)
