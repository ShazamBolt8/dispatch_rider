//chrome storage
const storage = chrome.storage.sync;

//getting all hooks
function getWebhooksFromStorage(callback) {
  storage.get(["webhook"], ({ webhook }) => {
    const webhooks = webhook || [];
    callback(webhooks);
  });
}

//creating an embed
function createEmbed(title, description, authorname, footer, url, thumbnailurl, authoravatarurl, color) {
  const embed = {
    title: title,
    description: description,
    color: color ? color : 0xbf7c00,
    author: {
      name: authorname,
    },
  };
  if (footer) {
    embed.footer = {
      text: footer,
    };
  }
  if (url) {
    embed.url = url;
  }
  if (thumbnailurl) {
    embed.thumbnail = {
      url: thumbnailurl,
    };
  }
  if (authoravatarurl) {
    embed.author.icon_url = authoravatarurl;
  }
  return embed;
}


export { storage, getWebhooksFromStorage, createEmbed};