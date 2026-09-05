import { Children, isValidElement, type PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";
import Animated, {
    Easing,
    FadeInDown,
    ReduceMotion,
} from "react-native-reanimated";

const INITIAL_DELAY = 45;
const STAGGER_DELAY = 85;
const REVEAL_DURATION = 420;

export function TabPage({ children }: PropsWithChildren) {
  const sections = Children.toArray(children);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-7 px-5"
        contentContainerStyle={{ paddingBottom: 106 }}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, index) => (
          <Animated.View
            key={
              isValidElement(section) && section.key != null
                ? section.key
                : `section-${index}`
            }
            entering={FadeInDown.duration(REVEAL_DURATION)
              .delay(INITIAL_DELAY + index * STAGGER_DELAY)
              .easing(Easing.bezier(0.22, 1, 0.36, 1))
              .reduceMotion(ReduceMotion.System)}
          >
            {section}
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}
