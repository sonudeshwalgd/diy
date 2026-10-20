import { useEffect, useRef, useState } from "react";
import { Dimensions, Image, Pressable, ScrollView, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  combos,
  getComboItemCount,
  getComboStartingPrice,
  type Combo,
} from "../data/products";

const SCREEN_WIDTH = Dimensions.get("window").width;
const BANNER_WIDTH = SCREEN_WIDTH - 32;
const BANNER_HEIGHT = 190;

const BANNER_COLORS = [
  "#DC2626",
  "#2563EB",
  "#7C3AED",
  "#EA580C",
  "#16A34A",
  "#DB2777",
  "#0891B2",
];

interface Props {
  onComboPress?: (combo: Combo) => void;
}

export default function BannerCarousel({ onComboPress }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % combos.length;
        scrollRef.current?.scrollTo({
          x: next * (BANNER_WIDTH + 12),
          animated: true,
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const onScroll = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const idx = Math.round(offsetX / (BANNER_WIDTH + 12));
    if (idx >= 0 && idx < combos.length) {
      setActiveIndex(idx);
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(450).delay(140)}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={BANNER_WIDTH + 12}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {combos.map((combo, index) => (
          <Pressable
            key={combo.id}
            onPress={() => onComboPress?.(combo)}
            className="mr-3"
            style={{
              width: BANNER_WIDTH,
              height: BANNER_HEIGHT,
              borderRadius: 24,
              overflow: "hidden",
              backgroundColor: "#292524",
              shadowColor: "#78716C",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Image
              source={combo.image}
              style={{ width: BANNER_WIDTH, height: BANNER_HEIGHT }}
              resizeMode="contain"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.72)"]}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "60%",
              }}
            />
            <BlurView
              intensity={70}
              tint="light"
              experimentalBlurMethod="dimezisBlurView"
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <Text
                className="text-orange-600 text-base font-sans-extrabold px-3.5 py-1.5"
                style={{ backgroundColor: "rgba(255,255,255,0.6)" }}
              >
                ₹{getComboStartingPrice(combo)}
              </Text>
            </BlurView>
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                paddingVertical: 10,
                paddingHorizontal: 14,
              }}
            >
              <View className="flex-row items-center gap-2 mb-1">
                <View
                  className="rounded-full px-2 py-0.5"
                  style={{ backgroundColor: BANNER_COLORS[index % BANNER_COLORS.length] }}
                >
                  <Text className="text-white text-[9px] font-sans-bold">COMBO</Text>
                </View>
              </View>
              <Text
                className="text-white text-lg font-sans-extrabold"
                numberOfLines={1}
              >
                {combo.name}
              </Text>
              <Text
                className="text-white/90 text-xs mt-0.5 font-sans-medium"
                numberOfLines={1}
              >
                {combo.description}
                {getComboItemCount(combo) > 0
                  ? ` · ${getComboItemCount(combo)} items`
                  : ""}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Dots */}
      <View className="flex-row justify-center mt-3 gap-1.5">
        {combos.map((_, i) => (
          <View
            key={i}
            className={`h-1.5 rounded-full ${
              i === activeIndex ? "w-5 bg-orange-600" : "w-1.5 bg-stone-300"
            }`}
          />
        ))}
      </View>
    </Animated.View>
  );
}
