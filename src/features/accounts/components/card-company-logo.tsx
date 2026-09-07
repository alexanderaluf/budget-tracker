import { Image, type ImageSource } from "expo-image";
import { StyleSheet, View } from "react-native";

import { CARD_COMPANIES } from "@/data/model/account-record";
import { FilledIcon } from "@/shared/ui/filled-icon";

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

export function CardCompanyLogo({ company }: { company: string }) {
  const knownCompany = CARD_COMPANIES.find((name) => name === company);
  const source = knownCompany ? logos[knownCompany] : null;

  return (
    <View style={styles.frame}>
      {source ? (
        <Image
          source={source}
          accessibilityLabel={`${company} logo`}
          contentFit="contain"
          style={styles.image}
        />
      ) : (
        <FilledIcon name="credit-card" color="#343434" size={28} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    flexShrink: 0,
    height: 52,
    justifyContent: "center",
    overflow: "hidden",
    width: 88,
  },
  image: {
    height: 44,
    width: 76,
  },
});
