import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { combos, type Combo } from "../data/products";

const SCREEN_WIDTH = Dimensions.get("window").width;
const BANNER_WIDTH = SCREEN_WIDTH - 32;
const BANNER_HEIGHT = 300;

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
            style={{
              width: BANNER_WIDTH,
              height: BANNER_HEIGHT,
              marginRight: 12,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <Image
              source={{ uri: combo.image }}
              style={{ width: BANNER_WIDTH, height: BANNER_HEIGHT }}
              resizeMode="cover"
            />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: 16,
                backgroundColor: BANNER_COLORS[index % BANNER_COLORS.length] + "CC",
              }}
            >
              <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
                {combo.name}
              </Text>
              <Text style={{ color: "white", fontSize: 14, marginTop: 4, opacity: 0.9 }}>
                {combo.description} · {combo.subItems.length} items · ₹
                {combo.totalPrice}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 12, gap: 6 }}>
        {combos.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === activeIndex ? 20 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === activeIndex ? "#2563EB" : "#D1D5DB",
            }}
          />
        ))}
      </View>
    </View>
  );
}
