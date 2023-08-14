import { storage, getWebhooksFromStorage, createEmbed } from "../src/utils.js";

//defaults
let numberOfHook = 0;
let selectedHook = { index: 0, name: null, url: null };
let layoutType = "message"; //message || embed

//extra options
const setting = document.getElementById("setting");
const shareCurrentTab = document.getElementById("shareCurrentTab");
const shareAllTab = document.getElementById("shareAllTab");

//for navigation between webhooks
const prevHook = document.getElementById("prevHook");
const currentHook = document.getElementById("currentHook");
const nextHook = document.getElementById("nextHook");

//main messaging area
const messageArea = document.getElementById("messageArea");
const messageBox = document.getElementById("messageBox");
const sendMessageButton = document.getElementById("sendMessage");

//embed area
const embedArea = document.getElementById("embedArea");
const sendEmbedButton = document.getElementById("sendEmbed");
const embedNameField = document.getElementById("embedNameField");
const embedAvatarField = document.getElementById("embedAvatarField");
const embedTitleField = document.getElementById("embedTitleField");
const embedDescriptionField = document.getElementById("embedDescriptionField");
const embedURLField = document.getElementById("embedURLField");
const embedThumbnailField = document.getElementById("embedThumbnailField");
const embedFooterField = document.getElementById("embedFooterField");

//for changing layout
const changeLayout = document.getElementById("changeLayout");
const changeLayoutIcon = document.getElementById("changeLayoutIcon");
const changeLayoutText = document.getElementById("changeLayoutText");

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

//to loop over input fields of embed form with required attribute set
function loopOverRequiredFormFields(callback) {
  const requiredFields = embedArea.querySelectorAll("[required]");
  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    callback(field);
  }
}

//to update accessibility of send button based on certain factors
function updateSendButton() {
  getWebhooksFromStorage((webhooks) => {
    //for message
    const messageNotEmpty = messageBox.value.trim().length > 0;
    sendMessageButton.disabled = !(webhooks.length > 0 && messageNotEmpty);
    //for embed
    let isFieldEmpty = false;
    loopOverRequiredFormFields((el) => {
      if (el.value.trim().length == 0) {
        isFieldEmpty = true;
        return;
      }
    });
    sendEmbedButton.disabled = !(webhooks.length > 0 && !isFieldEmpty);
  });
}

//to hide or show message or embed area
function updateLayoutType() {
  if (layoutType == "message") {
    messageArea.style.display = "flex";
    embedArea.style.display = "none";
    changeLayoutText.innerText = "Send Embed";
    changeLayoutIcon.setAttribute("data", "/assets/send_embed.svg");
    document.body.style.height = "500px";
  } else if (layoutType == "embed") {
    embedArea.style.display = "flex";
    messageArea.style.display = "none";
    changeLayoutText.innerText = "Send Message";
    changeLayoutIcon.setAttribute("data", "/assets/send_message.svg");
    document.body.style.height = "600px";
  }
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
    } else {
      currentHook.innerText = "No webhook is set.";
      prevHook.disabled = true;
      nextHook.disabled = true;
    }
  });
}

function clearField() {
  if (layoutType == "message") {
    messageBox.value = "";
  } else {
    embedArea.querySelectorAll('input[type="text"]').forEach((field) => {
      field.value = "";
    });
    embedDescriptionField.value = "";
  }
}

//to update whole UI
function updateState() {
  updateCurrentHook();
  updateLayoutType();
  updateSendButton();
}

//methods for sending messages and embeds
function sendMessage(message) {
  if (message.length <= 0 || message.length > 1900) {
    notify("Message cannot be empty or too long.", "error");
    return;
  }
  sendRequest({ content: message });
}
function sendEmbed(embed) {
  sendRequest({ embeds: [embed] });
}
function sendRequest(requestBody) {
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
      clearField();
    })
    .catch((error) => {
      notify("An error occurred: " + error.statusText, "error");
      console.error("An error occurred:", error.message);
    })
    .finally(() => {
      updateState();
    });
  console.log(JSON.stringify(requestBody));
}

//open settings
setting.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

//changing layout
changeLayout.addEventListener("click", () => {
  if (layoutType == "message") {
    layoutType = "embed";
  } else if (layoutType == "embed") {
    layoutType = "message";
  }
  updateLayoutType();
});

//share only current tab
shareCurrentTab.addEventListener("click", async () => {
  const currTab = await chrome.runtime.sendMessage({ message: "currentTab" });
  let tab = `${currTab.url}\n`;
  layoutType == "message" ? (messageBox.value += tab) : (embedURLField.value = tab);
  updateSendButton();
});

//share all tabs
shareAllTab.addEventListener("click", async () => {
  const allTabs = await chrome.runtime.sendMessage({ message: "allTab" });
  const tab = allTabs.map((tab) => tab.url).join("\n") + "\n";
  layoutType == "message" ? (messageBox.value += tab) : (embedDescriptionField.value += tab);
  updateSendButton();
});

//toggling between hooks work
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

//making input fields responsive
messageBox.addEventListener("input", updateSendButton);
messageBox.addEventListener("change", updateSendButton);
loopOverRequiredFormFields((el) => {
  el.addEventListener("input", updateSendButton);
});
loopOverRequiredFormFields((el) => {
  el.addEventListener("change", updateSendButton);
});

//making send buttons work
sendMessageButton.addEventListener("click", () => {
  sendMessage(messageBox.value);
});
embedArea.addEventListener("submit", (e) => {
  e.preventDefault();
  sendEmbed(createEmbed(embedTitleField.value, embedDescriptionField.value, embedNameField.value, embedFooterField.value, embedURLField.value, embedThumbnailField.value, embedAvatarField.value));
});

function init() {
  updateState();
}

init();
