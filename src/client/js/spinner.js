let spinnerCanvas = document.getElementById("spinner-canvas");
let imageUpload = document.getElementById("image-upload");
let generateSpinner = document.getElementById("generate-spinner");
let progress = document.getElementById("progress");

let image = new Image();
image.src = "../img/cube.png";
let texture = new THREE.Texture(image);
image.addEventListener("load", () => {
    texture.needsUpdate = true;
});

let imageLoadedPromise = new Promise(resolve => {
    imageUpload.addEventListener("change", (e) => {
        let file = imageUpload.files[0];
        let reader = new FileReader();

        reader.addEventListener("load", () => {
            image.src = reader.result;
            resolve();
        });

        if(file) reader.readAsDataURL(file);
    });
});

function generateGif(elem, renderFunction, duration=1, fps=30) {
    let frames = duration * fps;

    let canvas = document.createElement("canvas");
    canvas.width = elem.width;
    canvas.height = elem.height;
    let ctx = canvas.getContext("2d");

    let buffer = new Uint8Array(canvas.width * canvas.height * frames * 5);
    let pixels = new Uint8Array(canvas.width * canvas.height);
    let writer = new GifWriter(buffer, canvas.width, canvas.height, {loop: 0});

    let now = 0;

    return new Promise(async function addFrame(resolve)  {
        renderFunction(now / frames);

        ctx.drawImage(elem, 0, 0);
        let data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let palette = [];

        for(let j = 0, k = 0, jl = data.length; j < jl; j += 4, k++) {
            let rgb = [
                Math.floor(data[j] * 0.1) * 10,
                Math.floor(data[j + 1] * 0.1) * 10,
                Math.floor(data[j + 2] * 0.1) * 10
            ];
            let color = rgb[0] << 16 | rgb[1] << 8 | rgb[2] << 0;

            let index = palette.indexOf(color);
            if(index === -1) {
                pixels[k] = palette.length;
                palette.push(color);
            } else {
                pixels[k] = index;
            }
        }

        let powof2 = 1;
        while(powof2 < palette.length) powof2 <<= 1;
        palette.length = powof2;

        let delay = 100 / fps;
        let options = {palette: new Uint32Array(palette), delay};
        writer.addFrame(0, 0, canvas.width, canvas.height, pixels, options);

        now++;
        progress.value = now / frames;

        if(now < frames) await setTimeout(addFrame, 0, resolve);
        else resolve(buffer.subarray(0, writer.end()));
    });
}

generateSpinner.addEventListener("click", async (e) => {
    generateSpinner.style.display = "none";
    progress.style.display = "";

    let buffer = await generateGif(spinnerCanvas, render, 4, 30);
    let blob = new Blob([buffer], {type: "image/gif"});

    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "spinny.gif";
    link.dispatchEvent(new MouseEvent("click"));
});

// setup
let camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
camera.position.z = 2;

let scene = new THREE.Scene();
let geometry = new THREE.BoxGeometry(1, 1, 1);
let material = new THREE.MeshBasicMaterial({map:texture});
let mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

let renderer = new THREE.WebGLRenderer({canvas:spinnerCanvas});
renderer.setClearColor(0xffffff, 1);
renderer.setSize(400, 400);

function render(progress) {
    mesh.rotation.x = progress * Math.PI * 2;
    mesh.rotation.y = -progress * Math.PI * 2;

    renderer.render(scene, camera);
}

function animation(time) {
    if(progress.style.display === "none") {
        render((time / 2000) % 1);
    }

    requestAnimationFrame(animation);
}

requestAnimationFrame(animation);