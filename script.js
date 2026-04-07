async function generateImage(prompt) {
    const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
            method: "POST",
            headers: {
                "Authorization": "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",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: prompt
            })
        }
    );

    const blob = await response.blob();
    const imageURL = URL.createObjectURL(blob);

    document.getElementById("output").src = imageURL;
    // Store blob for saving
    window.generatedBlob = blob;
}

async function saveImage() {
    if (window.generatedBlob) {
        await puter.fs.write("generated-image.png", window.generatedBlob);
        alert("Image saved!");
    } else {
        alert("No image to save. Generate one first.");
    }
}