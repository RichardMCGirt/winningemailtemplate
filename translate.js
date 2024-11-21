const API_KEY = "AIzaSyCkS1tVW-Z7vuuymmd69h9LMJ7w2PzVdjM";
const translateButton = document.getElementById("translateButton");
const inputText = document.getElementById("inputText");
const translatedText = document.getElementById("translatedText");

translateButton.addEventListener("click", async () => {
    const text = inputText.value.trim();
    if (!text) {
        alert("Please enter some text to translate.");
        return;
    }

    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
    const data = {
        q: text,
        source: "en",
        target: "es",
        format: "text"
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            translatedText.textContent = result.data.translations[0].translatedText;
        } else {
            const error = await response.json();
            console.error("Error translating text:", error);
            translatedText.textContent = "An error occurred while translating the text.";
        }
    } catch (error) {
        console.error("Error:", error);
        translatedText.textContent = "An error occurred. Please try again.";
    }
});
