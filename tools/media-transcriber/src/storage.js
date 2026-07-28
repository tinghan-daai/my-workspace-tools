const DATABASE = "media-transcriber";
const STORE = "projects";
const ACTIVE_KEY = "active";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transact(mode, action) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    const request = action(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

export function loadActiveProject() {
  return transact("readonly", (store) => store.get(ACTIVE_KEY));
}

export function saveActiveProject(project) {
  return transact("readwrite", (store) => store.put(project, ACTIVE_KEY));
}

export function clearActiveProject() {
  return transact("readwrite", (store) => store.delete(ACTIVE_KEY));
}
