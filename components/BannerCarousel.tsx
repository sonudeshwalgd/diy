import { useEffect, useRef, useState } from "react";
import { Dimensions, Image, Pressable, ScrollView, Text, View } from "react-native";
import { BlurView } from "expo-blur";
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
    <View className="mt-3">
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
            }}
          >
            <Image
              source={combo.image}
              style={{ width: BANNER_WIDTH, height: BANNER_HEIGHT }}
              resizeMode="cover"
            />
            <View
              className="absolute top-3 right-3 overflow-hidden rounded-full"
              style={{ borderRadius: 999 }}
            >
              <BlurView
                intensity={50}
                tint="light"
                experimentalBlurMethod="dimezisBlurView"
              >
                <Text
                  className="text-orange-600 text-base font-sans-extrabold px-3.5 py-1.5"
                  style={{ backgroundColor: "rgba(255,255,255,0.55)" }}
                >
                  ₹{getComboStartingPrice(combo)}
                </Text>
              </BlurView>
            </View>
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                paddingVertical: 10,
                paddingHorizontal: 14,
                backgroundColor: BANNER_COLORS[index % BANNER_COLORS.length] + "D9",
              }}
            >
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
    </View>
  );
}
