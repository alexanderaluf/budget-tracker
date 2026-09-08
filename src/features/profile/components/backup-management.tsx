import { Button } from "heroui-native";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

import {
    commitStagedAttachments,
    discardStagedAttachments,
    stageAttachments,
} from "@/data/attachments/attachment-store";
import {
    exportBackup,
    pickAndImportBackup,
    type BackupFormat,
    type ImportedBackup,
} from "@/data/backup/backup-service";
import { useLocalData } from "@/data/local-data-provider";
import { BACKUP_COLLECTION_KEYS } from "@/data/model/backup-document";
import { cloneBackupDocument } from "@/data/model/normalize-backup";
import { FilledIcon, type FilledIconName } from "@/shared/ui/filled-icon";

type BackupActionProps = {
  icon: FilledIconName;
  label: string;
  description: string;
  isDisabled: boolean;
  onPress: () => void;
};

function BackupAction({
  icon,
  label,
  description,
  isDisabled,
  onPress,
}: BackupActionProps) {
  return (
    <Button
      isDisabled={isDisabled}
      variant="ghost"
      className="h-auto w-full justify-start rounded-none px-1 py-3"
      onPress={onPress}
    >
      <FilledIcon name={icon} size={21} tone="accent" />
      <View className="ml-3 flex-1 items-start">
        <Button.Label className="font-manrope-semibold text-sm text-foreground">
          {label}
        </Button.Label>
        <Text className="mt-0.5 font-sans text-[11px] text-muted">
          {description}
        </Text>
      </View>
    </Button>
  );
}

function confirmRestore(imported: ImportedBackup) {
  return new Promise<boolean>((resolve) => {
    if (imported.format === "csv") {
      resolve(true);
      return;
    }

    Alert.alert(
      "Restore backup?",
      "Current local records will be replaced by this backup. This cannot be undone unless you export a backup first.",
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "Restore", style: "destructive", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function BackupManagement() {
  const { document, replaceDocument } = useLocalData();
  const [isBusy, setIsBusy] = useState(false);
  const recordCount = BACKUP_COLLECTION_KEYS.reduce(
    (total, collection) => total + document[collection].length,
    0,
  );

  async function handleExport(format: BackupFormat) {
    try {
      setIsBusy(true);
      await exportBackup(document, format);
    } catch (error) {
      Alert.alert("Export failed", getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleImport() {
    try {
      setIsBusy(true);
      const imported = await pickAndImportBackup(document);
      if (!imported || !(await confirmRestore(imported))) return;

      if (imported.format !== "csv") {
        const previousDocument = cloneBackupDocument(document);
        stageAttachments(imported.attachments ?? []);
        try {
          await replaceDocument(imported.document);
          commitStagedAttachments();
        } catch (error) {
          discardStagedAttachments();
          await replaceDocument(previousDocument);
          throw error;
        }
      } else {
        await replaceDocument(imported.document);
      }
      Alert.alert(
        "Import complete",
        imported.format === "csv"
          ? "Transactions were merged into local storage."
          : "The local backup was restored successfully.",
      );
    } catch (error) {
      Alert.alert("Import failed", getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <View className="gap-1 rounded-lg border border-border bg-surface-secondary px-3">
      <View className="flex-row items-center justify-between px-1 py-2">
        <Text className="font-sans text-[11px] text-muted">
          {recordCount} local records
        </Text>
        <Text className="font-sans text-[11px] text-muted">
          {document._local.attachments.length} attachments
        </Text>
      </View>
      <View className="h-px bg-border" />
      <BackupAction
        description="Full restorable backup with images and attachments"
        icon="folder-zip"
        isDisabled={isBusy}
        label="Export ZIP backup"
        onPress={() => handleExport("zip")}
      />
      <View className="h-px bg-border" />
      <BackupAction
        description="Restorable records without media files"
        icon="code-json"
        isDisabled={isBusy}
        label="Export JSON backup"
        onPress={() => handleExport("json")}
      />
      <View className="h-px bg-border" />
      <BackupAction
        description="Spreadsheet-friendly transaction export"
        icon="file-delimited"
        isDisabled={isBusy}
        label="Export transactions CSV"
        onPress={() => handleExport("csv")}
      />
      <View className="h-px bg-border" />
      <BackupAction
        description="Restore ZIP/JSON or merge a transaction CSV"
        icon="database-import"
        isDisabled={isBusy}
        label="Import data"
        onPress={handleImport}
      />
    </View>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}
