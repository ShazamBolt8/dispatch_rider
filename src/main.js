//for adding new hooks
const webhookName = document.getElementById('webhookName');
const webhookUrl = document.getElementById('webhookUrl');
const addWebhook = document.getElementById('addWebhook');

//for sharing webhooks
const shareCurrentHook = document.getElementById('shareCurrentHook');
const shareAllHook = document.getElementById('shareAllHook');

//for toggling between webhooks
const prevHook = document.getElementById('prevHook');
const currentHook = document.getElementById('currentHook');
const nextHook = document.getElementById('nextHook');
let currentIndex = 0;
let numberOfHook = 0;
let selectedHook = {};

//main messaging area
const messageBox = document.getElementById('messageBox');
const sendMessageButton = document.getElementById('sendMessage');

//chrome storage
const storage = chrome.storage.sync;

// types: success, warn, error
function notify(message = 'Message sent successfully.', type = 'success') {
  const notification = document.getElementById('notification');
  notification.innerText = message;
  notification.className = type; // Use className for cleaner class assignment
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
    notification.className = ''; // Clear classes
  }, 2000);
}

function getWebhooksFromStorage(callback) {
  storage.get(['webhook'], ({ webhook }) => {
    const webhooks = webhook || [];
    callback(webhooks);
  });
}

//to update accessibility of send button based on certain factors
function updateSendMessageButton() {
  getWebhooksFromStorage((webhooks) => {
    sendMessageButton.disabled = !( webhooks.length > 0 && messageBox.value.length > 0 );
  });
}

//to update toggle menu
function updateCurrentHook() {
  getWebhooksFromStorage((webhooks) => {
    if (webhooks.length > 0) {
      if (!selectedHook.name) {
        selectedHook.name = webhooks[0].name;
        selectedHook.url = webhooks[0].url;
      }
      currentHook.innerText = selectedHook.name;
      numberOfHook = webhooks.length;
      prevHook.disabled = currentIndex === 0;
      nextHook.disabled = currentIndex === numberOfHook - 1;
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

//to update both
function updateState() {
  updateSendMessageButton();
  updateCurrentHook();
}

function sendMessage(message) {
  if (message.length <= 0) {
    notify('Message cannot be empty.', 'error');
    return;
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
        throw new Error(response.statusText);
      }
      notify(`Message sent to ${selectedHook.name} successfully.`, 'success');
      messageBox.value = '';
    })
    .catch((error) => {
      notify('An error occurred: ' + error.message, 'error');
      console.error('An error occurred:', error.message);
    })
    .finally(() => {
      updateState();
    });
}

//adding the webhooks
addWebhook.addEventListener('click', () => {
  const trimmedHookName = webhookName.value.trim();
  const trimmedHookUrl = webhookUrl.value.trim();

  if (trimmedHookName.length === 0 || trimmedHookUrl.length === 0) {
    notify('Webhook name and URL are required.', 'warn');
    return;
  }

  getWebhooksFromStorage((webhooks) => {
    //proceeding to add
    webhooks.push({ name: trimmedHookName, url: trimmedHookUrl });
    storage.set({ webhook: webhooks });
    notify('Webhook added successfully.', 'success');
    webhookName.value = webhookUrl.value = '';
    updateState();
  });
});

//sharing current one
shareCurrentHook.addEventListener('click', () => {
  const shareData = {
    title: selectedHook.name,
    text: 'Check out this webhook: ' + selectedHook.url,
    url: selectedHook.url,
  };
  navigator
    .share(shareData)
    .then(() => {
      notify('Shared successfully');
    })
    .catch((error) => {
      notify('Error sharing: ' + error, 'error');
    });
});

//sharing all hooks
shareAllHook.addEventListener('click', () => {
  getWebhooksFromStorage((webhooks) => {
    const urlList = webhooks.map((wb) => wb.url).join('\n');
    const shareData = {
      title: 'All Webhooks',
      text: urlList,
      url: urlList,
    };
    navigator
      .share(shareData)
      .then(() => {
        notify('Shared successfully');
      })
      .catch((error) => {
        notify('Error sharing: ' + error, 'error');
      });
  });
});

//fot toggling
function toggleWebhookData(index) {
  getWebhooksFromStorage((webhooks) => {
    const webhook = webhooks[index];
    currentHook.innerText = webhook.name;
    selectedHook.name = webhook.name;
    selectedHook.url = webhook.url;
  });
}

prevHook.addEventListener('click', () => {
  if (currentIndex > 0) {
    toggleWebhookData(--currentIndex);
  }
});

nextHook.addEventListener('click', () => {
  if (currentIndex < numberOfHook - 1) {
    toggleWebhookData(++currentIndex);
  }
});

messageBox.addEventListener('input', updateSendMessageButton);

sendMessageButton.addEventListener('click', () => {
  sendMessage(messageBox.value);
});

function init() {
  updateState();
}

init();
