let inputElement = document.getElementById('image-input'), container = document.getElementById('image-container'),
    img_div = document.querySelector('.file'), register__button = document.querySelector('#register__button'),
    login__button = document.querySelector('#login__button'), register_div = document.querySelector('.register'),
    login_div = document.querySelector('.login');

login__button.addEventListener('click', () => {
    login_div.style.display = 'flex'
    register_div.style.display = 'none'
})
register__button.addEventListener('click', () => {
    register_div.style.display = 'flex'
    login_div.style.display = 'none'
})

img_div.addEventListener('click', () => {
    inputElement.click()
    upload_image()
})
container.addEventListener('click', () => {
    inputElement.click()
    upload_image()
})

function upload_image() {
    inputElement.addEventListener('change', function () {
        let input = document.getElementById('image-input');
        let container = document.getElementById('image-container');

        if (input.files && input.files[0]) {
            let reader = new FileReader();

            reader.onload = function (e) {
                var img = document.createElement('img');
                img.src = e.target.result;
                container.innerHTML = '';
                container.appendChild(img);
            }

            reader.readAsDataURL(input.files[0]);
        }
    })
}



