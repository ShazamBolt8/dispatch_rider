// Global References
const form = document.querySelector("form");
const textarea = document.querySelector("#textarea");
const webhooksSelection = document.querySelector("#webhooksSelection");
const addWebhooksBtn = document.querySelector("#addWebhooksBtn");
const webhookName = document.querySelector("#webhookName");
const webhookUrl = document.querySelector("#webhookUrl");

// Using chrome.storage to load the values
chrome.storage.sync.get(["data"], ({ data }) => {
  console.log(data, "data");
  console.log(data.txt, "txt");

  if (data.webhooks)
    data.webhooks.forEach((wb) => {
      webhooksSelection.appendChild(new Option(wb.name, wb.url));
    });

  if (data.txt) {
    textarea.innerHTML = data.txt;
  }
});

// Event Listners

textarea.addEventListener("input", () => {
  chrome.storage.sync.set({ data: { txt: textarea.value } });
});

addWebhooksBtn.addEventListener("click", () => {
  chrome.storage.sync.get(["data"], ({ data }) => {
    // setting an empty array if it doesn't exist
    if (!data.webhooks) data.webhooks = [];
    // changing the webhooks array
    data.webhooks?.push({
      name: webhookName.value,
      url: webhookUrl.value,
    });
    // setting the data
    chrome.storage.sync.set({ data });
    // updating webhooksSelection menu
    webhooksSelection.appendChild(
      new Option(webhookName.value, webhookUrl.value)
    );
  });
});

// Form code

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const webhookUrl = webhooksSelection.value;
  const message = textarea.value;
  const status = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: message,
    }),
  });
  console.log(status);
});
