const defaultSettings = {
    buttonBgColor: "#3A0000", 
    buttonTextColor: "#FFFFFF",
    buttonHoverBgColor: "#ff3F3F",
    buttonHoverTextColor: "#FFFFFF",
};
const blockEmoji = "🚫";
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
function sendMessageToBackground(message) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Message sending timed out"));
        }, 5000); // 5 second timeout

        try {
            chrome.runtime.sendMessage(message, (response) => {
                clearTimeout(timeout);
                if (chrome.runtime.lastError) {
                    console.error("Runtime error:", chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        } catch (error) {
            clearTimeout(timeout);
            console.error("Error sending message:", error);
            reject(error);
        }
    });
}
function addBlockButton() {
    if (window.location.pathname === "/settings/account") return;

    const usernames = document.querySelectorAll('[data-testid="User-Name"]');
    usernames.forEach((username) => {
        const existingButton = username.closest("article").querySelector(".block-button");
        if (existingButton) return;

        const blockButton = document.createElement("button");
        blockButton.textContent = blockEmoji;
        blockButton.className = "block-button";
        blockButton.style.marginLeft = "5px";
        blockButton.style.padding = "2px 4px";
        blockButton.style.display = "inline-flex";
        blockButton.style.alignItems = "center";
        blockButton.style.justifyContent = "center";
        blockButton.style.borderRadius = "3px";
        blockButton.style.fontSize = "14px";
        blockButton.style.border = "none";
        blockButton.style.cursor = "pointer";
        blockButton.style.background = "none";

        sendMessageToBackground({ action: "getSettings" })
            .then((settings) => {
                blockButton.addEventListener("mouseover", () => {
                    blockButton.style.backgroundColor = settings.buttonHoverBgColor;
                    blockButton.style.color = settings.buttonHoverTextColor;
                });

                blockButton.addEventListener("mouseout", () => {
                    blockButton.style.backgroundColor = "transparent";
                    blockButton.style.color = "inherit";
                });
            })
            .catch((error) => {
                console.error("Error getting settings:", error);
            });

        blockButton.addEventListener("click", () => {
            const tweet = username.closest("article");
            const moreOptionsButton = tweet.querySelector('[aria-haspopup="menu"]');
            if (moreOptionsButton) {
                moreOptionsButton.click();
                setTimeout(() => {
                    const blockMenuItem = document.querySelector('[data-testid="block"]');
                    if (blockMenuItem) {
                        blockMenuItem.click();
                        sendMessageToBackground({ action: "getSettings" })
                            .then((settings) => {
                                if (!settings.showBlockConfirmation) {
                                    setTimeout(() => {
                                        const confirmButton = document.querySelector('button[data-testid="confirmationSheetConfirm"]');
                                        if (confirmButton) {
                                            confirmButton.click();
                                        } else {
                                            console.error("Confirmation button not found");
                                        }
                                    }, 100);
                                }
                            })
                            .catch((error) => {
                                console.error("Error getting settings:", error);
                            });
                    } else {
                        console.error("Block menu item not found");
                    }
                }, 100);
            } else {
                console.error("More options button not found");
            }
        });
        const dateElement = username.closest("article").querySelector("time");
        if (dateElement) {
            dateElement.parentElement.insertAdjacentElement('afterend', blockButton);
        }
    });
}
const debouncedAddBlockButton = debounce(addBlockButton, 250);
function injectExtensionSettings() {
    const settingsMenu = document.querySelector('[aria-label="Navigation zum Abschnitt"]');
    if (!settingsMenu || settingsMenu.querySelector('[data-testid="extensionLink"]')) return;

    const extensionSettingsItem = document.createElement("div");
    extensionSettingsItem.className = "css-175oi2r";
    extensionSettingsItem.dataset.testid = "activeRoute";

    extensionSettingsItem.innerHTML = `
        <a href="#" role="tab" aria-selected="false" class="css-175oi2r r-1wtj0ep r-16x9es5 r-1mmae3n r-o7ynqc r-6416eg r-1ny4l3l r-1loqt21" data-testid="extensionLink" style="padding-right: 16px; padding-left: 16px;">
            <div class="css-175oi2r r-1awozwy r-18u37iz r-16y2uox">
                <div class="css-175oi2r r-16y2uox r-1wbh5a2">
                    <div dir="ltr" class="css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-16dba41" data-testid="test-LTRtext" style="text-overflow: unset; color: rgb(231, 233, 234);">
                        <span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3" style="text-overflow: unset;">One Click Block Settings</span>
                    </div>
                </div>
                <svg viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-1bwzh9t r-1q142lx r-2dysd3">
                    <g>
                        <path d="M14.586 12L7.543 4.96l1.414-1.42L17.414 12l-8.457 8.46-1.414-1.42L14.586 12z"></path>
                    </g>
                </svg>
            </div>
        </a>
    `;

    settingsMenu.appendChild(extensionSettingsItem);

    extensionSettingsItem.querySelector("a").addEventListener("click", (e) => {
        e.preventDefault();
        showExtensionSettings();
    });
}
function showExtensionSettings() {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "10000";
    overlay.style.fontFamily = "Arial, sans-serif";
    const settingsContainer = document.createElement("div");
    settingsContainer.style.backgroundColor = "#15202B";
    settingsContainer.style.padding = "20px";
    settingsContainer.style.borderRadius = "10px";
    settingsContainer.style.width = "400px";
    settingsContainer.style.position = "relative";

    settingsContainer.innerHTML = `
        <h2 style="color: #FFFFFF; margin-bottom: 20px; font-family: Arial, sans-serif;">One Click Block Settings</h2>
        <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <label for="BgColor" style="color: #FFFFFF; font-family: Arial, sans-serif;">Background Color</label>
                <div>
                    <input type="color" id="BgColor" style="width: 64px; margin-right: 10px;" />
                    <button class="resetButton" data-color="buttonBgColor" style="padding: 2px 5px; background-color: #657786; color: #FFFFFF; border: none; border-radius: 3px; cursor: pointer; font-family: Arial, sans-serif;">Reset</button>
                </div>
            </div>
        </div>
        <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <label for="TextColor" style="color: #FFFFFF; font-family: Arial, sans-serif;">Text Color</label>
                <div>
                    <input type="color" id="TextColor" style="width: 64px; margin-right: 10px;" />
                    <button class="resetButton" data-color="buttonTextColor" style="padding: 2px 5px; background-color: #657786; color: #FFFFFF; border: none; border-radius: 3px; cursor: pointer; font-family: Arial, sans-serif;">Reset</button>
                </div>
            </div>
        </div>
        <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <label for="HoverBgColor" style="color: #FFFFFF; font-family: Arial, sans-serif;">Hover Background Color</label>
                <div>
                    <input type="color" id="HoverBgColor" style="width: 64px; margin-right: 10px;" />
                    <button class="resetButton" data-color="buttonHoverBgColor" style="padding: 2px 5px; background-color: #657786; color: #FFFFFF; border: none; border-radius: 3px; cursor: pointer; font-family: Arial, sans-serif;">Reset</button>
                </div>
            </div>
        </div>
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <label for="HoverTextColor" style="color: #FFFFFF; font-family: Arial, sans-serif;">Hover Text Color</label>
                <div>
                    <input type="color" id="HoverTextColor" style="width: 64px; margin-right: 10px;" />
                    <button class="resetButton" data-color="buttonHoverTextColor" style="padding: 2px 5px; background-color: #657786; color: #FFFFFF; border: none; border-radius: 3px; cursor: pointer; font-family: Arial, sans-serif;">Reset</button>
                </div>
            </div>
        </div>
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <label for="showConfirmation" style="color: #FFFFFF; font-family: Arial, sans-serif;">Show Block Confirmation</label>
                <input type="checkbox" id="showConfirmation" />
            </div>
        </div>
        <div style="display: flex; justify-content: space-between;">
            <button id="saveSettings" style="padding: 5px 10px; background-color: #1DA1F2; color: #FFFFFF; border: none; border-radius: 5px; cursor: pointer; font-family: Arial, sans-serif;">Save</button>
            <button id="cancelSettings" style="padding: 5px 10px; background-color: #657786; color: #FFFFFF; border: none; border-radius: 5px; cursor: pointer; font-family: Arial, sans-serif;">Cancel</button>
        </div>
    `;

    overlay.appendChild(settingsContainer);
    document.body.appendChild(overlay);

    function updateInputs(settings) {
        const inputIds = ["BgColor", "TextColor", "HoverBgColor", "HoverTextColor"];

        inputIds.forEach((id) => {
            const input = document.getElementById(id);
            if (input) {
                const settingKey = `button${id}`;
                input.value = settings[settingKey];
            } else {
                console.error(`Input element with id ${id} not found`);
            }
        });
        const showConfirmationCheckbox = document.getElementById("showConfirmation");
        if (showConfirmationCheckbox) {
            showConfirmationCheckbox.checked = settings.showBlockConfirmation;
        } else {
            console.error("Checkbox with id showConfirmation not found");
        }
    }
    sendMessageToBackground({ action: "getSettings" })
        .then((settings) => {
            updateInputs(settings);
        })
        .catch((error) => {
            console.error("Error loading settings:", error);
            updateInputs({ ...defaultSettings, showBlockConfirmation: true });
        });
    document.querySelectorAll(".resetButton").forEach((button) => {
        button.addEventListener("click", () => {
            const colorKey = button.getAttribute("data-color");
            const inputId = colorKey.replace("button", "");
            const inputElement = document.getElementById(inputId);
            if (inputElement) {
                inputElement.value = defaultSettings[colorKey];
            } else {
                console.error(`Input element with id ${inputId} not found`);
            }
        });
    });

    function saveSettings(settings) {
        sendMessageToBackground({ action: "saveSettings", settings: settings })
            .then((response) => {
                if (response && response.success) {
                    document.body.removeChild(overlay);
                } else {
                    console.error("Unknown error while saving settings");
                    alert("Error saving settings. Please try again.");
                }
            })
            .catch((error) => {
                console.error("Error saving settings:", error);
                alert("Error saving settings. Please try again.");
            });
    }

    document.getElementById("saveSettings").addEventListener("click", () => {
        const settings = {
            buttonBgColor: document.getElementById("BgColor").value,
            buttonTextColor: document.getElementById("TextColor").value,
            buttonHoverBgColor: document.getElementById("HoverBgColor").value,
            buttonHoverTextColor: document.getElementById("HoverTextColor").value,
            showBlockConfirmation: document.getElementById("showConfirmation").checked,
        };

        saveSettings(settings);
    });
    document.getElementById("cancelSettings").addEventListener("click", () => {
        document.body.removeChild(overlay);
    });
}
function handlePageChange() {
    if (window.location.pathname.startsWith("/settings/")) {
        const settingsMenu = document.querySelector('[aria-label="Navigation zum Abschnitt"]');
        if (settingsMenu && !settingsMenu.querySelector('[data-testid="extensionLink"]')) {
            injectExtensionSettings();
        }
    } else {
        debouncedAddBlockButton();
    }
}
const observer = new MutationObserver(() => {
    if (window.location.pathname.startsWith("/settings/")) {
        const settingsMenu = document.querySelector('[aria-label="Navigation zum Abschnitt"]');
        if (settingsMenu && !settingsMenu.querySelector('[data-testid="extensionLink"]')) {
            injectExtensionSettings();
        }
    } else {
        debouncedAddBlockButton();
    }
});
const config = { childList: true, subtree: true };

observer.observe(document.body, config);
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        handlePageChange();
    }
}).observe(document, { subtree: true, childList: true });
handlePageChange();
if (!window.location.pathname.startsWith("/settings/")) {
    addBlockButton();
}