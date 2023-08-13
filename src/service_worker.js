chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "currentTab") {
    chrome.tabs.query({ active: true }, ([currTab]) => {
      sendResponse(currTab);
    });
  } else if (request.message === "allTab") {
    chrome.tabs.query({}, (allTab) => {
      sendResponse(allTab);
    });
  }
  return true;
});
