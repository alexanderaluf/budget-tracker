import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";
import type { ComponentProps } from "react";

export type FilledIconName = ComponentProps<typeof MaterialDesignIcons>["name"];

type FilledIconProps = Omit<
  ComponentProps<typeof MaterialDesignIcons>,
  "name"
> & {
  name: FilledIconName;
};

export function FilledIcon(props: FilledIconProps) {
  return <MaterialDesignIcons {...props} />;
}
