const DEFAULT_LANGUAGE = 'cn',
    DEFAULT_TRIGGER_KEY = 'none',

    SAVE_STATUS = document.querySelector("#save-status"),

    SAVE_OPTIONS_BUTTON = document.querySelector("#save-btn"),
    RESET_OPTIONS_BUTTON = document.querySelector("#reset-btn"),


    OS_MAC = 'mac',

    KEY_COMMAND = 'Command',
    KEY_META = 'meta';

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

function saveOptions(e) {
    browserAPI.storage.local.set({
        language: document.querySelector("#language-selector").value,
        interaction: {
            dblClick: {
                key: document.querySelector("#popup-dblclick-key").value
            }
        },
        aiProvider: document.querySelector("#ai-provider").value,
        aiApiKey: document.querySelector("#ai-api-key").value
    }).then(showSaveStatusAnimation);

    e.preventDefault();
  }
  
  function restoreOptions() {
    let storageItem = browserAPI.storage.local.get();

    storageItem.then((results) => {
        let language = results.language,
            interaction = results.interaction || {},
            definitions = results.definitions || {};
        
        // language
        document.querySelector("#language-selector").value = language || DEFAULT_LANGUAGE;

        // interaction
        // document.querySelector("#popup-dblclick-checkbox").checked = interaction.dblClick.enabled;
        document.querySelector("#popup-dblclick-key").value = (interaction.dblClick && interaction.dblClick.key) || DEFAULT_TRIGGER_KEY;
        
        // document.querySelector("#popup-select-checkbox").checked = interaction.select.enabled;
        // document.querySelector("#popup-select-key").value = interaction.select.key;

        // AI settings
        document.querySelector("#ai-provider").value = results.aiProvider || 'GEMINI';
        document.querySelector("#ai-api-key").value = results.aiApiKey || '';
        updateApiKeyLink(results.aiProvider || 'GEMINI');

    });
  }

  function updateApiKeyLink(provider) {
    const providers = {
      'GEMINI': { url: 'https://aistudio.google.com/app/apikey', text: 'Get free Gemini API key' },
      'OPENAI': { url: 'https://platform.openai.com/api-keys', text: 'Get OpenAI API key' },
      'ANTHROPIC': { url: 'https://console.anthropic.com/settings/keys', text: 'Get Anthropic API key' }
    };
    const link = document.querySelector("#ai-key-link");
    const info = providers[provider];
    if (info) {
      link.href = info.url;
      link.textContent = info.text;
    }
  }

  document.querySelector("#ai-provider").addEventListener('change', (e) => {
    updateApiKeyLink(e.target.value);
  });
  
  function resetOptions (e) {
    browserAPI.storage.local.set({
        language: DEFAULT_LANGUAGE,
        interaction: {
            dblClick: {
                key: DEFAULT_TRIGGER_KEY
            }
        }
    }).then(restoreOptions);

    e.preventDefault();
  }


  function showSaveStatusAnimation () {
    SAVE_STATUS.style.setProperty("-webkit-transition", "opacity 0s ease-out");
    SAVE_STATUS.style.opacity = 1;
    window.setTimeout(function() {
        SAVE_STATUS.style.setProperty("-webkit-transition", "opacity 0.4s ease-out");
        SAVE_STATUS.style.opacity = 0
    }, 1500);
  }

  document.addEventListener('DOMContentLoaded', restoreOptions);


  SAVE_OPTIONS_BUTTON.addEventListener("click", saveOptions);
  RESET_OPTIONS_BUTTON.addEventListener("click", resetOptions);

  if (window.navigator.platform.toLowerCase().includes(OS_MAC)) {
    document.getElementById("popup-dblclick-key-ctrl").textContent = KEY_COMMAND;
    document.getElementById("popup-dblclick-key-ctrl").value = KEY_META;
  }
