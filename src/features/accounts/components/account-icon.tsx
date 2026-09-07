import Svg, { Path } from "react-native-svg";

import { FilledIcon, type FilledIconName } from "@/shared/ui/filled-icon";

import { ACCOUNT_ICONS } from "../account-options";

const curatedIconNames = new Set<string>(
  ACCOUNT_ICONS.filter((icon) => !icon.name.startsWith("material:")).map(
    (icon) => icon.name,
  ),
);

export type AccountIconSelection = {
  name: string;
  pathData: string | null;
};

type AccountIconProps = {
  color: string;
  name: string;
  pathData?: string | null;
  size: number;
};

export function AccountIcon({ color, name, pathData, size }: AccountIconProps) {
  if (name.startsWith("material:") && pathData) {
    return (
      <Svg height={size} viewBox="0 -960 960 960" width={size}>
        <Path d={pathData} fill={color} />
      </Svg>
    );
  }

  const curatedName = curatedIconNames.has(name)
    ? (name as FilledIconName)
    : "bank";

  return <FilledIcon color={color} name={curatedName} size={size} />;
}
