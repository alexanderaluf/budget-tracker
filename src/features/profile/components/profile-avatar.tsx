import { Avatar } from "heroui-native";

type ProfileAvatarProps = {
  initials: string;
  color?: string;
  imageUri?: string;
  size?: "sm" | "md" | "lg";
  dimension?: number;
};

export function ProfileAvatar({
  initials,
  color = "#70d2eb",
  imageUri,
  size = "md",
  dimension,
}: ProfileAvatarProps) {
  return (
    <Avatar
      accessibilityLabel={`Profile ${initials}`}
      color="accent"
      size={size}
      style={{
        backgroundColor: color,
        ...(dimension ? { width: dimension, height: dimension } : null),
      }}
    >
      {imageUri ? <Avatar.Image source={{ uri: imageUri }} /> : null}
      <Avatar.Fallback
        textProps={{
          allowFontScaling: false,
          style: { color: "#073442", fontFamily: "Manrope_700Bold" },
        }}
      >
        {initials}
      </Avatar.Fallback>
    </Avatar>
  );
}
