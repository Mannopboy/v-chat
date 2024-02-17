const parallax_el = document.querySelectorAll('.parallax');

let xValue = 0, yValue = 0;

let rotateDegree = 0;

function update(cursorPosition) {
    parallax_el.forEach((item) => {
        let speedX = item.dataset.speedx;
        let speedY = item.dataset.speedy;
        let speedZ = item.dataset.speedz;
        let rotateSpeed = item.dataset.rotation;

        let isInLeft = parseFloat(getComputedStyle(item).left) < window.innerWidth / 2 ? 1 : -1;

        let zValue = (cursorPosition - parseFloat(getComputedStyle(item).left)) * isInLeft * 0.1;

        item.style.transform = `perspective(2300px) translateZ(${zValue * speedZ}px) rotateY(${rotateDegree * rotateSpeed}deg) translateX(calc(-50% + ${-xValue * speedX}px)) translateY(calc(-50% + ${yValue * speedY}px))`
    })
}

update(0)

window.addEventListener('mousemove', (e) => {
    xValue = e.clientX - window.innerWidth / 2;
    yValue = e.clientY - window.innerHeight / 2;

    rotateDegree = (xValue / (window.innerWidth / 2)) * 20;

    update(e.clientX)
})


let timeline = gsap.timeline();
