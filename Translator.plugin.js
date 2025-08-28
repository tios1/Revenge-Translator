const fetch = require('node-fetch'); // Use XMLHttpRequest if fetch is unavailable

module.exports = {
    name: 'AutoTranslator',
    description: 'Automatically translates messages in Discord.',
    author: 'YourName',
    version: '1.0.0',

    settings: {
        targetLanguage: 'en', // Default target language
        translateOutgoing: true, // Translate outgoing messages
        translateIncoming: false // Translate incoming messages
    },

    load() {
        console.log('AutoTranslator loaded!');
        this.hookMessages();
        this.createSettingsPanel();
    },

    unload() {
        console.log('AutoTranslator unloaded!');
        this.removeSettingsPanel();
    },

    hookMessages() {
        const self = this;

        // Hook into outgoing messages
        const originalSendMessage = window.DiscordNative.sendMessage;
        window.DiscordNative.sendMessage = async function(channelId, messageContent) {
            if (self.settings.translateOutgoing && messageContent.trim() !== '') {
                try {
                    const translated = await self.translateText(messageContent, self.settings.targetLanguage);
                    return originalSendMessage.call(this, channelId, translated);
                } catch (e) {
                    console.error('Translation error:', e);
                    return originalSendMessage.call(this, channelId, messageContent);
                }
            } else {
                return originalSendMessage.call(this, channelId, messageContent);
            }
        };

        // Hook into incoming messages
        if (self.settings.translateIncoming) {
            const originalReceiveMessage = window.DiscordNative.receiveMessage;
            window.DiscordNative.receiveMessage = async function(message) {
                if (message.content && message.content.trim() !== '') {
                    try {
                        const translated = await self.translateText(message.content, self.settings.targetLanguage);
                        message.content = `[Translated] ${translated}`;
                    } catch (e) {
                        console.error('Translation error:', e);
                    }
                }
                return originalReceiveMessage.call(this, message);
            };
        }
    },

    async translateText(text, targetLang) {
        const response = await fetch('https://libretranslate.com/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                q: text,
                source: 'auto',
                target: targetLang,
                format: 'text'
            })
        });

        const data = await response.json();
        return data.translatedText || text;
    },

    createSettingsPanel() {
        const container = document.createElement('div');
        container.innerHTML = `
            <h3>AutoTranslator Settings</h3>
            <label>Target Language:
                <input type="text" id="targetLang" value="${this.settings.targetLanguage}" />
            </label>
            <label>Translate Outgoing:
                <input type="checkbox" id="translateOut" ${this.settings.translateOutgoing ? 'checked' : ''}/>
            </label>
            <label>Translate Incoming:
                <input type="checkbox" id="translateIn" ${this.settings.translateIncoming ? 'checked' : ''}/>
            </label>
        `;
        document.body.appendChild(container);

        document.getElementById('targetLang').addEventListener('change', e => {
            this.settings.targetLanguage = e.target.value;
        });
        document.getElementById('translateOut').addEventListener('change', e => {
            this.settings.translateOutgoing = e.target.checked;
        });
        document.getElementById('translateIn').addEventListener('change', e => {
            this.settings.translateIncoming = e.target.checked;
        });
    },

    removeSettingsPanel() {
        const container = document.querySelector('div');
        if (container) {
            container.remove();
        }
    }
};
