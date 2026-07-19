import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function AboutScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-100">
      <Text className="text-3xl font-bold text-green-600">About Page</Text>
      <Text className="mt-4 text-lg text-gray-500">
        Built with NativeWind
      </Text>
      <Link href="/" asChild>
        <Text className="mt-8 text-base text-blue-500 underline">
          Back to Home
        </Text>
      </Link>
    </View>
  );
}
