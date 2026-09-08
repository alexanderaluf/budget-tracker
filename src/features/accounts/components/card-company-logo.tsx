import { BlurView } from "expo-blur";
import { Image, type ImageSource } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { CARD_COMPANIES } from "@/data/model/account-record";
import { FilledIcon } from "@/shared/ui/filled-icon";

import type { CardPalette } from "../lib/card-color";

type CardCompany = (typeof CARD_COMPANIES)[number];

// The account's persisted cardCompany identifies its bundled logo across
// reinstalls and backup restores. Never persist Metro's numeric asset IDs.
const logos: Record<CardCompany, ImageSource | null> = {
  Visa: require("../../../../assets/images/card-companies-logos/visa.svg"),
  Mastercard: require("../../../../assets/images/card-companies-logos/Mastercard-logo.svg"),
  "American Express": require("../../../../assets/images/card-companies-logos/american-express.svg"),
  Isracard: require("../../../../assets/images/card-companies-logos/Isracard_2023_Logo.svg.webp"),
  "Diners Club": require("../../../../assets/images/card-companies-logos/diners.svg"),
  Discover: require("../../../../assets/images/card-companies-logos/Discover_Card_logo.svg.webp"),
  JCB: require("../../../../assets/images/card-companies-logos/jcb.svg"),
  UnionPay: require("../../../../assets/images/card-companies-logos/unionpay.svg"),
  Other: null,
};

type CardCompanyLogoProps = {
  company: string;
  /** Supplying a palette swaps the opaque plate for a frosted, color-matched badge. */
  palette?: CardPalette;
  width?: number;
  height?: number;
};

export function CardCompanyLogo({
  company,
  palette,
  width = 88,
  height = 52,
}: CardCompanyLogoProps) {
  const knownCompany = CARD_COMPANIES.find((name) => name === company);
  const source = knownCompany ? logos[knownCompany] : null;
  const artwork = {
    height: Math.round(height * 0.62),
    width: Math.round(width * 0.78),
  };

  if (!palette) {
    return (
      <View style={[styles.plate, { width, height }]}>
        {source ? (
          <Image
            accessibilityLabel={`${company} logo`}
            contentFit="contain"
            source={source}
            style={artwork}
          />
        ) : (
          <FilledIcon
            color="#343434"
            name="credit-card"
            size={Math.round(height * 0.54)}
          />
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.glass,
        {
          backgroundColor: palette.glassFill,
          borderColor: palette.glassBorder,
          height,
          width,
        },
      ]}
    >
      <BlurView
        intensity={26}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        tint={palette.light ? "light" : "dark"}
      />
      <LinearGradient
        colors={
          palette.light
            ? ["rgba(255,255,255,0.78)", "rgba(255,255,255,0.14)"]
            : ["rgba(255,255,255,0.3)", "rgba(255,255,255,0.03)"]
        }
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      {source ? (
        <Image
          accessibilityLabel={`${company} logo`}
          contentFit="contain"
          source={source}
          style={artwork}
          tintColor={palette.glassInk}
        />
      ) : (
        <FilledIcon
          color={palette.glassInk}
          name="credit-card"
          size={Math.round(height * 0.54)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexShrink: 0,
    justifyContent: "center",
    overflow: "hidden",
  },
  plate: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    flexShrink: 0,
    justifyContent: "center",
    overflow: "hidden",
  },
});
