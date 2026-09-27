const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

function update() {
    eagle.velocity += gravity;
    eagle.y += eagle.velocity;

    updateObstacles();
    detectCollisions();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawEagle();
    drawObstacles();
    drawScore();
}

function gameLoop() {
    update();
    render();

    requestAnimationFrame(gameLoop);
}

gameLoop();

canvas.addEventListener("pointerdown", flap);

document.addEventListener("keydown", e => {
    if (e.code === "Space") {
        flap();
    }
});