//for adding new hooks
const webhookName = document.getElementById("webhookName");
const webhookUrl = document.getElementById("webhookUrl");
const addWebhook = document.getElementById("addWebhook");

//for sharing webhooks
const shareCurrentTab = document.getElementById("shareCurrentTab");
const shareAllTab = document.getElementById("shareAllTab");

//for navigation between webhooks
const prevHook = document.getElementById("prevHook");
const currentHook = document.getElementById("currentHook");
const nextHook = document.getElementById("nextHook");
let numberOfHook = 0;
let selectedHook = { index: 0, name: null, url: null };

//main messaging area
const messageBox = document.getElementById("messageBox");
const sendMessageButton = document.getElementById("sendMessage");

//chrome storage
const storage = chrome.storage.sync;

// types: success, warn, error
function notify(message = "Message sent successfully.", type = "success") {
  const notification = document.getElementById("notification");
  notification.innerText = message;
  notification.className = type; // Use className for cleaner class assignment
  notification.style.display = "block";
  setTimeout(() => {
    notification.style.display = "none";
    notification.className = ""; // Clear classes
  }, 2000);
}

function getWebhooksFromStorage(callback) {
  storage.get(["webhook"], ({ webhook }) => {
    const webhooks = webhook || [];
    callback(webhooks);
  });
}

//to update accessibility of send button based on certain factors
function updateSendMessageButton() {
  getWebhooksFromStorage((webhooks) => {
    sendMessageButton.disabled = !(
      webhooks.length > 0 && messageBox.value.length > 0
    );
  });
}

//to update toggle menu
function updateCurrentHook() {
  getWebhooksFromStorage((webhooks) => {
    if (webhooks.length > 0) {
      let index = selectedHook.index; //currently selected hook's index
      selectedHook.name = webhooks[index].name;
      selectedHook.url = webhooks[index].url;
      currentHook.innerText = selectedHook.name;
      numberOfHook = webhooks.length;
      prevHook.disabled = index === 0;
      nextHook.disabled = index === numberOfHook - 1;
      shareCurrentTab.disabled = false;
      shareAllTab.disabled = false;
    } else {
      currentHook.innerText = "No webhook is set.";
      prevHook.disabled = true;
      nextHook.disabled = true;
      shareCurrentTab.disabled = true;
      shareAllTab.disabled = true;
    }
  });
}

//to update both
function updateState() {
  updateSendMessageButton();
  updateCurrentHook();
}

function sendMessage(message) {
  if (message.length <= 0) {
    notify("Message cannot be empty.", "error");
    return;
  }

  fetch(selectedHook.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: message,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      notify(`Message sent to ${selectedHook.name} successfully.`, "success");
      messageBox.value = "";
    })
    .catch((error) => {
      notify("An error occurred: " + error.message, "error");
      console.error("An error occurred:", error.message);
    })
    .finally(() => {
      updateState();
    });
}

//adding the webhooks
addWebhook.addEventListener("click", () => {
  const trimmedHookName = webhookName.value.trim();
  const trimmedHookUrl = webhookUrl.value.trim();

  if (trimmedHookName.length === 0 || trimmedHookUrl.length === 0) {
    notify("Webhook name and URL are required.", "warn");
    return;
  }

  getWebhooksFromStorage((webhooks) => {
    //proceeding to add
    webhooks.push({ name: trimmedHookName, url: trimmedHookUrl });
    storage.set({ webhook: webhooks });
    notify("Webhook added successfully.", "success");
    webhookName.value = webhookUrl.value = "";
    updateState();
  });
});

//share only current tab
shareCurrentTab.addEventListener("click", async () => {
  const currTab = await chrome.runtime.sendMessage({ message: "currentTab" });
  messageBox.value += `${currTab.url}\n`;
  updateSendMessageButton();
});

//share all tabs
shareAllTab.addEventListener("click", async () => {
  const allTabs = await chrome.runtime.sendMessage({ message: "allTab" });
  const tabs = allTabs.map((tab) => tab.url).join("\n");
  messageBox.value += `${tabs}\n`;
  updateSendMessageButton();
});

prevHook.addEventListener("click", () => {
  if (selectedHook.index > 0) {
    updateCurrentHook(--selectedHook.index);
  }
});

nextHook.addEventListener("click", () => {
  if (selectedHook.index < numberOfHook - 1) {
    updateCurrentHook(++selectedHook.index);
  }
});

messageBox.addEventListener("input", updateSendMessageButton);
messageBox.addEventListener("change", updateSendMessageButton);

sendMessageButton.addEventListener("click", () => {
  sendMessage(messageBox.value);
});

function init() {
  updateState();
}

init();
