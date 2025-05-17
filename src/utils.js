function getWebhooksFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["webhook"], ({ webhook }) => {
      const webhooks = webhook || [];
      resolve(webhooks);
    });
  });
}

async function setWebhookToStorage(webhook) {
  let webhooks = await getWebhooksFromStorage();
  webhooks.push(webhook);
  chrome.storage.sync.set({ webhook: webhooks });
}

function setCurrentHook(hookData = {}) {
  const currentHook = {
    index: Number(hookData.index) || 0,
    name: hookData.name || "",
    url: hookData.url || "",
  };
  chrome.storage.sync.set({ currentHook });
}

function getCurrentHook() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["currentHook"], ({ currentHook }) => {
      resolve(currentHook || { index: 0, name: "", url: "" });
    });
  });
}

function setCurrentLayout(layout = "message") {
  chrome.storage.session.set({ currentLayout: layout });
}

function getCurrentLayout() {
  return new Promise((resolve) => {
    chrome.storage.session.get(["currentLayout"], ({ currentLayout }) => {
      resolve(currentLayout || "message");
    });
  });
}

function createEmbed(data) {
  const { title, description, author_name, footer, url, thumbnail, author_icon_url, color } = data;
  const embed = {
    title: title || "No Title",
    description: description || "No Description",
    color: color || 0xbf7c00,
    footer: footer
      ? {
          text: footer,
        }
      : undefined,
    url: url || undefined,
    thumbnail: thumbnail
      ? {
          url: thumbnail,
        }
      : undefined,
  };

  if (author_name) {
    embed.author = {
      name: author_name,
      icon_url: author_icon_url || undefined,
    };
  }
  return embed;
}

function saveText(key, value) {
  const data = {};
  data[key] = value;
  chrome.storage.session.set(data);
}

function loadText(key) {
  return new Promise((resolve) => {
    chrome.storage.session.get([key], (result) => {
      const value = result[key];
      resolve(value);
    });
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export {
  getWebhooksFromStorage,
  setWebhookToStorage,
  createEmbed,
  saveText,
  loadText,
  setCurrentHook,
  getCurrentHook,
  getCurrentLayout,
  setCurrentLayout,
  capitalize,
};
