import { Link } from "expo-router";
import { ScrollView, Text, View } from "react-native";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-lg font-bold text-gray-900 mb-2">{title}</Text>
      {children}
    </View>
  );
}

export default function PrivacyScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-5">
        <Text className="text-3xl font-bold text-green-600 mb-1">Privacy Policy</Text>
        <Text className="text-sm text-gray-500 mb-6">Last updated: July 2026</Text>

        <Section title="1. Information We Collect">
          <Text className="text-gray-700 leading-6">
            DIY Shop collects information you provide directly, such as your name, phone number,
            order details, and payment preferences when you place an order. We also collect device
            and usage information needed to operate and improve our services.
          </Text>
        </Section>

        <Section title="2. How We Use Your Information">
          <Text className="text-gray-700 leading-6">
            We use your information to process and deliver your orders, provide customer support,
            send order updates, manage your loyalty coins and rewards, and improve our app and menu
            offerings.
          </Text>
        </Section>

        <Section title="3. WhatsApp Communications">
          <Text className="text-gray-700 leading-6">
            When you contact us via WhatsApp, your phone number and conversation history are used
            solely to respond to your queries and update you about your orders. We do not sell your
            personal information to third parties.
          </Text>
        </Section>

        <Section title="4. Data Sharing">
          <Text className="text-gray-700 leading-6">
            We only share your information with service providers that help us operate the app,
            such as payment processors and delivery partners, and only to the extent necessary to
            provide our services to you.
          </Text>
        </Section>

        <Section title="5. Data Security">
          <Text className="text-gray-700 leading-6">
            We take reasonable measures to protect your personal information from unauthorized
            access, alteration, disclosure, or destruction.
          </Text>
        </Section>

        <Section title="6. Your Rights">
          <Text className="text-gray-700 leading-6">
            You may request access to, correction of, or deletion of your personal information at
            any time by contacting us through the app or at our support channels.
          </Text>
        </Section>

        <Section title="7. Contact Us">
          <Text className="text-gray-700 leading-6">
            If you have any questions about this Privacy Policy, please contact us via WhatsApp or
            by visiting our store.
          </Text>
        </Section>

        <Link href="/" asChild>
          <Text className="mt-4 text-base text-blue-500 underline text-center">
            Back to Home
          </Text>
        </Link>
      </View>
    </ScrollView>
  );
}
