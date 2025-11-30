let activeTabId = null;
let activeTabDomain = null;
let startTime = null;

// 1. Listen when user switches tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    await saveTime(); // Save time for the previous tab
    
    activeTabId = activeInfo.tabId;
    startTime = Date.now();

    try {
        const tab = await chrome.tabs.get(activeTabId);
        if (tab.url) {
            activeTabDomain = new URL(tab.url).hostname;
        }
    } catch (e) {
        activeTabDomain = null;
    }
});

// 2. Listen when user types a new URL in the same tab
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tabId === activeTabId && changeInfo.url) {
        await saveTime(); // Save old URL time
        
        activeTabDomain = new URL(changeInfo.url).hostname;
        startTime = Date.now();
    }
});

// 3. Save Time Function
async function saveTime() {
    if (!activeTabDomain || !startTime) return;

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // in seconds
    startTime = Date.now(); // Reset start time

    // Get existing data
    const data = await chrome.storage.local.get([activeTabDomain]);
    const oldTime = data[activeTabDomain] || 0;

    // Save new total
    await chrome.storage.local.set({ [activeTabDomain]: oldTime + duration });
}

// 4. Save whenever chrome is closed or loses focus
chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        await saveTime();
        activeTabDomain = null;
    } else {
        const queryOptions = { active: true, currentWindow: true };
        const [tab] = await chrome.tabs.query(queryOptions);
        if (tab && tab.url) {
            activeTabDomain = new URL(tab.url).hostname;
            startTime = Date.now();
        }
    }
});