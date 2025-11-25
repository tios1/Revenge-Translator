import { settings } from "revenge";
import { patchMessageSend } from "revenge/patcher";
import { createLogger } from "revenge";

const log = createLogger("AutoTranslate");

async function translateText(text, targetLang) {
    try {
        const res = await fetch("https://libretranslate.com/translate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                q: text,
                source: "auto",
                target: targetLang,
                format: "text"
            })
        });

        const data = await res.json();
        return data.translatedText || text;
    } catch (e) {
        log("Translation failed:", e);
        return text;
    }
}

export default {
    onLoad() {
        log("Loaded!");

        // Load saved settings
        this.targetLang = settings.get("autoTranslate.targetLang", "en");

        // Patch message sending
        this.unpatch = patchMessageSend(async (content) => {
            const output = await translateText(content, this.targetLang);
            return output;
        });
    },

    onUnload() {
        this.unpatch?.();
        log("Unloaded!");
    }
};
