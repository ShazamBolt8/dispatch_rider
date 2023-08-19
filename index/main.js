import { getWebhooksFromStorage, saveText, loadText, createEmbed } from "../src/utils.js";

//the default configurations
let layoutType = "message";
let numberOfHook = 0;
let selectedHook = { index: 0, name: "", url: "" };

const messageArea = document.getElementById("messageArea");
const sendMessageButton = document.getElementById("sendMessageButton");
const messageBox = document.getElementById("messageBox");

const embedArea = document.getElementById("embedArea");
const sendEmbedButton = document.getElementById("sendEmbedButton");
const requiredEmbedFields = [...embedArea.querySelectorAll("[required]")];
const allEmbedFields = [...embedArea.querySelectorAll("input[type='text'], textarea")];

const changeLayoutButton = document.getElementById("changeLayoutButton");

const currentHookElement = document.getElementById("currentHook");
const prevHookButton = document.getElementById("prevHook");
const nextHookButton = document.getElementById("nextHook");

/**********************************************
 *                                            *
 *  This section contains functions for       *
 *  updating UI, hooks, buttons, state, and   *
 *  some other helper functions.              *
 *                                            *
 **********************************************/

// types: success, warn, error
function notify(message = "Message sent successfully.", type = "success") {
  const notification = document.getElementById("notification");
  notification.innerText = message;
  notification.className = type;
  notification.style.display = "block";
  setTimeout(() => {
    notification.style.display = "none";
    notification.className = "";
  }, 700);
}

//update layout from one type to the other
function updateLayout() {
  const changeLayoutText = document.getElementById("changeLayoutText");
  const changeLayoutIcon = document.getElementById("changeLayoutIcon");
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

//(enable || disable) send buttons based on some factors
function updateSendButton() {
  const isMessageBoxEmpty = messageBox.value.trim().length === 0;
  const isAnyEmbedRequiredFieldEmpty = requiredEmbedFields.some((field) => field.value.trim().length === 0);
  sendMessageButton.disabled = numberOfHook === 0 || isMessageBoxEmpty;
  sendEmbedButton.disabled = numberOfHook === 0 || isAnyEmbedRequiredFieldEmpty;
}

//update stuff related to hook
function updateHookData() {
  getWebhooksFromStorage((webhooks) => {
    numberOfHook = webhooks.length;
    let index = selectedHook.index;
    if (!numberOfHook > 0) {
      currentHookElement.innerText = "No webhook found.";
    } else {
      selectedHook.name = webhooks[index].name;
      selectedHook.url = webhooks[index].url;
      currentHookElement.innerText = selectedHook.name;
    }
    prevHookButton.disabled = index === 0;
    nextHookButton.disabled = index === numberOfHook - 1;
  });
}

function clearField() {
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
}

function loadFieldData() {
  if (layoutType == "message") {
    loadText("message", (message) => {
      messageBox.value = message === undefined ? "" : message;
      updateSendButton();
    });
  }
  if (layoutType == "embed") {
    allEmbedFields.forEach((field) => {
      loadText(field.name, (data) => {
        field.value = data === undefined ? "" : data;
        updateSendButton();
      });
    });
  }
}

//updating availability of send buttons, current hook name, and layout type
function updateState() {
  loadFieldData();
  updateHookData();
  updateLayout();
  updateSendButton();
}

/**********************************************
 *                                            *
 *  This section enables UI elements to work  *
 *  by attaching event listeners, such as     *
 *  switching hooks, layouts, and sharing     *
 *  tabs, etc.                                *
 *                                            *
 **********************************************/

//switch between layouts
changeLayoutButton.addEventListener("click", () => {
  layoutType = layoutType == "message" ? "embed" : "message";
  loadFieldData();
  updateSendButton();
  updateLayout();
});

//switch between hooks
prevHookButton.addEventListener("click", () => {
  updateHookData(--selectedHook.index);
});
nextHookButton.addEventListener("click", () => {
  updateHookData(++selectedHook.index);
});

//share browser tabs
const shareCurrentTabButton = document.getElementById("shareCurrentTabButton");
const shareAllTabButton = document.getElementById("shareAllTabButton");
shareCurrentTabButton.addEventListener("click", async () => {
  const currTab = await chrome.runtime.sendMessage({ message: "currentTab" });
  const tabUrl = currTab.url;

  allEmbedFields[4].value = tabUrl;

  if (layoutType === "message") {
    messageBox.value += tabUrl + "\n";
    saveText("message", messageBox.value);
  } else if (layoutType === "embed") {
    allEmbedFields[4].value = tabUrl;
    saveText(allEmbedFields[4].name, allEmbedFields[4].value);
  }

  updateSendButton();
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
});

//open settings
const settingButton = document.getElementById("settingButton");
settingButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

//clear button
const clearFieldButton = [...document.getElementsByClassName("clearFieldButton")];
clearFieldButton.forEach((btn) => btn.addEventListener("click", clearField));

/**********************************************
 *                                             *
 *  This section makes input fields responsive *
 *  like updating send button state,           *
 *  saving data when typing, or making embeds. *
 *                                             *
 **********************************************/

//updating send button while typing
messageBox.addEventListener("input", () => {
  saveText("message", messageBox.value.trim());
  updateSendButton();
});
allEmbedFields.forEach((field) => {
  field.addEventListener("input", () => {
    saveText(field.name, field.value.trim());
    updateSendButton();
  });
});

/**********************************************
 *                                             *
 *  This section contains methods for sending  *
 *  messages and embeds into specific Discord  *
 *  channels, as well as handling errors       *
 *  during the sending process.                *
 *                                             *
 **********************************************/

function sendEmbed(embed) {
  embed = createEmbed(embed);
  sendRequest({ embeds: [embed] });
}
function sendMessage(message) {
  sendRequest({ content: message });
}
function sendRequest(requestBody) {
  if (requestBody.content.trim() .length<= 0 || requestBody.content.trim() .length > 1900) {
    notify("Message cannot be too short or long.", "warn");
    return;
  }

  //clear text and disable send button
  clearField();
  loadFieldData();
  updateSendButton();

  fetch(selectedHook.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      notify(`Successfully sent to ${selectedHook.name}`, "success");
    })
    .catch((error) => {
      notify("An error occurred.", "error");
      console.error(error);
    })
    .finally(() => {
      updateState();
    });
}

//sending a message
sendMessageButton.addEventListener("click", () => {
  sendMessage(messageBox.value.trim());
});

//adding a shortcut
messageBox.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && sendMessageButton.disabled == false) {
    sendMessage(messageBox.value.trim());
  }
});

//sending an embed
embedArea.addEventListener("submit", (event) => {
  event.preventDefault();
  let embed = {};
  allEmbedFields.forEach((el) => (embed[el.name] = el.value.trim()));
  sendEmbed(embed);
});

function init() {
  updateState();
}
init();

// IMPORTANT: Since loadFieldData() operates asynchronously and
// doesn't maintain a strict order, the updateSendButton() function
// is invoked again. This behavior arises because,
// during the initial page load, there exists a brief interval
// where the fields are momentarily empty.
setTimeout(() => {
  updateSendButton();
}, 100);
