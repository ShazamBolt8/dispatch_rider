import {
  storage,
  getWebhooksFromStorage,
  setCurrentHook,
} from "../src/utils.js";

// global references
const webhookNameField = document.getElementById("webhookNameField");
const webhookUrlField = document.getElementById("webhookUrlField");
const addWebhook = document.getElementById("addWebhook");
const hooksList = document.getElementById("hooksList");

function createHookElement(name, url, index) {
  let hookContainer = document.createElement("div");
  hookContainer.className = "flex_noWrap hookContainer";

  let hookName = document.createElement("span");
  hookName.innerText = name;
  hookName.className = "name";

  let hookUrl = document.createElement("span");
  hookUrl.innerText = url;
  hookUrl.className = "url";

  let deleteButton = document.createElement("span");
  deleteButton.className = "delete";
  deleteButton.setAttribute("data-index", index);
  deleteButton.addEventListener("click", (e) => {
    deleteHook(e.target);
  });

  let deleteIcon = document.createElement("object");
  deleteIcon.type = "image/svg+xml";
  deleteIcon.data = "../assets/delete.svg";

  deleteButton.append(deleteIcon);
  hookContainer.append(hookName, hookUrl, deleteButton);
  hooksList.append(hookContainer);
}

function updateList() {
  hooksList.innerHTML = "";
  getWebhooksFromStorage((webhooks) => {
    webhooks
      .slice() //NOTE: slice() is used to create a shallow copy because reverse() modifies original array
      .reverse()
      .forEach((webhook, index) => {
        createHookElement(
          webhook.name,
          webhook.url,
          webhooks.length - 1 - index
        ); //because its reversed
      });
  });
}

function updateAddButton() {
  if (
    webhookNameField.value.trim().length == 0 ||
    webhookUrlField.value.trim().length == 0
  ) {
    addWebhook.disabled = true;
  } else {
    addWebhook.disabled = false;
  }
}

function updateState() {
  updateList();
  updateAddButton();
}

function createNewHook(hookName, hookUrl) {
  if (hookName.trim().length == 0 || hookUrl.trim().length == 0) {
    updateAddButton();
  }
  getWebhooksFromStorage((hooks) => {
    const newHook = { name: hookName, url: hookUrl };
    hooks.push(newHook);
    storage.set({ webhook: hooks });
    webhookNameField.value = webhookUrlField.value = "";
    updateState();
  });
}

//the delete button itself is parameter
function deleteHook(element) {
  let index = element.getAttribute("data-index");
  if (!index) return;
  getWebhooksFromStorage((webhooks) => {
    webhooks.splice(index, 1);
    setCurrentHook(); //set index back to 0
    storage.set({ webhook: webhooks });
    updateList();
  });
}

webhookNameField.addEventListener("input", updateAddButton);
webhookUrlField.addEventListener("input", updateAddButton);
webhookNameField.addEventListener("change", updateAddButton);
webhookUrlField.addEventListener("change", updateAddButton);
addWebhook.addEventListener("click", () => {
  createNewHook(webhookNameField.value, webhookUrlField.value);
});

updateState();
