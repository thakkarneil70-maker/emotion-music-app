const URL = "https://teachablemachine.withgoogle.com/models/Yhvi7tG-_/"; // 🔴 IMPORTANT

let model, webcam;

// stability system
let emotionBuffer = [];
let bufferSize = 20;
let lastEmotion = "";
let cooldown = false;

// ================= INIT CAMERA =================
async function init() {
    try {
        console.log("Init started");

        if (webcam) {
            alert("Camera already started!");
            return;
        }

        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        console.log("Loading model...");
        model = await tmImage.load(modelURL, metadataURL);
        console.log("Model loaded");

        webcam = new tmImage.Webcam(300, 300, true);

        await webcam.setup();
        await webcam.play();

        document.getElementById("webcam-container").innerHTML = "";
        document.getElementById("webcam-container").appendChild(webcam.canvas);

        window.requestAnimationFrame(loop);

        console.log("Camera started");

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

// ================= PREDICT =================
let currentEmotion = "";
let candidateEmotion = "";
let stableTime = 0;
let requiredTime = 1500; // 1.5 sec
let lastUpdateTime = Date.now();

async function predict() {
    const prediction = await model.predict(webcam.canvas);

    // sort predictions
    prediction.sort((a, b) => b.probability - a.probability);

    let top1 = prediction[0];
    let top2 = prediction[1];

    let gap = top1.probability - top2.probability;

    // 🧠 Only accept strong winner
    if (gap < 0.2) {
        return; // ignore weak/confusing frames
    }

    let emotion = top1.className;

    let now = Date.now();

    // ⏱️ stability check
    if (emotion === candidateEmotion) {
        stableTime += (now - lastUpdateTime);
    } else {
        candidateEmotion = emotion;
        stableTime = 0;
    }

    lastUpdateTime = now;

    // ✅ Only confirm if stable for required time
    if (stableTime > requiredTime && candidateEmotion !== currentEmotion) {
        currentEmotion = candidateEmotion;

        console.log("Confirmed Emotion:", currentEmotion);

        // 🎯 Update UI
        document.getElementById("result").innerText =
            "Emotion: " + currentEmotion;

        // 🎨 Background change
        document.body.style.backgroundColor =
            currentEmotion === "BigSmile" ? "#ffe066" :
            currentEmotion === "Angry" ? "#ff6b6b" :
            "#ffffff";

        // 🎵 Play music
        showMusic(currentEmotion);
    }
    console.log(prediction);
}

// ================= MUSIC =================
function showMusic(emotion) {
    let musicDiv = document.getElementById("music");

    if (emotion === "BigSmile") {
        musicDiv.innerHTML = `
        <iframe width="350" height="220"
        src="https://www.youtube.com/embed/ZbZSe6N_BXs"></iframe>`;
    }
    else if (emotion === "Angry") {
        musicDiv.innerHTML = `
        <iframe width="350" height="220"
        src="https://www.youtube.com/embed/2Vv-BfVoq4g"></iframe>`;
    }
    else {
        musicDiv.innerHTML = `
        <iframe width="350" height="220"
        src="https://www.youtube.com/embed/5qap5aO4i9A"></iframe>`;
    }
}
document.getElementById("status").innerText = "Analyzing mood...";