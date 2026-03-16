let x = 0;

function animate() {
    x += 0.3; 
    document.getElementById("panorama").style.backgroundPosition = `${-x}px 0`;
    requestAnimationFrame(animate);
}

animate();