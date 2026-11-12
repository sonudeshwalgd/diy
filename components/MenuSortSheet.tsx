import type { ComponentProps } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Sheet from "./Sheet";
import {
  MENU_SORT_OPTIONS,
  type MenuSortId,
  type MenuSortOption,
} from "../utils/menuSort";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface Props {
  visible: boolean;
  value: MenuSortId;
  onChange: (value: MenuSortId) => void;
  onClose: () => void;
}

const GROUPS: MenuSortOption["group"][] = ["Sort", "Item category", "Time"];

export default function MenuSortSheet({
  visible,
  value,
  onChange,
  onClose,
}: Props) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      sheetClassName=""
      sheetStyle={{ maxHeight: "82%" }}
    >
      <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-11 h-11 rounded-2xl bg-orange-100 items-center justify-center">
            <Ionicons name="options-outline" size={22} color="#EA580C" />
          </View>
          <View>
            <Text className="text-lg font-sans-extrabold text-stone-900">
              Sort menu
            </Text>
            <Text className="text-[11px] text-stone-500 font-sans-medium">
              Availability, popularity, price, category and time
            </Text>
          </View>
        </View>
        <Pressable onPress={onClose} className="p-1">
          <Ionicons name="close" size={24} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {GROUPS.map((group) => {
          const options = MENU_SORT_OPTIONS.filter(
            (option) => option.group === group
          );
          if (options.length === 0) return null;

          return (
            <View key={group} className="mb-4">
              <Text className="text-[10px] uppercase tracking-wider text-stone-500 font-sans-bold px-1 mb-2">
                {group}
              </Text>
              <View className="bg-white rounded-3xl border border-stone-100 overflow-hidden">
                {options.map((option, index) => {
                  const selected = value === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => {
                        onChange(option.id);
                        onClose();
                      }}
                      className={`flex-row items-center gap-3 px-4 py-3 ${
                        index > 0 ? "border-t border-stone-100" : ""
                      } ${selected ? "bg-orange-50" : ""}`}
                    >
                      <View
                        className="w-9 h-9 rounded-xl items-center justify-center"
                        style={{ backgroundColor: `${option.color}1A` }}
                      >
                        <Ionicons
                          name={option.icon as IoniconName}
                          size={18}
                          color={option.color}
                        />
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`text-sm ${
                            selected
                              ? "text-orange-700 font-sans-bold"
                              : "text-stone-800 font-sans-semibold"
                          }`}
                        >
                          {option.label}
                        </Text>
                        <Text className="text-[11px] text-stone-400 font-sans-medium mt-0.5">
                          {option.description}
                        </Text>
                      </View>
                      <Ionicons
                        name={
                          selected
                            ? "checkmark-circle"
                            : "ellipse-outline"
                        }
                        size={20}
                        color={selected ? "#EA580C" : "#D6D3D1"}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}
