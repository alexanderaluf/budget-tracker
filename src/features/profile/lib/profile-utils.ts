export function getProfileInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

const profileColors = ["#70d2eb", "#b89cf5", "#f2c66d", "#ef8175"];

export function getProfileColor(index: number) {
  return profileColors[index % profileColors.length];
}
