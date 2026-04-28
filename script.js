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
let candidateEmotion = "";
let stableTime = 0;
let requiredTime = 800; // faster + stable
let lastUpdateTime = Date.now();

async function predict() {
    const prediction = await model.predict(webcam.canvas);

    prediction.sort((a, b) => b.probability - a.probability);

    let top1 = prediction[0];

    // ✅ SIMPLE FIX (important for BigSmile)
    if (top1.probability < 0.35) {
        document.getElementById("result").innerText = "Emotion: Detecting...";
        return;
    }

    let emotion = top1.className;
    let now = Date.now();

    // stability logic
    if (emotion === candidateEmotion) {
        stableTime += (now - lastUpdateTime);
    } else {
        candidateEmotion = emotion;
        stableTime = 0;
    }

    lastUpdateTime = now;

    // confirm stable emotion
    if (stableTime > requiredTime && candidateEmotion !== currentEmotion) {
        currentEmotion = candidateEmotion;

        console.log("Emotion:", currentEmotion);

        document.getElementById("result").innerText =
            "Emotion: " + currentEmotion;

        document.getElementById("status").innerText =
            "Analyzing mood...";

        document.body.style.backgroundColor =
            currentEmotion === "BigSmile" ? "#ffe066" :
            currentEmotion === "Angry" ? "#ff6b6b" :
            "#ffffff";

        showMusic(currentEmotion);
    }
}

// ================= MUSIC =================
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

    // prevent unnecessary reload
    if (videoURL === lastVideo) return;

    lastVideo = videoURL;

    musicDiv.innerHTML = `
    <iframe width="350" height="220"
    src="${videoURL}?autoplay=1"
    allow="autoplay; encrypted-media"
    allowfullscreen></iframe>`;
}
