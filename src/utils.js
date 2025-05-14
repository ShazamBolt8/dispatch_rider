/**
 * NOTE - Make most of these functiosn async
 */

//chrome storage
const storage = chrome.storage.sync;
const cache = chrome.storage.session;

function getWebhooksFromStorage() {
  return new Promise((resolve) => {
    storage.get(["webhook"], ({ webhook }) => {
      const webhooks = webhook || [];
      resolve(webhooks);
    });
  });
}

async function setWebhookToStorage(webhook) {
  let webhooks = await getWebhooksFromStorage();
  webhooks.push(webhook);
  storage.set({ webhook: webhooks });
}

async function reinsertWebhooksToStorage(webhooks) {
  storage.set({ webhook: webhooks });
}

function setCurrentHook(hook = { index: 0, name: "", url: "" }) {
  cache.set({ currentHook: hook });
}

function getCurrentHook() {
  return new Promise((resolve) => {
    cache.get(["currentHook"], ({ currentHook }) => {
      resolve(currentHook || { index: 0, name: "", url: "" });
    });
  });
}

function getCurrentLayout() {
  return new Promise((resolve) => {
    cache.get(["currentLayout"], ({ currentLayout }) => {
      resolve(currentLayout || "message");
    });
  });
}

function setCurrentLayout(layout = "message") {
  cache.set({ currentLayout: layout });
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

const ashStyle = {
  "--background": "#43454a",
  "--secondary-background": "#36393e",
  "--danger": "#da373c",
  "--danger-hover": "#a12828",
  "--danger-active": "#8f2022",
  "--btn-primary": "#5766f2",
  "--btn-primary-hover": "#4b5beb",
  "--btn-primary-active": "#3242cf",
  "--btn-primary-disabled": "#7885ff",
  "--btn-secondary": "#292b30",
  "--btn-secondary-hover": "#202225",
  "--btn-secondary-active": "#0b0c0e",
  "--btn-secondary-disabled": "#36393e",
  "--input": "#292b30",
  "--input-hover": "#212226",
  "--input-focus": "#0b0c10",
  "--list-even": "#202225",
  "--list-odd": "#282b30",
  "--list-hover": "#0b0c0e",
  "--success": "#06a151",
  "--error": "#eb2433",
  "--placeholder": "#6d6c76",
};

const darkStyle = {
  "--background": "#1a1a1e",
  "--secondary-background": "#121214",
  "--danger": "#e83c4f",
  "--danger-hover": "#a12828",
  "--danger-active": "#8f2022",
  "--btn-primary": "#6d54ef",
  "--btn-primary-hover": "#5748be",
  "--btn-primary-active": "#493ea1",
  "--btn-primary-disabled": "#504996",
  "--btn-secondary": "#29292d",
  "--btn-secondary-hover": "#333338",
  "--btn-secondary-active": "#2a2a30",
  "--btn-secondary-disabled": "#393a3f",
  "--input": "#222327",
  "--input-hover": "#222327",
  "--input-focus": "#222327",
  "--list-even": "#343639",
  "--list-odd": "#2b2e31",
  "--list-hover": "#0b0c0e",
  "--success": "#06a151",
  "--error": "#eb2433",
  "--placeholder": "#56565e",
};

const onyxStyle = {
  "--background": "#070709",
  "--secondary-background": "#121214",
  "--danger": "#e83c4f",
  "--danger-hover": "#a12828",
  "--danger-active": "#8f2022",
  "--btn-primary": "#6d54ef",
  "--btn-primary-hover": "#5748be",
  "--btn-primary-active": "#493ea1",
  "--btn-primary-disabled": "#504996",
  "--btn-secondary": "#18181b",
  "--btn-secondary-hover": "#242427",
  "--btn-secondary-active": "#2a2a30",
  "--btn-secondary-disabled": "#121213",
  "--input": "#131416",
  "--input-hover": "#131416",
  "--input-focus": "#131416",
  "--list-even": "#343639",
  "--list-odd": "#2b2e31",
  "--list-hover": "#0b0c0e",
  "--success": "#06a151",
  "--error": "#eb2433",
  "--placeholder": "#56565e",
};

const themes = {
  ash: ashStyle,
  dark: darkStyle,
  onyx: onyxStyle,
};

function getTheme() {
  return new Promise((resolve) => {
    cache.get(["theme"], (theme) => {
      resolve(theme?.theme || "ash");
    });
  });
}

function applyTheme(themeName) {
  const theme = themes[themeName];
  if (!theme) return;
  for (const [key, value] of Object.entries(theme)) {
    document.documentElement.style.setProperty(key, value);
  }
}

function saveTheme(themeName) {
  cache.set({ theme: themeName });
}
async function loadAndApplyTheme(themes) {
  const themeNames = Object.keys(themes);
  const currentTheme = await getTheme();
  applyTheme(currentTheme);
  return currentTheme;
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
  reinsertWebhooksToStorage,
  themes,
  getTheme,
  applyTheme,
  saveTheme,
  loadAndApplyTheme,
  capitalize,
};
