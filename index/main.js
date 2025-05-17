// =================================================================================
// IMPORTS
// =================================================================================
import {
  getWebhooksFromStorage,
  saveText,
  loadText,
  createEmbed,
  setCurrentHook,
  getCurrentHook,
  setCurrentLayout,
  getCurrentLayout,
} from "../src/utils.js";
import { loadAndApplyTheme, themes } from "../src/theme.js";

// =================================================================================
// GLOBAL STATE AND CONFIGURATION
// =================================================================================
// these will be initialized in init()
let layoutType;
let selectedHook;
let numberOfHook = 0;

// =================================================================================
// DOM ELEMENT SELECTORS
// =================================================================================
const messageArea = document.getElementById("messageArea");
const sendMessageButton = document.getElementById("sendMessageButton");
const messageBox = document.getElementById("messageBox");

const embedArea = document.getElementById("embedArea");
const sendEmbedButton = document.getElementById("sendEmbedButton");
const requiredEmbedFields = [...embedArea.querySelectorAll("[required]")];
const allEmbedFields = [...embedArea.querySelectorAll("input[type='text'], textarea")];

const changeLayoutButton = document.getElementById("changeLayoutButton");
const changeLayoutText = document.getElementById("changeLayoutText");
const changeLayoutIcon = document.getElementById("changeLayoutIcon");

const currentHookElement = document.getElementById("currentHook");
const prevHookButton = document.getElementById("prevHook");
const nextHookButton = document.getElementById("nextHook");

const notificationElement = document.getElementById("notification");

const shareCurrentTabButton = document.getElementById("shareCurrentTabButton");
const shareAllTabButton = document.getElementById("shareAllTabButton");
const settingButton = document.getElementById("settingButton");
const clearFieldButtons = [...document.getElementsByClassName("clearFieldButton")];

// =================================================================================
// UTILITY AND UI FUNCTIONS
// =================================================================================
function notify(message = "Message sent successfully.", type = "success", duration = 700) {
  notificationElement.innerText = message;
  notificationElement.className = type;
  notificationElement.style.display = "block";
  setTimeout(() => {
    notificationElement.style.display = "none";
    notificationElement.className = "";
  }, duration);
}

function updateLayoutDOM() {
  setCurrentLayout(layoutType); //persist change
  if (layoutType == "message") {
    messageArea.style.display = "flex";
    embedArea.style.display = "none";
    document.body.style.height = "500px";
    changeLayoutText.innerText = "Send Embed";
    changeLayoutIcon.setAttribute("data", "/assets/send_embed.svg");
    return;
  }
  if (layoutType == "embed") {
    embedArea.style.display = "flex";
    messageArea.style.display = "none";
    document.body.style.height = "600px";
    changeLayoutText.innerText = "Send Message";
    changeLayoutIcon.setAttribute("data", "/assets/send_message.svg");
    return;
  }
}

function updateSendButtonState() {
  const isMessageBoxEmpty = messageBox.value.trim().length === 0;
  const isAnyEmbedRequiredFieldEmpty = requiredEmbedFields.some((field) => field.value.trim().length === 0);
  sendMessageButton.disabled = numberOfHook === 0 || isMessageBoxEmpty;
  sendEmbedButton.disabled = numberOfHook === 0 || isAnyEmbedRequiredFieldEmpty;
}

// =================================================================================
// DATA AND STATE MANAGEMENT FUNCTIONS
// =================================================================================
async function updateCurrentHookData() {
  const webhooks = await getWebhooksFromStorage();
  numberOfHook = webhooks.length;
  let currentIndex = selectedHook.index ? selectedHook.index : 0;

  if (!numberOfHook) {
    currentHookElement.innerText = "No webhook found";
    selectedHook = { index: 0, name: "", url: "" };
  } else {
    //check for boundary
    if (currentIndex >= numberOfHook) currentIndex = numberOfHook - 1;
    if (currentIndex < 0) currentIndex = 0;

    selectedHook.index = currentIndex;
    selectedHook.name = webhooks[selectedHook.index].name;
    selectedHook.url = webhooks[selectedHook.index].url;
    currentHookElement.innerText = selectedHook.name;
  }

  setCurrentHook(selectedHook); //persist change
  prevHookButton.disabled = !numberOfHook || selectedHook.index <= 0;
  nextHookButton.disabled = !numberOfHook || selectedHook.index >= numberOfHook - 1;
}

function clearInputFields() {
  if (layoutType == "message") {
    messageBox.value = "";
    saveText("message", messageBox.value);
  }
  if (layoutType == "embed") {
    allEmbedFields.forEach((field) => {
      field.value = "";
      saveText(field.name, field.value);
    });
  }
  updateSendButtonState();
}

async function loadPersistedFieldData() {
  if (layoutType == "message") {
    messageBox.value = (await loadText("message")) || "";
  }
  if (layoutType == "embed") {
    for (let i = 0; i < allEmbedFields.length; i++) {
      allEmbedFields[i].value = (await loadText(allEmbedFields[i].name)) || "";
    }
  }
  updateSendButtonState();
}

async function refreshState() {
  await loadPersistedFieldData();
  await updateCurrentHookData();
  updateLayoutDOM();
  updateSendButtonState();
}

// =================================================================================
// SENDING LOGIC (MESSAGES AND EMBEDS)
// =================================================================================
async function sendRequest(requestBody) {
  if (!selectedHook || !selectedHook.url) {
    notify("No webhook selected.", "error");
    return;
  }

  if (!requestBody.content && !requestBody.embeds) {
    notify("Message is empty.", "warn");
    return;
  }

  if (requestBody.content) {
    const trimmedContent = requestBody.content.trim();
    if (trimmedContent.length <= 0 || trimmedContent.length > 1900) {
      notify("Message cannot be too short or too long.", "warn");
      return;
    }
  }

  if (requestBody.embeds && requestBody.embeds[0]) {
    const description = requestBody.embeds[0].description || "";
    if (description.length > 4096) {
      notify("Description cannot be longer than 4096 characters.", "warn");
      return;
    }
  }

  //clear now, persist later due to failure
  clearInputFields();

  try {
    const response = await fetch(selectedHook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorDetails = response.statusText;
      try {
        notify(`Failed to send: ${errorDetails}`, "error");
        const errorData = await response.json();
        errorDetails = errorData.message || JSON.stringify(errorData);
      } catch (e) {
        console.error(e);
      }
      throw new Error(`Code ${response.status}: ${errorDetails}`);
    }

    notify(`Successfully sent to ${selectedHook.name}`, "success");
  } catch (error) {
    notify(`An error occurred: ${error.message}`, "error");
    console.error("Error sending request:", error);
  } finally {
    await refreshState();
  }
}

async function sendEmbedMessage(embedData) {
  embed = createEmbed(embedData);
  await sendRequest({ embeds: [embed] });
}

async function sendTextMessage(messageText) {
  sendRequest({ content: messageText });
}

// =================================================================================
// EVENT HANDLERS & LISTENERS SETUP
// =================================================================================
function setupEventListeners() {
  //layout switching
  changeLayoutButton.addEventListener("click", async () => {
    layoutType = layoutType == "message" ? "embed" : "message";
    updateLayoutDOM();
    await loadPersistedFieldData();
  });

  //hook navigation
  prevHookButton.addEventListener("click", async () => {
    if (selectedHook && selectedHook.index <= 0) return;
    selectedHook.index--;
    await updateCurrentHookData();
  });

  nextHookButton.addEventListener("click", async () => {
    if (selectedHook && selectedHook.index >= numberOfHook - 1) return;
    selectedHook.index++;
    await updateCurrentHookData();
  });

  //tab sharing
  shareCurrentTabButton.addEventListener("click", async () => {
    const currentTab = await chrome.runtime.sendMessage({ message: "currentTab" });
    const tabUrl = currentTab.url;

    allEmbedFields[4].value = tabUrl;

    if (layoutType === "message") {
      messageBox.value += tabUrl + "\n";
      saveText("message", messageBox.value);
    } else if (layoutType === "embed") {
      allEmbedFields[4].value = tabUrl;
      saveText(allEmbedFields[4].name, allEmbedFields[4].value);
    }
    updateSendButtonState();
  });

  shareAllTabButton.addEventListener("click", async () => {
    const allTabs = await chrome.runtime.sendMessage({ message: "allTab" });
    const tab = allTabs.map((tab) => tab.url).join("\n") + "\n";
    if (layoutType === "message") {
      messageBox.value += tab + "\n";
      saveText("message", messageBox.value);
    } else if (layoutType === "embed") {
      allEmbedFields[3].value += tab;
      saveText(allEmbedFields[3].name, allEmbedFields[3].value);
    }
    updateSendButtonState();
  });

  //settings
  settingButton.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  //clear button
  clearFieldButtons.forEach((btn) => btn.addEventListener("click", clearInputFields));

  //auto-save input
  messageBox.addEventListener("input", () => {
    saveText("message", messageBox.value.trim());
    updateSendButtonState();
  });

  allEmbedFields.forEach((field) => {
    field.addEventListener("input", () => {
      saveText(field.name, field.value.trim());
      updateSendButtonState();
    });
  });

  //send actions
  sendMessageButton.addEventListener("click", async () => {
    await sendTextMessage(messageBox.value.trim());
  });

  messageBox.addEventListener("keydown", async (event) => {
    if (event.key === "Enter" && !event.shiftKey && sendMessageButton.disabled == false) {
      event.preventDefault(); //prevent new line
      await sendTextMessage(messageBox.value.trim());
    }
  });

  embedArea.addEventListener("submit", async (event) => {
    event.preventDefault();
    let embed = {};
    allEmbedFields.forEach((el) => (embed[el.name] = el.value.trim()));
    await sendEmbed(embed);
  });
}

// =================================================================================
// INITIALIZATION
// =================================================================================
/**
 * Initializes the application:
 * - Fetches initial layout and selected hook.
 * - Sets up the initial UI display.
 * - Loads persisted data.
 * - Updates hook information.
 * - Applies theme.
 * - Sets up event listeners.
 */
async function init() {
  layoutType = await getCurrentLayout();
  selectedHook = await getCurrentHook();
  await refreshState();
  await loadAndApplyTheme(themes);
  setupEventListeners();
}

init().catch((error) => {
  console.error("Initialization error:", error);
  notify(`Failed to initialize: ${error.message}`, "error");
});
