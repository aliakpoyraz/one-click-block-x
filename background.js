console.log("Background script loaded");

const defaultSettings = {
  buttonBgColor: "#3A0000",
  buttonTextColor: "#FFFFFF",
  buttonHoverBgColor: "#ff3F3F",
  buttonHoverTextColor: "#FFFFFF",
  showBlockConfirmation: false,
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request);

  if (request.action === "getSettings") {
    chrome.storage.sync.get(defaultSettings, (result) => {
      console.log("Sending settings:", result);
      sendResponse(result);
    });
    return true;
  } else if (request.action === "saveSettings") {
    chrome.storage.sync.set(request.settings, () => {
      console.log("Settings saved:", request.settings);
      sendResponse({ success: true });
    });
    return true;
  } else {
    console.log("Unknown action:", request.action);
    sendResponse({ error: "Unknown action" });
  }
});
