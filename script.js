const URL = "https://teachablemachine.withgoogle.com/models/Yhvi7tG-_/";

let model, webcam;

// ================= INIT CAMERA =================
async function init() {
    try {
        if (webcam) return;

        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        model = await tmImage.load(modelURL, metadataURL);

        webcam = new tmImage.Webcam(300, 300, true);
        await webcam.setup();
        await webcam.play();

        document.getElementById("webcam-container").innerHTML = "";
        document.getElementById("webcam-container").appendChild(webcam.canvas);

        document.getElementById("startBtn").disabled = true;
        document.getElementById("startBtn").innerText = "Camera Active";

        document.getElementById("status").innerText = "Analyzing mood...";

        window.requestAnimationFrame(loop);

    } catch (error) {
        console.error(error);
        alert("Error: " + error.message);
    }
}

// ================= LOOP =================
async function loop() {
    webcam.update();
    await predict();

    setTimeout(() => {
        window.requestAnimationFrame(loop);
    }, 200);
}

// ================= PREDICTION =================
let currentEmotion = "";
let stableCount = 0;
let lastDetected = "";

async function predict() {
    const prediction = await model.predict(webcam.canvas);

    prediction.sort((a, b) => b.probability - a.probability);

    let top1 = prediction[0];

    // ignore weak signals
    if (top1.probability < 0.4) {
        document.getElementById("result").innerText = "Emotion: Detecting...";
        return;
    }

    let emotion = top1.className;

    // stability logic (simple counter)
    if (emotion === lastDetected) {
        stableCount++;
    } else {
        lastDetected = emotion;
        stableCount = 0;
    }

    // require 3 consistent frames (~600ms)
    if (stableCount >= 3 && emotion !== currentEmotion) {
        currentEmotion = emotion;

        console.log("Confirmed:", currentEmotion);

        document.getElementById("result").innerText =
            "Emotion: " + currentEmotion;

        document.body.style.backgroundColor =
            currentEmotion === "BigSmile" ? "#ffe066" :
            currentEmotion === "Angry" ? "#ff6b6b" :
            "#ffffff";

        showMusic(currentEmotion);
    }
}// ================= MUSIC =================
let lastVideo = "";

function showMusic(emotion) {
    let musicDiv = document.getElementById("music");

    let videoURL = "";

    if (emotion === "BigSmile") {
        videoURL = "https://www.youtube.com/embed/ZbZSe6N_BXs";
    }
    else if (emotion === "Angry") {
        videoURL = "https://www.youtube.com/embed/Lc9L3uAdcxo";
    }
    else {
        videoURL = "https://www.youtube.com/embed/Pu-Ny1L8yDU";
    }

    if (videoURL === lastVideo) return;

    lastVideo = videoURL;

    musicDiv.innerHTML = `
    <iframe width="350" height="220"
    src="${videoURL}?autoplay=1"
    allow="autoplay; encrypted-media"
    allowfullscreen></iframe>`;
}
