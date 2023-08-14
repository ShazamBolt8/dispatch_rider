// global references
const webhookName = document.getElementById("webhookName");
const webhookUrl = document.getElementById("webhookUrl");
const addWebhook = document.getElementById("addWebhook");
const hooksList = document.getElementById("hooksList");

//chrome storage
const storage = chrome.storage.sync;

// Copied functions that need to be in utils.js
// ### UTILS ###
function getWebhooksFromStorage(callback) {
  storage.get(["webhook"], ({ webhook }) => {
    const webhooks = webhook || [];
    callback(webhooks);
  });
}

function updateHooksList() {
  //clearing the list
  hooksList.innerHTML = "";

  getWebhooksFromStorage(webhooks => {
    if (webhooks.length > 0) {
      webhooks.forEach(wb => {
        const hookCard = document.createElement("details");
        hookCard.className = "hookCard"; // css styles to make it card like item

        // creating card summary (tile and delete button)
        const summary = document.createElement("summary");
        const title = document.createElement("span");
        title.innerText = wb.name;

        // creating delete button
        const deleteButton = document.createElement("button");
        deleteButton.innerText = "Delete";
        deleteButton.classList.add("btn", "btn-danger");
        deleteButton.addEventListener("click", () => {
          webhooks.splice(webhooks.indexOf(wb), 1);
          storage.set({ webhook: webhooks });
          updateHooksList();
        });

        // creating edit button
        const editButton = document.createElement("button");
        editButton.innerText = "Edit";
        editButton.classList.add("btn", "btn-primary");
        editButton.addEventListener("click", () => {});

        // adding to summary
        summary.appendChild(title);
        summary.appendChild(deleteButton);

        // creating card content
        const content = document.createElement("p");
        content.innerText = `${wb.url}`;

        // adding to hookCard
        hookCard.appendChild(summary);
        hookCard.appendChild(content);

        // finally appending to hooksList
        hooksList.appendChild(hookCard);
      });
    } else {
      hooksList.innerText = "No webhook is set.";
    }
  });
}

//TODO - define notify function for options page

// ### ATTACHING LISTNERS ###
addWebhook.addEventListener("click", () => {
  const trimmedHookName = webhookName.value.trim();
  const trimmedHookUrl = webhookUrl.value.trim();

  if (trimmedHookName.length === 0 || trimmedHookUrl.length === 0) {
    //TODO - notify
    // notify("Webhook name and URL are required.", "warn");
    return;
  }

  getWebhooksFromStorage(webhooks => {
    //proceeding to add
    webhooks.push({ name: trimmedHookName, url: trimmedHookUrl });
    storage.set({ webhook: webhooks });
    //TODO - notify
    // notify("Webhook added successfully.", "success");

    // clearing input fields
    webhookName.value = webhookUrl.value = "";
    updateHooksList();
  });
});

// ### INIT ###
updateHooksList();
