/* global browser */

async function getFromStorage(type, id, fallback) {
  let tmp = await browser.storage.local.get(id);
  return typeof tmp[id] === type ? tmp[id] : fallback;
}

async function onStorageChange() {
  let tmp = await getFromStorage("object", "selectors", []);

  await browser.menus.removeAll();

  for (let row of tmp) {
    browser.menus.create({
      title: row.name,
      contexts: ["selection"],
      onclick: async (info) => {
        if (info.selectionText) {
          const ret = await browser.tabs.executeScript({
            code: `
                            (function() {
                            let selection = document.getSelection();
                            let out = [];
                            for(let i=0;i < selection.rangeCount;i++){
                                const range = selection.getRangeAt(i);
                                out.push(range.toString());
                            }
                            return out;
                            }());
                      `,
          });
          //console.debug(ret[0]);

          let out = "";
          for (const selection of ret[0]) {
            out = out + selection + row.format.replaceAll("\\n", "\n");
          }
          navigator.clipboard.writeText(out);
        }
      },
    });
  }
}

async function setToStorage(id, value) {
  let obj = {};
  obj[id] = value;
  return browser.storage.local.set(obj);
}

async function handleInstalled(details) {
  if (details.reason === "install") {
    await setToStorage("selectors", [
      { name: "\\n", format: "\\n" },
      { name: "\\n---\\n", format: "\\n---\\n" },
      { name: "\\n+++\\n", format: "+++\\n" },
      { name: " + ", format: " + " },
    ]);
    browser.runtime.openOptionsPage();
  }
}

(async () => {
  await onStorageChange();
})();

browser.runtime.onInstalled.addListener(handleInstalled);
browser.storage.onChanged.addListener(onStorageChange);
