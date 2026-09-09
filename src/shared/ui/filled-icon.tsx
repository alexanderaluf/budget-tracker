import { AccountBalanceFill } from "@material-symbols-svg/react-native/rounded/icons/account-balance";
import { AccountBalanceWalletFill } from "@material-symbols-svg/react-native/rounded/icons/account-balance-wallet";
import {
    AddFill,
    AddFillW600,
} from "@material-symbols-svg/react-native/rounded/icons/add";
import { AddCardFill } from "@material-symbols-svg/react-native/rounded/icons/add-card";
import { ArrowBackFill } from "@material-symbols-svg/react-native/rounded/icons/arrow-back";
import { ArrowOutwardFill } from "@material-symbols-svg/react-native/rounded/icons/arrow-outward";
import { BackupFill } from "@material-symbols-svg/react-native/rounded/icons/backup";
import { CallReceivedFill } from "@material-symbols-svg/react-native/rounded/icons/call-received";
import { CameraFill } from "@material-symbols-svg/react-native/rounded/icons/camera";
import { CheckFill } from "@material-symbols-svg/react-native/rounded/icons/check";
import { ChevronRightFill } from "@material-symbols-svg/react-native/rounded/icons/chevron-right";
import { CloseFill } from "@material-symbols-svg/react-native/rounded/icons/close";
import { ContactlessFill } from "@material-symbols-svg/react-native/rounded/icons/contactless";
import { ContentCopyFill } from "@material-symbols-svg/react-native/rounded/icons/content-copy";
import { CreditCardFill } from "@material-symbols-svg/react-native/rounded/icons/credit-card";
import { CsvFill } from "@material-symbols-svg/react-native/rounded/icons/csv";
import { CurrencyExchangeFill } from "@material-symbols-svg/react-native/rounded/icons/currency-exchange";
import { DarkModeFill } from "@material-symbols-svg/react-native/rounded/icons/dark-mode";
import { DataObjectFill } from "@material-symbols-svg/react-native/rounded/icons/data-object";
import { DatabaseUploadFill } from "@material-symbols-svg/react-native/rounded/icons/database-upload";
import { DeleteFill } from "@material-symbols-svg/react-native/rounded/icons/delete";
import { DirectionsCarFill } from "@material-symbols-svg/react-native/rounded/icons/directions-car";
import {
    DonutLargeFill,
    DonutLargeFillW600,
} from "@material-symbols-svg/react-native/rounded/icons/donut-large";
import { EditFill } from "@material-symbols-svg/react-native/rounded/icons/edit";
import { ExperimentFill } from "@material-symbols-svg/react-native/rounded/icons/experiment";
import { FilterAltFill } from "@material-symbols-svg/react-native/rounded/icons/filter-alt";
import { FolderZipFill } from "@material-symbols-svg/react-native/rounded/icons/folder-zip";
import { FormatPaintFill } from "@material-symbols-svg/react-native/rounded/icons/format-paint";
import { HelpFill } from "@material-symbols-svg/react-native/rounded/icons/help";
import { HomeFill } from "@material-symbols-svg/react-native/rounded/icons/home";
import { KeyboardArrowUpFill } from "@material-symbols-svg/react-native/rounded/icons/keyboard-arrow-up";
import { LocalCafeFill } from "@material-symbols-svg/react-native/rounded/icons/local-cafe";
import { ManageAccountsFill } from "@material-symbols-svg/react-native/rounded/icons/manage-accounts";
import { NotificationsFill } from "@material-symbols-svg/react-native/rounded/icons/notifications";
import { NotificationsActiveFill } from "@material-symbols-svg/react-native/rounded/icons/notifications-active";
import { PaymentsFill } from "@material-symbols-svg/react-native/rounded/icons/payments";
import { PersonFill } from "@material-symbols-svg/react-native/rounded/icons/person";
import { PhotoLibraryFill } from "@material-symbols-svg/react-native/rounded/icons/photo-library";
import { RestaurantFill } from "@material-symbols-svg/react-native/rounded/icons/restaurant";
import { SaveFill } from "@material-symbols-svg/react-native/rounded/icons/save";
import { SavingsFill } from "@material-symbols-svg/react-native/rounded/icons/savings";
import { ScheduleFill } from "@material-symbols-svg/react-native/rounded/icons/schedule";
import {
    SearchFill,
    SearchFillW600,
} from "@material-symbols-svg/react-native/rounded/icons/search";
import { SearchOffFill } from "@material-symbols-svg/react-native/rounded/icons/search-off";
import { SettingsFill } from "@material-symbols-svg/react-native/rounded/icons/settings";
import { ShoppingBagFill } from "@material-symbols-svg/react-native/rounded/icons/shopping-bag";
import { SwapHorizFill } from "@material-symbols-svg/react-native/rounded/icons/swap-horiz";
import { TrendingDownFill } from "@material-symbols-svg/react-native/rounded/icons/trending-down";
import { TrendingUpFill } from "@material-symbols-svg/react-native/rounded/icons/trending-up";
import { TrophyFill } from "@material-symbols-svg/react-native/rounded/icons/trophy";
import { TuneFill } from "@material-symbols-svg/react-native/rounded/icons/tune";
import { VerifiedUserFill } from "@material-symbols-svg/react-native/rounded/icons/verified-user";
import { VisibilityFill } from "@material-symbols-svg/react-native/rounded/icons/visibility";
import { VisibilityOffFill } from "@material-symbols-svg/react-native/rounded/icons/visibility-off";
import type {
    IconProps,
    MaterialSymbolsComponent,
} from "@material-symbols-svg/react-native/rounded/w400";
import { useThemeColor } from "heroui-native";

const icons = {
  account: PersonFill,
  "account-cog": ManageAccountsFill,
  "arrow-bottom-left": CallReceivedFill,
  "arrow-left": ArrowBackFill,
  "arrow-top-right": ArrowOutwardFill,
  bank: AccountBalanceFill,
  backup: BackupFill,
  bell: NotificationsFill,
  camera: CameraFill,
  car: DirectionsCarFill,
  cash: PaymentsFill,
  "chart-donut-variant": DonutLargeFill,
  check: CheckFill,
  "chevron-right": ChevronRightFill,
  "chevron-up": KeyboardArrowUpFill,
  clock: ScheduleFill,
  close: CloseFill,
  "code-json": DataObjectFill,
  coffee: LocalCafeFill,
  copy: ContentCopyFill,
  cog: SettingsFill,
  "credit-card": CreditCardFill,
  "credit-card-chip": CreditCardFill,
  "credit-card-plus": AddCardFill,
  "currency-exchange": CurrencyExchangeFill,
  "currency-usd": PaymentsFill,
  "database-import": DatabaseUploadFill,
  delete: DeleteFill,
  experiment: ExperimentFill,
  eye: VisibilityFill,
  "eye-off": VisibilityOffFill,
  "file-delimited": CsvFill,
  filter: FilterAltFill,
  "folder-zip": FolderZipFill,
  food: RestaurantFill,
  "format-paint": FormatPaintFill,
  help: HelpFill,
  home: HomeFill,
  "home-variant": HomeFill,
  magnify: SearchFill,
  "magnify-close": SearchOffFill,
  nfc: ContactlessFill,
  "notifications-active": NotificationsActiveFill,
  pencil: EditFill,
  "photo-library": PhotoLibraryFill,
  "piggy-bank": SavingsFill,
  plus: AddFill,
  "plus-thick": AddFill,
  save: SaveFill,
  "shield-check": VerifiedUserFill,
  shopping: ShoppingBagFill,
  "swap-horizontal": SwapHorizFill,
  "trending-down": TrendingDownFill,
  "trending-up": TrendingUpFill,
  trophy: TrophyFill,
  tune: TuneFill,
  wallet: AccountBalanceWalletFill,
  "weather-night": DarkModeFill,
} as const satisfies Record<string, MaterialSymbolsComponent>;

export type FilledIconName = keyof typeof icons;

const boldIcons = {
  "chart-donut-variant": DonutLargeFillW600,
  magnify: SearchFillW600,
  "plus-thick": AddFillW600,
} satisfies Partial<Record<FilledIconName, MaterialSymbolsComponent>>;

type FilledIconProps = Omit<IconProps, "color"> & {
  color?: string;
  name: FilledIconName;
  tone?: "accent" | "accent-foreground" | "danger" | "foreground" | "muted" | "success";
  weight?: 400 | 600;
};

export function FilledIcon({
  color,
  name,
  tone = "foreground",
  weight = 400,
  ...props
}: FilledIconProps) {
  const [accent, accentForeground, danger, foreground, muted, success] =
    useThemeColor([
      "accent",
      "accent-foreground",
      "danger",
      "foreground",
      "muted",
      "success",
    ]);
  const themeColors = {
    accent,
    "accent-foreground": accentForeground,
    danger,
    foreground,
    muted,
    success,
  };
  const Icon =
    weight === 600 && name in boldIcons
      ? boldIcons[name as keyof typeof boldIcons]
      : icons[name];

  return <Icon color={color ?? themeColors[tone]} {...props} />;
}