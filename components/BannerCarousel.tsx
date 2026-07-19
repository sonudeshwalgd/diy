import { useEffect, useRef, useState } from "react";
import { Dimensions, Image, ScrollView, Text, View } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const BANNER_WIDTH = SCREEN_WIDTH - 32;
const BANNER_HEIGHT = 220;

const banners = [
  {
    id: "1",
    title: "Combo Deal!",
    subtitle: "Burger + Fries + Coke at ₹249 only",
    color: "#DC2626",
    image: "https://loremflickr.com/800/400/burger,deal",
  },
  {
    id: "2",
    title: "Flat 20% Off",
    subtitle: "On all Beverages this weekend",
    color: "#2563EB",
    image: "https://loremflickr.com/800/400/cocktail,drink",
  },
  {
    id: "3",
    title: "Buy 1 Get 1 Free",
    subtitle: "On all Momos — Limited time only!",
    color: "#7C3AED",
    image: "https://loremflickr.com/800/400/momos,food",
  },
  {
    id: "4",
    title: "Pizza Party!",
    subtitle: "Order 2 large pizzas, get garlic bread free",
    color: "#EA580C",
    image: "https://loremflickr.com/800/400/pizza,party",
  },
  {
    id: "5",
    title: "Free Delivery",
    subtitle: "On orders above ₹500 — No minimum charge",
    color: "#16A34A",
    image: "https://loremflickr.com/800/400/delivery,food",
  },
];

export default function BannerCarousel() {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % banners.length;
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
    if (idx >= 0 && idx < banners.length) {
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
        {banners.map((banner) => (
          <View
            key={banner.id}
            style={{
              width: BANNER_WIDTH,
              height: BANNER_HEIGHT,
              marginRight: 12,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <Image
              source={{ uri: banner.image }}
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
                backgroundColor: banner.color + "CC",
              }}
            >
              <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
                {banner.title}
              </Text>
              <Text style={{ color: "white", fontSize: 14, marginTop: 4, opacity: 0.9 }}>
                {banner.subtitle}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 12, gap: 6 }}>
        {banners.map((_, i) => (
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
