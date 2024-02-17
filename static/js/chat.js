let header_button = document.querySelectorAll('.header_button'), massage_icon = document.querySelector('.massage_icon'),
    favorite_icon = document.querySelector('.favorite_icon'),
    massage__section = document.querySelector('.massage__section'),
    video_line = document.querySelector('.video_footer_line'), profile_icon = document.querySelector('.profile_icon'),
    video_icon = document.querySelector('.video_icon'), v_chat_icon = document.querySelector('.v-chat_icon'),
    v_chat__section = document.querySelector('.v-chat__section'),
    header_sections = document.querySelectorAll('.header_sections'), video = document.querySelector('video'),
    video_src = document.querySelector('video source'), photo_src = document.querySelector('#photo-active img'),
    icon_active = document.querySelectorAll('.icon_active i'),
    active_section = document.querySelectorAll('.active_section'),
    section_all = document.querySelectorAll('.section_all'),
    button_video_add = document.querySelector('.button_video_add'),
    button_photo_add = document.querySelector('.button_photo_add'), up_button = document.querySelectorAll('.up_button'),
    down_button = document.querySelectorAll('.down_button'), file_section = document.querySelector('.file_section'),
    creat__video_button = document.querySelector('.creat__video'),
    creat__photo_button = document.querySelector('.creat__photo'), massage_user = document.querySelectorAll('.user'),
    massage_section = document.querySelector('.massage_section'),
    user_name = document.querySelector('.comment_header_user'),
    user_text = document.querySelector('.comment_header_all_text p'),
    user_img = document.querySelector('.comment_header_img img'),
    comment_input = document.querySelectorAll('.inputGroup input'),
    comment_button = document.querySelectorAll('.inputGroup i'),
    video_list_div = document.querySelector('.video_list_section'),
    photo_list_div = document.querySelector('.photo_list_section'), button_x = document.querySelectorAll('.button_x'),
    input_photo_add = document.querySelector('.input_photo_add'),
    input_video_add = document.querySelector('.input_video_add'), videoButton = document.getElementById("video-button"),
    photoButton = document.getElementById("photo-button"), like_icon = document.querySelectorAll('.like_icon'),
    photo_input = document.getElementById('photo-input'), video_input = document.getElementById('video-input'),
    massage_user_img = document.getElementById('user-img'),
    massage_user_username = document.getElementById('user-username'),
    massage_user_name = document.getElementById('user-name'),
    value_icon = document.querySelector('.video_header_icon i'), video_status = false,
    comment_section = document.querySelector('.comment_section'), comment = document.querySelector('.comment'),
    output = document.querySelector('#output'), videoContainer = document.getElementById("video-div"),
    photoContainer = document.querySelector('.photo__active__box__img'),
    photo_active = document.getElementById('photo-active'), video_active = document.getElementById('video-active'),
    video__section = document.querySelector('.video__section'), range = document.querySelector('#range'),
    file_list_random = [], index_file = 0, chat_id = 1;

let massage_div = document.querySelector('#massage'), text_msg = document.querySelector('.textInput'),
    plane = document.querySelector('.button__send');

let socketio = io();

socketio.on("massage", (data) => {
    // if (data['type'] === 'create_msg') {
    console.log(data['info']['messages'])
    update_massage(data['info']['messages'], data['info']['user']['user_id'])
    // }

})


function checkVisible() {
    socketio.emit("message", {
        data: {
            type: "check"
        }
    })
}


const sendMessage = () => {
    if (text_msg.value === "") return;
    socketio.emit("message", {
        data: {
            msg: text_msg.value, chat_id: text_msg.dataset.chat
        }
    })
    text_msg.value = ''
}

plane.addEventListener('click', () => {
    sendMessage()
})
window.addEventListener('keydown', (event) => {
    if (event.key === "Enter") {
        sendMessage()
    }
})
massage_user.forEach((item, index) => {
    creat__button(item, massage_section)
})

function update_massage(list, user_id) {
    massage_div.innerHTML = ''
    list.forEach(item => {
        if (item['user_id'] === user_id) {
            massage_div.innerHTML += `<div class="massage one">${item['text']}</div>`
        } else {
            massage_div.innerHTML += `<div class="massage two">${item['text']}</div>`
        }
    })
}

function creat__button(button, section) {
    button.addEventListener('click', () => {
        section_all.forEach(item => {
            item.style.display = 'none'
        })
        section.style.display = 'flex'
        fetch('/add_chat', {
            method: "POST", body: JSON.stringify({
                username: button.dataset.username
            }), headers: {
                'Content-type': "application/json"
            }
        })
            .then(function (response) {
                return response.json()
            })
            .then(function (info) {
                video.pause();
                text_msg.dataset.chat = info['chat_id']
                update_massage(info['massages'], info['user_id'])
                massage_user_name.innerHTML = info['user']['name']
                massage_user_username.innerHTML = info['user']['username']
                massage_user_img.src = info['user']['img']

            })
    })
}

fetch('/random_file', {
    method: "POST", headers: {
        'Content-type': "application/json"
    }
})
    .then(function (response) {
        return response.json()
    })
    .then(function (info) {
        for (let file of info['file_list_all']) {
            file_list_random.push(file)
        }
        random_file()
        get_likes()
        get_comment()
        get_user()
    })

function random_file() {
    if (file_list_random[index_file].video === true) {
        active_div(video_active, photo_active)
        video_src.src = file_list_random[index_file].url
        video.load();
        // video.play();
    } else if (file_list_random[index_file].video === false) {
        // video.pause();
        active_div(photo_active, video_active)
        photo_src.src = file_list_random[index_file].url
    } else {
    }
}

down_button.forEach(item => {
    item.addEventListener('click', () => {
        next_video()
    })
})

up_button.forEach(item => {
    item.addEventListener('click', () => {
        previous_video()
    })
})

comment_button.forEach((item, index) => {
    item.addEventListener('click', () => {
        if (comment_input[index].value) {
            fetch('/comment', {
                method: "POST", body: JSON.stringify({
                    file_id: file_list_random[index_file].id, comment_text: comment_input[index].value
                }), headers: {
                    'Content-type': "application/json"
                }
            })
                .then(function (response) {
                    return response.json()
                })
                .then(function (info) {
                    comment_section.innerHTML = ''
                    for (let comment of info['comment_list']) {
                        comment_section.innerHTML += `<div class="comment">
                                                    <div class="comment_header">
                                                        <div class="comment_header_img">
                                                            <img src="../${comment['user_img']}" alt="">
                                                        </div>
                                                        <div class="comment_header_username"><h2>${comment['username']}</h2></div>
                                                        <div class="comment_header_score">
                                                            <div class="rating">
                                                                <input value="5" name="rating" type="radio">
                                                                <label for="star5"></label>
                                                                <input value="4" name="rating" type="radio">
                                                                <label for="star4"></label>
                                                                <input value="3" name="rating" type="radio">
                                                                <label for="star3"></label>
                                                                <input value="2" name="rating" type="radio">
                                                                <label for="star2"></label>
                                                                <input value="1" name="rating" type="radio">
                                                                <label for="star1"></label>
                                                            </div>
                                                            <div class="comment_header_score_number">
                                                                <p>5.0</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="comment_section">
                                                        <div class="comment_section_text">
                                                            <p>${comment['comment_text']}</p>
                                                        </div>
                                                    </div>
                                                </div>`
                    }
                })
            comment_input[index].value = ''
        }
    })
})

like_icon.forEach((item, index) => {
    item.addEventListener('click', () => {
        fetch('/likes/' + file_list_random[index_file].id, {
            method: "GET", headers: {
                'Content-type': "application/json"
            }
        })

            .then(function (response) {
                return response.json()
            })
            .then(function (info) {
                if (info['exist']) {
                    item.className = "fa-solid fa-heart btn_heart like_icon"
                } else {
                    item.className = "fa-regular fa-heart btn_heart like_icon"
                }
            })
    })
})


function get_comment() {
    fetch('/get_comment/' + file_list_random[index_file].id, {
        method: "GET", headers: {
            'Content-type': "application/json"
        }
    })

        .then(function (response) {
            return response.json()
        })
        .then(function (info) {
            comment_section.innerHTML = ''
            for (let comment of info['comment_list']) {
                comment_section.innerHTML += `<div class="comment">
                                                    <div class="comment_header">
                                                        <div class="comment_header_img">
                                                            <img src="../${comment['user_img']}" alt="">
                                                        </div>
                                                        <div class="comment_header_username"><h2>${comment['username']}</h2></div>
                                                        <div class="comment_header_score">
                                                            <div class="rating">
                                                                <input value="5" name="rating" type="radio">
                                                                <label for="star5"></label>
                                                                <input value="4" name="rating" type="radio">
                                                                <label for="star4"></label>
                                                                <input value="3" name="rating" type="radio">
                                                                <label for="star3"></label>
                                                                <input value="2" name="rating" type="radio">
                                                                <label for="star2"></label>
                                                                <input value="1" name="rating" type="radio">
                                                                <label for="star1"></label>
                                                            </div>
                                                            <div class="comment_header_score_number">
                                                                <p>5.0</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="comment_section">
                                                        <div class="comment_section_text">
                                                            <p>${comment['comment_text']}</p>
                                                        </div>
                                                    </div>
                                                </div>`
            }
        })
}

function get_user() {
    fetch('/get_user/' + file_list_random[index_file].id, {
        method: "GET", headers: {
            'Content-type': "application/json"
        }

    })
        .then(function (response) {
            return response.json()
        })
        .then(function (info) {
            for (let user of info['user_list']) {
                user_name.innerHTML = `<h1>${user["username"]}</h1>`
                user_text.innerHTML = `<p>${user["user_text"]}</p>`
                user_img.src = `${user["user_img"]}`
            }
        })
}

function get_likes() {
    fetch('/get_likes', {
        method: "GET", headers: {
            'Content-type': "application/json"
        }

    })
        .then(function (response) {
            return response.json()
        })
        .then(function (info) {
            let likes_list = []
            for (let item of info['likes']) {
                likes_list.push(item['file_id'])

            }
            if (likes_list.includes(eval(file_list_random[index_file].id))) {
                like_icon.forEach((item, index) => {
                    item.className = "fa-solid fa-heart btn_heart like_icon"
                })

            } else {
                like_icon.forEach((item, index) => {
                    item.className = "fa-regular fa-heart btn_heart like_icon"
                })

            }
        })
}

function active_div(first_div, second_div) {
    first_div.style.display = 'flex'
    second_div.style.display = 'none'
}

function next_video() {
    index_file++
    if (index_file > file_list_random.length - 1) {
        index_file = 0
    }
    random_file()
    get_likes()
    get_comment()
    get_user()
}

function previous_video() {
    index_file--
    if (index_file < 0) {
        index_file = file_list_random.length - 1
    }
    random_file()
    get_likes()
    get_comment()
    get_user()
}


creat__button(creat__video_button, video_list_div)
creat__button(v_chat_icon, file_section)


creat__photo_button.addEventListener('click', () => {
    section_all.forEach(item => {
        item.style.display = 'none'
    })
    photo_list_div.style.display = 'flex'
    video.pause();
})

videoButton.addEventListener('click', function () {
    video_input.click()
})

photoButton.addEventListener('click', function () {
    photo_input.click()
    photo_input.addEventListener('change', function () {
        let input = document.getElementById('photo-input');

        if (input.files && input.files[0]) {
            let reader = new FileReader();

            reader.onload = function (e) {
                let img = document.createElement('img');
                img.src = e.target.result;
                photoContainer.innerHTML = '';
                photoContainer.appendChild(img);
            }

            reader.readAsDataURL(input.files[0]);
        }
    })
})

button_photo_add.addEventListener('click', () => {
    const file = photo_input.files[0];

    const formData = new FormData();
    formData.append("photo_url", file);
    formData.append('photo_name', input_photo_add.value)


    if (input_photo_add.value) {
        fetch('/register_photo', {
            method: "POST", body: formData
        })

            .then(function (response) {
                return response.json()
            })
            .then(function (info) {
                photo_list_div.innerHTML = ''
                for (let photo of info['photo_list']) {
                    photo_list_div.innerHTML += `<div class="photo">
                                                    <img src="${photo["url"]}" alt="Img 404">
                                                </div>`
                }
                input_photo_add.value = ""
                photoContainer.innerHTML = ` <img src="../static/register/img/photo_2023-07-17_19-20-08.jpg" alt="">`
            })
    }
})

window.onload = function () {
    const videoContainer = document.getElementById("video-div");
    const videoInput = document.getElementById("video-input");

    videoInput.addEventListener("change", function (event) {
        const file = event.target.files[0];
        const videoUrl = URL.createObjectURL(file);

        const iframe = document.createElement("iframe");
        iframe.setAttribute("width", "158");
        iframe.setAttribute("height", "144");
        iframe.setAttribute("src", videoUrl);
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("allowfullscreen", "");

        const existingIframe = videoContainer.querySelector("iframe");
        if (existingIframe) {
            videoContainer.removeChild(existingIframe);
        }

        videoContainer.appendChild(iframe);
    });
};

button_video_add.addEventListener('click', () => {
    const file = video_input.files[0];

    const formData = new FormData();
    formData.append("video", file);
    formData.append('name', input_video_add.value)

    if (input_video_add.value) {
        fetch('/register_video', {
            method: "POST", body: formData
        })

            .then(function (response) {
                return response.json()
            })
            .then(function (info) {
                video_list_div.innerHTML = ''
                for (let video of info['video_list']) {
                    video_list_div.innerHTML += `<div class="video">
                                                    <video controls width="250">
                                                        <source src="${video["url"]}" type="video/mp4">
                                                    </video>
                                                </div>`
                }
                input_video_add.value = ""
                videoContainer.innerHTML = ""
            })
    }
})

icon_active.forEach((item, index) => {
    item.addEventListener('click', () => {
        active_section.forEach(item => {
            item.style.display = 'none'
        })
        active_section[index].style.display = 'flex'
    })
    button_x.forEach((item, index) => {
        item.addEventListener('click', () => {
            active_section[index].style.display = 'none'
        })
    })

})

output.innerHTML = range.value;

range.oninput = function () {
    output.innerHTML = this.value;
}

range.addEventListener("mousemove", function () {
    let x = range.value;
    range.style.background = 'linear-gradient(90deg, #96FFD9' + x + '%, #96FFD9' + x + '%)';
})

range.addEventListener('change', function () {
    if (range.value === "100") {
        video.volume = "1"

    } else if (range.value === "9" || range.value === "8" || range.value === "7" || range.value === "6" || range.value === "5" || range.value === "4" || range.value === "3" || range.value === "2" || range.value === "1") {
        video.volume = "0.0" + range.value
    } else {
        video.volume = "0." + range.value
    }

    if (range.value === "0") {
        value_icon.className = "fa-solid fa-volume-xmark"
    } else {
        value_icon.className = "fa-solid fa-volume-high"
    }
})

value_icon.addEventListener('click', function () {
    if (value_icon.classList.contains("fa-volume-high")) {
        value_icon.classList.remove("fa-volume-high")
        value_icon.classList.add("fa-volume-xmark")
        video.volume = 0
    } else {
        value_icon.classList.add("fa-volume-high")
        value_icon.classList.remove("fa-volume-xmark")
        if (range.value === "100") {
            video.volume = "1"
        } else {
            if (video.volume !== "100") {
                video.volume = "0." + range.value
            } else {
                video.volume = "1"
            }
        }
    }
})

video.addEventListener("timeupdate", function (event) {
    const {duration, currentTime} = event.srcElement
    video_line.querySelector('.video_footer_line_item').style.width = `${(currentTime / duration) * 100}%`
    if (video.ended) {
        next_video()
    }
})

video_line.addEventListener("click", function (e) {
    const width = video_line.clientWidth
    const offsetX = e.offsetX
    video.currentTime = (offsetX / width) * video.duration
})

video.addEventListener('click', () => {
    if (video_status === false) {
        video.play()
        video_status = true
    } else {
        video.pause()
        video_status = false
    }
})

header_button.forEach(item => {
    item.addEventListener('click', () => {
        header_button.forEach(item => {
            item.classList.remove('active')
        })
        item.classList.add('active')
    })
})

function click_section(div, button) {
    button.addEventListener('click', () => {
        header_sections.forEach(item => {
            item.style.display = 'none'
        })
        div.style.display = 'flex'
    })
}

click_section(massage__section, massage_icon)
click_section(video__section, video_icon)
click_section(v_chat__section, profile_icon)
click_section(v_chat__section, favorite_icon)
click_section(v_chat__section, v_chat_icon)

