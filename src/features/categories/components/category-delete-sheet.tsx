import { WarningFill } from "@material-symbols-svg/react-native/rounded/icons/warning";
import { BottomSheet, Button } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalData } from "@/data/local-data-provider";
import { deleteCategory } from "@/data/model/category-record";
import type { Category } from "@/data/selectors/category-selectors";
import { selectCategories } from "@/data/selectors/document-selectors";

export function CategoryDeleteSheet({
  category,
  onDismiss,
  onDeleted,
}: {
  category: Category;
  onDismiss: () => void;
  onDeleted: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { document, updateDocument } = useLocalData();
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);
  const deleted = useRef(false);
  const openingFrame = useRef<number | null>(null);
  const openingScheduled = useRef(false);
  const closing = useRef(false);
  const [children] = useState(() =>
    selectCategories(document).filter((item) => item.parentId === category.id),
  );
  useEffect(() => {
    return () => {
      if (openingFrame.current !== null)
        cancelAnimationFrame(openingFrame.current);
    };
  }, []);
  function openAfterLayout() {
    if (openingScheduled.current || closing.current) return;
    openingScheduled.current = true;
    // HeroUI's portal mounts asynchronously. Its sheet starts at index -1 and
    // opens only when the mounted content observes false -> true. Wait for the
    // native content layout, rather than opening in the parent's mount effect.
    openingFrame.current = requestAnimationFrame(() => {
      openingFrame.current = null;
      if (!closing.current) setIsOpen(true);
    });
  }
  function closeSheet() {
    closing.current = true;
    setIsOpen(false);
  }
  async function confirm() {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await updateDocument((current) =>
        deleteCategory(current, category.id, new Date().toISOString()),
      );
      deleted.current = true;
      closeSheet();
    } catch (reason) {
      saving.current = false;
      setBusy(false);
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to delete this category. Please try again.",
      );
    }
  }
  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !saving.current && isOpen) closeSheet();
      }}
    >
      <BottomSheet.Portal unstable_accessibilityContainerViewIsModal>
        <BottomSheet.Overlay isCloseOnPress={!busy} />
        <BottomSheet.Content
          topInset={insets.top}
          bottomInset={insets.bottom}
          enablePanDownToClose={!busy}
          enableHandlePanningGesture={!busy}
          enableContentPanningGesture={!busy}
          contentContainerClassName="px-5 pb-0 pt-2"
          backgroundClassName="rounded-t-[28px] bg-surface"
          handleIndicatorClassName="w-10 bg-muted/40"
          onClose={() => {
            // Ignore the native sheet's initial closed position during mount.
            if (!closing.current) return;
            if (deleted.current) onDeleted(category.id);
            else if (!saving.current) onDismiss();
          }}
        >
          <View
            onLayout={openAfterLayout}
            className="gap-5"
            style={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }}
          >
            <View className="items-center gap-3">
              <View className="size-14 items-center justify-center rounded-full bg-danger/10">
                <WarningFill size={30} color="#ef666d" />
              </View>
              <BottomSheet.Title className="text-center text-danger">
                {category.parentId
                  ? "Delete subcategory?"
                  : "Delete parent category?"}
              </BottomSheet.Title>
            </View>
            <BottomSheet.Description className="font-sans text-base leading-6">
              Delete “{category.name}”? Its transactions will be kept as
              Uncategorized. Its links in budgets and saved transaction
              templates will be removed.
            </BottomSheet.Description>
            {children.length > 0 && (
              <View className="gap-2 rounded-2xl bg-danger/10 p-4">
                <Text className="font-manrope-semibold text-sm text-foreground">
                  These children will become main categories:
                </Text>
                {children.slice(0, 4).map((child) => (
                  <Text key={child.id} className="font-sans text-sm text-muted">
                    • {child.name}
                  </Text>
                ))}
                {children.length > 4 && (
                  <Text className="font-sans text-sm text-muted">
                    And {children.length - 4} more
                  </Text>
                )}
              </View>
            )}
            {!category.parentId && (
              <Text className="font-sans text-sm leading-5 text-muted">
                To delete a subcategory individually, press and hold its chip in
                the category menu.
              </Text>
            )}
            {!!error && (
              <Text accessibilityRole="alert" className="text-danger">
                {error}
              </Text>
            )}
            <View className="flex-row gap-3">
              <Button
                variant="tertiary"
                className="flex-1"
                isDisabled={busy}
                onPress={closeSheet}
              >
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                isDisabled={busy}
                accessibilityState={{ busy }}
                onPress={confirm}
              >
                <Button.Label>{busy ? "Deleting…" : "Delete"}</Button.Label>
              </Button>
            </View>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
