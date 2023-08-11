//these are used to add new hooks
const webhookName = document.getElementById('webhookName');
const webhookUrl = document.getElementById('webhookUrl');
const addWebhook = document.getElementById('addWebhook');

//these are used to share webhooks
const shareCurrentHook = document.getElementById('shareCurrentHook');
const shareAllHook = document.getElementById('shareAllHook');

//these are used to toggle between webhooks
const prevHook = document.getElementById('prevHook');
const currentHook = document.getElementById('currentHook'); //merely an html element
const nextHook = document.getElementById('nextHook');
let currentIndex = 0; //currrent iteration of webhook array from storage
let numberOfHook = 0;
let selectedHook = {}; //stores data about currently selected webhook from storage

//it is the main messaging area
const messageBox = document.getElementById('messageBox');
const sendMessageButton = document.getElementById('sendMessage');

//chrome storage
const storage = chrome.storage.sync;

//types: success, warn, error
function notify(message = 'Message sent successfully.', type = 'success') {
  const notification = document.getElementById('notification');
  notification.innerText = message;
  switch (type) {
    case 'warn':
      notification.classList.add('warn');
      break;
    case 'error':
      notification.classList.add('error');
      break;
    default:
      notification.classList.add('success');
      break;
  }
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
    //clear previous records
    notification.classList.remove('warn');
    notification.classList.remove('error');
    notification.classList.remove('success');
  }, 2000);
}

//Gets webhooks from storage
function getWebhooksFromStorage(callback) {
  storage.get(['webhook'], ({ webhook }) => {
    webhook = webhook || []; //if null, be empty array []
    callback(webhook);
  });
}

//Whether the send button should be disabled or not depending on certain factors
function updateSendMessageButton() {
  getWebhooksFromStorage((webhook) => {
    if (webhook.length > 0 && messageBox.value.length > 0) {
      sendMessageButton.disabled = false;
    } else {
      sendMessageButton.disabled = true;
    }
  });
}

//updates the current hook's name
function updateCurrentHook() {
  getWebhooksFromStorage((webhook) => {
    if (webhook.length > 0) {
      if (!selectedHook.name) {
        selectedHook.name = webhook[0].name;
        selectedHook.url = webhook[0].url;
      }
      currentHook.innerText = selectedHook.name;
      numberOfHook = webhook.length;
      prevHook.disabled = false;
      nextHook.disabled = false;
      shareCurrentHook.disabled = false;
      shareAllHook.disabled = false;
    } else {
      currentHook.innerText = 'No webhook is set.';
      prevHook.disabled = true;
      nextHook.disabled = true;
      shareCurrentHook.disabled = true;
      shareAllHook.disabled = true;
    }
  });
}

//updates the send button and the current hook data
function updateState() {
  updateSendMessageButton();
  updateCurrentHook();
}

function sendMessage(message) {
  if (message.length <= 0) {
    notify('Message cannot be empty.', 'error');
    return false;
  }
  fetch(selectedHook.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: message,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(response.status);
        throw new Error(response.statusText);
        notify('Error Occured: ' + response.status, 'error');
      }
      notify(`Message sent to ${selectedHook.name} successfully.`, 'success');
      messageBox.value = '';
    })
    .catch((error) => {
      notify('An error occurred:', error.message, 'error');
      console.error('An error occurred:', error.message);
    });
  updateState();
}

//this part adds new webhooks
addWebhook.addEventListener('click', () => {
  const trimmedHookName = webhookName.value.trim();
  const trimmedHookUrl = webhookUrl.value.trim();
  //if the webhook values in input fields are empty or not
  if (trimmedHookName.length == 0 || trimmedHookUrl.length == 0) {
    notify('Webhook name and url are required.', 'warn');
    return false;
  }
  getWebhooksFromStorage((webhook) => {
    //proceed to insert and notify
    webhook.push({ name: trimmedHookName, url: trimmedHookUrl });
    storage.set({ webhook });
    notify('Webhook added successfully.', 'success');
    webhookName.value = webhookUrl.value = '';
    //update ui state to reflect changes
    updateState();
  });
});

//it is used to toggle currently selected webhook
function toggleWebhookData(index) {
  console.log(index);
  getWebhooksFromStorage((webhook) => {
    currentHook.innerText = webhook[index].name;
    selectedHook.name = webhook[index].name;
    selectedHook.url = webhook[index].url;
  });
}
//related to above function
prevHook.addEventListener('click', () => {
  if (currentIndex > 0) {
    toggleWebhookData(--currentIndex);
  }
});
//same as above but opposite
nextHook.addEventListener('click', () => {
  if (currentIndex < numberOfHook - 1) {
    toggleWebhookData(++currentIndex);
  }
});

//see if messageBox is empty and update the send button accordingly
messageBox.addEventListener('input', () => {
  updateSendMessageButton();
});
//this part makes sending work
sendMessageButton.addEventListener('click', () => {
  sendMessage(messageBox.value);
});

//function that runs when page loads
function init() {
  updateState();
}

init();
