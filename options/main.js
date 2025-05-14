import {
  setWebhookToStorage,
  getWebhooksFromStorage,
  setCurrentHook,
  reinsertWebhooksToStorage,
  themes,
  getTheme,
  applyTheme,
  saveTheme,
  loadAndApplyTheme,
  capitalize,
} from "../src/utils.js";

const webhookNameField = document.getElementById("webhookNameField");
const webhookUrlField = document.getElementById("webhookUrlField");
const addWebhook = document.getElementById("addWebhook");
const hooksList = document.getElementById("hooksList");

const exportButton = document.getElementById("exportButton");
const importButton = document.getElementById("importButton");
const toggleTheme = document.getElementById("toggleTheme");

async function returnHookElement(name, url, index) {
  let hookContainer = document.createElement("div");
  hookContainer.className = "hookContainer";

  let hookName = document.createElement("span");
  hookName.innerText = name;
  hookName.className = "name";

  let hookUrl = document.createElement("span");
  hookUrl.innerText = url;
  hookUrl.className = "url";

  let deleteButton = document.createElement("button");
  deleteButton.className = "dangerButton";
  deleteButton.setAttribute("data-index", index);
  deleteButton.addEventListener("click", async (e) => {
    await deleteHook(e.target);
  });

  let deleteIcon = document.createElement("object");
  deleteIcon.type = "image/svg+xml";
  deleteIcon.data = "../assets/delete.svg";
  deleteButton.append(deleteIcon);

  hookContainer.append(hookName, hookUrl, deleteButton);
  return hookContainer;
}

async function createList() {
  hooksList.innerHTML = "";
  const hooks = await getWebhooksFromStorage();
  for (let index = 0; index < hooks.length; index++) {
    const hook = hooks[index];
    hooksList.append(await returnHookElement(hook.name, hook.url, index));
  }
}

async function updateExportButton() {
  const webhooks = await getWebhooksFromStorage();
  exportButton.disabled = !webhooks.length;
}

function updateAddButton() {
  addWebhook.disabled = !webhookNameField.value.trim() || !webhookUrlField.value.trim();
  addWebhook.style.cursor = addWebhook.disabled ? "not-allowed" : "pointer";
}

async function updateState() {
  await createList();
  await updateExportButton();
  updateAddButton();
}

async function createNewHook(hookName, hookUrl) {
  if (!hookName.trim() || !hookUrl.trim()) {
    return updateAddButton();
  }
  await setWebhookToStorage({ name: hookName, url: hookUrl });
  webhookNameField.value = webhookUrlField.value = "";
  let newHookElement = await returnHookElement(hookName, hookUrl, hooksList.children.length);
  hooksList.append(newHookElement);
  await updateExportButton();
}

async function deleteHook(element) {
  let index = parseInt(element.getAttribute("data-index"));
  if (isNaN(index)) return;

  let hooks = await getWebhooksFromStorage();
  hooks.splice(index, 1);
  await reinsertWebhooksToStorage(hooks);

  setCurrentHook(); // set selection to the first hook

  hooksList.removeChild(hooksList.children[index]);

  //reset indices
  [...hooksList.children].forEach((el, i) => {
    const btn = el.querySelector(".dangerButton");
    btn.setAttribute("data-index", i);
  });

  await updateExportButton();
}

webhookNameField.addEventListener("input", updateAddButton);
webhookUrlField.addEventListener("input", updateAddButton);
webhookNameField.addEventListener("change", updateAddButton);
webhookUrlField.addEventListener("change", updateAddButton);

addWebhook.addEventListener("click", async () => {
  await createNewHook(webhookNameField.value, webhookUrlField.value);
});

exportButton.addEventListener("click", async (el) => {
  const webhooks = await getWebhooksFromStorage();
  navigator.clipboard.writeText(JSON.stringify(webhooks, null, 4));
  exportButton.children[0].innerText = "Copied!";
  exportButton.children[1].data = "../assets/copy.svg";
  exportButton.disabled = true;
  setTimeout(() => {
    exportButton.children[0].innerText = "Export Webhooks";
    exportButton.children[1].data = "../assets/export.svg";
    exportButton.disabled = false;
  }, 2000);
});

importButton.addEventListener("click", async () => {
  const data = await navigator.clipboard.readText();
  const webhooks = await getWebhooksFromStorage();
  try {
    const parsed = JSON.parse(data);
    webhooks.push(...parsed);
    await reinsertWebhooksToStorage(webhooks);
    importButton.children[0].innerText = "Imported!";
    importButton.children[1].data = "../assets/check.svg";
    await updateState();
  } catch (e) {
    importButton.children[0].innerText = "Invalid Data!";
    importButton.children[1].data = "../assets/cross.svg";
  }
  setTimeout(() => {
    importButton.children[0].innerText = "Import Webhooks";
    importButton.children[1].data = "../assets/import.svg";
  }, 2000);
});

toggleTheme.addEventListener("click", async (e) => {
  const themeNames = Object.keys(themes);
  const currentTheme = await getTheme();
  const currentIndex = themeNames.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % themeNames.length;
  const nextTheme = themeNames[nextIndex];
  console.log(nextTheme);
  applyTheme(nextTheme);
  saveTheme(nextTheme);
  e.target.innerText = `Theme: ${capitalize(nextTheme)}`;
});

await updateState();
toggleTheme.innerText = `Theme: ${capitalize(await loadAndApplyTheme(themes))}`;
