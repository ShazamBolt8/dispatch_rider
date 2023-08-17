//chrome storage
const storage = chrome.storage.sync;
const cache = chrome.storage.session;

//getting all hooks
function getWebhooksFromStorage(callback) {
  storage.get(["webhook"], ({ webhook }) => {
    const webhooks = webhook || [];
    callback(webhooks);
  });
}

//creating an embed
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
  const data = {}; //this allows strings to be passed as keys
  data[key] = value;
  cache.set(data);
}

function loadText(key, callback) {
  cache.get([key], (result) => {
    const value = result[key];
    callback(value);
  });
}

export { storage, getWebhooksFromStorage, createEmbed, saveText, loadText, cache };
