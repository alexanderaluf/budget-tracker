import { Button } from "heroui-native";
import type { TFunction } from "i18next";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";

import { Text } from "@/shared/ui/app-text";

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
      <View className="ms-3 flex-1 items-start">
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

function confirmRestore(imported: ImportedBackup, t: TFunction) {
  return new Promise<boolean>((resolve) => {
    if (imported.format === "csv") {
      resolve(true);
      return;
    }

    Alert.alert(
      t("backup.restoreTitle"),
      t("backup.restoreDescription"),
      [
        {
          text: t("backup.cancel"),
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: t("backup.restore"),
          style: "destructive",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function BackupManagement() {
  const { t, i18n } = useTranslation();
  const { document, replaceDocument } = useLocalData();
  const [isBusy, setIsBusy] = useState(false);
  const recordCount = BACKUP_COLLECTION_KEYS.reduce(
    (total, collection) => total + document[collection].length,
    0,
  );
  const numberFormatter = new Intl.NumberFormat(
    i18n.resolvedLanguage ?? i18n.language,
  );

  async function handleExport(format: BackupFormat) {
    try {
      setIsBusy(true);
      await exportBackup(document, format);
    } catch (error) {
      Alert.alert(
        t("backup.exportFailed"),
        getErrorMessage(error, t("backup.unexpectedError")),
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleImport() {
    try {
      setIsBusy(true);
      const imported = await pickAndImportBackup(document);
      if (!imported || !(await confirmRestore(imported, t))) return;

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
        t("backup.importComplete"),
        imported.format === "csv"
          ? t("backup.csvImportComplete")
          : t("backup.restoreComplete"),
      );
    } catch (error) {
      Alert.alert(
        t("backup.importFailed"),
        getErrorMessage(error, t("backup.unexpectedError")),
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <View className="gap-1 rounded-lg border border-border bg-surface-secondary px-3">
      <View className="flex-row items-center justify-between px-1 py-2">
        <Text className="font-sans text-[11px] text-muted">
          {t("backup.localRecords", {
            count: recordCount,
            formattedCount: numberFormatter.format(recordCount),
          })}
        </Text>
        <Text className="font-sans text-[11px] text-muted">
          {t("backup.attachments", {
            count: document._local.attachments.length,
            formattedCount: numberFormatter.format(
              document._local.attachments.length,
            ),
          })}
        </Text>
      </View>
      <View className="h-px bg-border" />
      <BackupAction
        description={t("backup.actions.exportZipDescription")}
        icon="folder-zip"
        isDisabled={isBusy}
        label={t("backup.actions.exportZip")}
        onPress={() => handleExport("zip")}
      />
      <View className="h-px bg-border" />
      <BackupAction
        description={t("backup.actions.exportJsonDescription")}
        icon="code-json"
        isDisabled={isBusy}
        label={t("backup.actions.exportJson")}
        onPress={() => handleExport("json")}
      />
      <View className="h-px bg-border" />
      <BackupAction
        description={t("backup.actions.exportCsvDescription")}
        icon="file-delimited"
        isDisabled={isBusy}
        label={t("backup.actions.exportCsv")}
        onPress={() => handleExport("csv")}
      />
      <View className="h-px bg-border" />
      <BackupAction
        description={t("backup.actions.importDescription")}
        icon="database-import"
        isDisabled={isBusy}
        label={t("backup.actions.import")}
        onPress={handleImport}
      />
    </View>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
