chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "currentTab") {
    chrome.tabs.query({ active: true }, ([currTab]) => {
      sendResponse(currTab);
      console.log(currTab.url);
    });
  } else if (request.message === "allTabs") {
    chrome.tabs.query({}, (allTabs) => {
      sendResponse(allTabs);
    });
  }

  return true;
});
