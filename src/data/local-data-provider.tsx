import { useSQLiteContext } from "expo-sqlite";
import {
    createContext,
    type PropsWithChildren,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { ActivityIndicator, View } from "react-native";

import { readDocument, writeDocument } from "./database/document-repository";
import type {
    BackupCollectionKey,
    BackupDocument,
} from "./model/backup-document";
import { createDefaultBackup } from "./model/default-backup";
import type { JsonObject } from "./model/json";
import {
    cloneBackupDocument,
    normalizeBackupDocument,
} from "./model/normalize-backup";

type DocumentUpdater = (current: BackupDocument) => BackupDocument;

type LocalDataContextValue = {
  document: BackupDocument;
  isHydrated: boolean;
  refresh: () => Promise<void>;
  replaceDocument: (document: BackupDocument) => Promise<void>;
  updateDocument: (updater: DocumentUpdater) => Promise<void>;
  upsertRecord: (
    collection: BackupCollectionKey,
    record: JsonObject,
  ) => Promise<void>;
  removeRecord: (
    collection: BackupCollectionKey,
    recordId: string | number,
  ) => Promise<void>;
};

const LocalDataContext = createContext<LocalDataContextValue | null>(null);

export function LocalDataProvider({ children }: PropsWithChildren) {
  const database = useSQLiteContext();
  const [document, setDocument] = useState(createDefaultBackup);
  const [isHydrated, setIsHydrated] = useState(false);
  const documentRef = useRef(document);
  const writeQueue = useRef(Promise.resolve());

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const persisted = await readDocument(database);
    documentRef.current = persisted;
    setDocument(persisted);
    setIsHydrated(true);
  }

  async function replaceDocument(nextDocument: BackupDocument) {
    const normalized = normalizeBackupDocument(nextDocument);
    writeQueue.current = writeQueue.current
      .catch(() => undefined)
      .then(async () => {
        await writeDocument(database, normalized);
        documentRef.current = normalized;
        setDocument(normalized);
      });
    await writeQueue.current;
  }

  async function updateDocument(updater: DocumentUpdater) {
    writeQueue.current = writeQueue.current
      .catch(() => undefined)
      .then(async () => {
        const next = normalizeBackupDocument(
          updater(cloneBackupDocument(documentRef.current)),
        );
        await writeDocument(database, next);
        documentRef.current = next;
        setDocument(next);
      });
    await writeQueue.current;
  }

  async function upsertRecord(
    collection: BackupCollectionKey,
    record: JsonObject,
  ) {
    const identity = String(record.uuid ?? record.id ?? "");
    if (!identity) throw new Error("Records require an id or uuid.");

    await updateDocument((current) => {
      const records = current[collection];
      const index = records.findIndex(
        (item) => String(item.uuid ?? item.id ?? "") === identity,
      );
      const nextRecords = [...records];
      if (index >= 0) nextRecords[index] = record;
      else nextRecords.push(record);
      return { ...current, [collection]: nextRecords };
    });
  }

  async function removeRecord(
    collection: BackupCollectionKey,
    recordId: string | number,
  ) {
    const identity = String(recordId);
    await updateDocument((current) => ({
      ...current,
      [collection]: current[collection].filter(
        (item) => String(item.uuid ?? item.id ?? "") !== identity,
      ),
    }));
  }

  if (!isHydrated) {
    return (
      <View
        style={{
          alignItems: "center",
          backgroundColor: "#000000",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#70d2eb" size="large" />
      </View>
    );
  }

  return (
    <LocalDataContext.Provider
      value={{
        document,
        isHydrated,
        refresh,
        replaceDocument,
        updateDocument,
        upsertRecord,
        removeRecord,
      }}
    >
      {children}
    </LocalDataContext.Provider>
  );
}

export function useLocalData() {
  const context = useContext(LocalDataContext);

  if (!context) {
    throw new Error("useLocalData must be used within LocalDataProvider");
  }

  return context;
}
