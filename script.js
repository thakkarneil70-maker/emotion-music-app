const URL = "https://teachablemachine.withgoogle.com/models/Yhvi7tG-_/";

let model, webcam;

// ================= INIT CAMERA =================
async function init() {
    try {
        console.log("Init started");

        if (webcam) return;

        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        model = await tmImage.load(modelURL, metadataURL);
        console.log("Model loaded");

        webcam = new tmImage.Webcam(300, 300, true);
        await webcam.setup();
        await webcam.play();

        document.getElementById("webcam-container").innerHTML = "";
        document.getElementById("webcam-container").appendChild(webcam.canvas);

        // Disable button
        document.getElementById("startBtn").disabled = true;
        document.getElementById("startBtn").innerText = "Camera Active";

        // Initial status
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
    }, 200); // slower = stable
}

// ================= PREDICTION SYSTEM =================
let currentEmotion = "";
let candidateEmotion = "";
let stableTime = 0;
let requiredTime = 1500;
let lastUpdateTime = Date.now();

async function predict() {
    const prediction = await model.predict(webcam.canvas);

    // sort predictions
    prediction.sort((a, b) => b.probability - a.probability);

    let top1 = prediction[0];
    let top2 = prediction[1];

    let gap = top1.probability - top2.probability;

    // 🧠 Ignore weak/confusing predictions
    if (gap < 0.1 && top1.probability < 0.5) {
        document.getElementById("result").innerText = "Emotion: Detecting...";
        document.getElementById("status").innerText = "Trying to understand mood...";
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

        console.log("Confirmed Emotion:", currentEmotion);

        // UI update
        document.getElementById("result").innerText =
            "Emotion: " + currentEmotion;

        document.getElementById("status").innerText =
            "Analyzing mood...";

        // background color
        document.body.style.backgroundColor =
            currentEmotion === "BigSmile" ? "#ffe066" :
            currentEmotion === "Angry" ? "#ff6b6b" :
            "#ffffff";

        // play music
        showMusic(currentEmotion);
    }
}

// ================= MUSIC =================
function showMusic(emotion) {
    let musicDiv = document.getElementById("music");

    if (emotion === "BigSmile") {
        musicDiv.innerHTML = `
        <iframe width="350" height="220"
        src="https://www.youtube.com/embed/j_3C0z96GE0&list=RDj_3C0z96GE0&start_radio=1"
        allow="autoplay"></iframe>`;
    }
    else if (emotion === "Angry") {
        musicDiv.innerHTML = `
        <iframe width="350" height="220"
        src="https://www.youtube.com/embed/ZbZSe6N_BXs&list=RDZbZSe6N_BXs&start_radio=1"
        allow="autoplay"></iframe>`;
    }
    else {
        musicDiv.innerHTML = `
        <iframe width="350" height="220"
        src="https://www.youtube.com/embed/Lc9L3uAdcxo&list=RDLc9L3uAdcxo&start_radio=1"
        allow="autoplay"></iframe>`;
    }
}
