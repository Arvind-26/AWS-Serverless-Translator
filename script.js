const recordBtn = document.getElementById("recordBtn");
const translateBtn = document.getElementById("translateBtn");
const audioPlayer = document.getElementById("audioPlayer");
const translatedAudio = document.getElementById("translatedAudio");
const audioPlaceholder = document.getElementById("audioPlaceholder");
const responseText = document.getElementById("responseText");

let mediaRecorder;
let audioBlob;
let isRecording = false;

recordBtn.addEventListener("click", async () => {
    if (isRecording) {
        // Stop recording
        mediaRecorder.stop();
        recordBtn.textContent = "🎤 Start Recording";
        recordBtn.classList.remove("recording");
        isRecording = false;
        return;
    }

    try {
        // Start recording
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        mediaRecorder.ondataavailable = e => chunks.push(e.data);

        mediaRecorder.onstop = () => {
            audioBlob = new Blob(chunks, { type: "audio/webm" });
            const url = URL.createObjectURL(audioBlob);
            audioPlayer.src = url;
            audioPlayer.style.display = "block";

            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        recordBtn.textContent = "⏹️ Stop Recording";
        recordBtn.classList.add("recording");
        isRecording = true;

    } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Error accessing microphone. Please check permissions.");
    }
});

translateBtn.addEventListener("click", async () => {
    if (!audioBlob) {
        alert("Please record audio first.");
        return;
    }

    // Show loading state
    const btnText = translateBtn.querySelector('.btn-text');
    const originalText = btnText.textContent;

    translateBtn.disabled = true;
    btnText.innerHTML = '<div class="spinner"></div> Translating...';

    const formData = new FormData();
    formData.append('from', document.getElementById("fromLanguage").value);
    formData.append('to', document.getElementById("toLanguage").value);
    formData.append('file', audioBlob, "voice.webm");

    try {
        const res = await fetch("https://4oihyebmy9.execute-api.us-east-1.amazonaws.com/prod/mytranslator", {
            method: "POST",
            body: formData
        });

        const json = await res.json();
        console.log(json);

        // Handle translated audio
        if (json.audio_url) {
            translatedAudio.src = json.audio_url;
            translatedAudio.style.display = "block";
            audioPlaceholder.style.display = "none";
        }

        // Handle translated text
        if (json.text_url) {
            const textRes = await fetch(json.text_url);
            const textContent = await textRes.text();
            responseText.textContent = textContent;
            responseText.classList.remove("empty-state");
        } else {
            responseText.textContent = "❌ No text translation available";https://4oihyebmy9.execute-api.us-east-1.amazonaws.com/prod/mytranslator
            responseText.classList.remove("empty-state");
        }

    } catch (err) {
        console.error(err);
        responseText.textContent = "⚠️ Translation failed: " + err.message;
        responseText.classList.remove("empty-state");
    } finally {
        // Reset button state
        translateBtn.disabled = false;
        btnText.textContent = originalText;
    }
});