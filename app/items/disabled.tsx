import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { categories, combos } from "../../data/products";
import { useDisabledItems } from "../../context/DisabledItemsContext";

interface StaffRow {
  id: string;
  name: string;
  subtitle?: string;
  disabled: boolean;
  autoOutOfStock?: boolean;
  reason?: string;
}

interface StaffGroup {
  id: string;
  name: string;
  rows: StaffRow[];
}

export default function DisabledItemsScreen() {
  const router = useRouter();
  const {
    disabledCount,
    isItemDisabled,
    getComboAvailability,
    setItemDisabled,
    unlock,
    lock,
    unlocked,
    verifying,
    loading,
    status,
    lastSyncedAt,
    error,
    syncNow,
  } = useDisabledItems();

  const [staffKey, setStaffKey] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    return () => {
      void lock();
    };
  }, [lock]);

  const groups = useMemo<StaffGroup[]>(() => {
    const search = query.trim().toLowerCase();

    const itemGroups = categories.map((category) => ({
      id: category.id,
      name: category.name,
      rows: category.subcategories.map((sub) => ({
        id: sub.id,
        name: sub.name,
        subtitle: sub.variants?.length
          ? `${sub.variants.length} variants`
          : undefined,
        disabled: isItemDisabled(sub.id),
      })),
    }));

    const comboGroup: StaffGroup = {
      id: "combos",
      name: "Combos & Meals",
      rows: combos.map((combo) => {
        const availability = getComboAvailability(combo);
        const directlyDisabled = isItemDisabled(`combo:${combo.id}`);
        const autoOutOfStock = availability.outOfStock && !directlyDisabled;
        const reason = !autoOutOfStock
          ? undefined
          : availability.fixedItemIds.length > 0
          ? "Includes an out of stock item"
          : "All options are out of stock";
        return {
          id: `combo:${combo.id}`,
          name: combo.name,
          subtitle: combo.description,
          disabled: availability.outOfStock,
          autoOutOfStock,
          reason,
        };
      }),
    };

    const all = [...itemGroups, comboGroup];

    if (!search) return all;

    return all
      .map((group) => ({
        ...group,
        rows: group.rows.filter(
          (row) =>
            row.name.toLowerCase().includes(search) ||
            group.name.toLowerCase().includes(search)
        ),
      }))
      .filter((group) => group.rows.length > 0);
  }, [getComboAvailability, isItemDisabled, query]);

  const totalItemCount = useMemo(
    () =>
      categories.reduce(
        (sum, category) => sum + category.subcategories.length,
        0
      ) + combos.length,
    []
  );

  const handleUnlock = async () => {
    const ok = await unlock(staffKey);
    if (!ok) {
      setUnlockError("That staff key is not valid. Please try again.");
      return;
    }
    setUnlockError(null);
    setStaffKey("");
  };

  const statusContent = (() => {
    if (status === "syncing") {
      return {
        icon: "cloud-upload-outline" as const,
        text: "Saving changes…",
        containerTone: "bg-amber-50 border-amber-200",
        textTone: "text-amber-700",
      };
    }
    if (status === "error") {
      return {
        icon: "cloud-offline-outline" as const,
        text: error ?? "Showing saved availability",
        containerTone: "bg-red-50 border-red-200",
        textTone: "text-red-700",
      };
    }
    if (lastSyncedAt) {
      return {
        icon: "cloud-done-outline" as const,
        text: "Availability is up to date",
        containerTone: "bg-emerald-50 border-emerald-200",
        textTone: "text-emerald-700",
      };
    }
    return {
      icon: "cloud-outline" as const,
      text: "Loading availability…",
      containerTone: "bg-stone-100 border-stone-200",
      textTone: "text-stone-600",
    };
  })();

  return (
    <View className="flex-1 bg-stone-100">
      <SafeAreaView edges={["top"]} className="bg-white/90 border-b border-stone-200">
        <View className="px-4 py-3 flex-row items-center gap-3">
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            }}
            className="p-2 rounded-full bg-stone-100 active:opacity-80"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#57534E" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-lg font-sans-extrabold text-stone-900 tracking-tight">
              Item Availability
            </Text>
            <Text className="text-[11px] text-stone-500 font-sans-medium">
              Staff controls for out of stock items
            </Text>
          </View>
          {unlocked && (
            <>
              <Pressable
                onPress={() => void syncNow()}
                className="p-2 rounded-full bg-orange-100 active:opacity-80"
                accessibilityLabel="Sync availability"
              >
                <Ionicons name="sync" size={19} color="#EA580C" />
              </Pressable>
              <Pressable
                onPress={() => void lock()}
                className="p-2 rounded-full bg-stone-100 active:opacity-80"
                accessibilityLabel="Lock staff controls"
              >
                <Ionicons name="lock-closed-outline" size={19} color="#57534E" />
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>

      {!unlocked ? (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            className="bg-white rounded-3xl p-6 border border-white"
            style={{
              shadowColor: "#78716C",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <View className="w-14 h-14 rounded-2xl bg-orange-100 items-center justify-center mb-4">
              <Ionicons name="lock-closed" size={26} color="#EA580C" />
            </View>
            <Text className="text-xl font-sans-extrabold text-stone-900">
              Staff access
            </Text>
            <Text className="text-sm text-stone-500 font-sans-medium mt-1 leading-5">
              Enter your staff key to mark items out of stock or available
              again. Changes are shared with every device.
            </Text>

            <TextInput
              value={staffKey}
              onChangeText={(value) => {
                setStaffKey(value);
                setUnlockError(null);
              }}
              placeholder="Enter staff key"
              placeholderTextColor="#A8A29E"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              className="mt-5 bg-stone-100 border border-stone-200 rounded-2xl px-4 py-3.5 text-base font-sans-semibold text-stone-900"
              onSubmitEditing={() => void handleUnlock()}
              returnKeyType="go"
            />

            {unlockError && (
              <View className="flex-row items-center gap-2 mt-3">
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text className="text-xs text-red-600 font-sans-semibold flex-1">
                  {unlockError}
                </Text>
              </View>
            )}

            <Pressable
              onPress={() => void handleUnlock()}
              disabled={verifying || !staffKey.trim()}
              className={`mt-4 rounded-2xl py-3.5 items-center justify-center flex-row gap-2 ${
                verifying || !staffKey.trim()
                  ? "bg-stone-300"
                  : "bg-orange-600 active:opacity-90"
              }`}
            >
              {verifying ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="key" size={17} color="white" />
                  <Text className="text-white text-sm font-sans-bold">
                    Unlock availability
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          <View className="flex-row items-start gap-2 mt-5 px-2">
            <Ionicons name="information-circle-outline" size={16} color="#78716C" />
            <Text className="text-[11px] text-stone-500 font-sans-medium flex-1 leading-4">
              Ask the outlet manager if you do not have a staff key. The key is
              required only for changing availability.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1 bg-white rounded-2xl px-4 py-3 border border-white">
              <Text className="text-[10px] uppercase tracking-wider text-stone-400 font-sans-bold">
                Out of stock
              </Text>
              <Text className="text-2xl font-sans-extrabold text-red-600 mt-0.5">
                {disabledCount}
              </Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl px-4 py-3 border border-white">
              <Text className="text-[10px] uppercase tracking-wider text-stone-400 font-sans-bold">
                Available
              </Text>
              <Text className="text-2xl font-sans-extrabold text-emerald-600 mt-0.5">
                {Math.max(0, totalItemCount - disabledCount)}
              </Text>
            </View>
          </View>

          <View
            className={`flex-row items-center gap-2 rounded-2xl border px-4 py-3 mb-3 ${statusContent.containerTone}`}
          >
            <Ionicons
              name={statusContent.icon}
              size={17}
              color={
                status === "error"
                  ? "#DC2626"
                  : status === "syncing"
                  ? "#B45309"
                  : lastSyncedAt
                  ? "#047857"
                  : "#57534E"
              }
            />
            <Text
              className={`text-xs font-sans-semibold flex-1 ${statusContent.textTone}`}
            >
              {statusContent.text}
            </Text>
            {status === "error" && (
              <Pressable
                onPress={() => void syncNow()}
                className="bg-white/70 border border-red-200 rounded-full px-3 py-1 active:opacity-80"
              >
                <Text className="text-[10px] font-sans-bold text-red-700">
                  RETRY
                </Text>
              </Pressable>
            )}
          </View>

          <View className="flex-row items-center gap-2 bg-white rounded-2xl px-3.5 py-2.5 border border-white mb-4">
            <Ionicons name="search" size={17} color="#A8A29E" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search items or categories"
              placeholderTextColor="#A8A29E"
              className="flex-1 text-sm font-sans-medium text-stone-800"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} className="p-0.5">
                <Ionicons name="close-circle" size={18} color="#A8A29E" />
              </Pressable>
            )}
          </View>

          {loading && (
            <View className="flex-row items-center justify-center gap-2 py-6">
              <ActivityIndicator color="#EA580C" />
              <Text className="text-xs text-stone-500 font-sans-medium">
                Loading saved availability…
              </Text>
            </View>
          )}

          {groups.map((group) => {
            const available = group.rows.filter((row) => !row.disabled).length;
            const allOut = group.rows.length > 0 && available === 0;

            return (
              <View key={group.id} className="mb-4">
                <View className="flex-row items-center justify-between px-1 mb-2">
                  <Text className="text-xs uppercase tracking-wider text-stone-500 font-sans-bold">
                    {group.name}
                  </Text>
                  <View
                    className={`rounded-full px-2 py-0.5 ${
                      allOut ? "bg-red-100" : "bg-stone-200"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-sans-bold ${
                        allOut ? "text-red-600" : "text-stone-600"
                      }`}
                    >
                      {allOut
                        ? "ALL OUT OF STOCK"
                        : `${available}/${group.rows.length} available`}
                    </Text>
                  </View>
                </View>

                <View className="bg-white rounded-3xl border border-white overflow-hidden">
                  {group.rows.map((row, index) => (
                    <View
                      key={row.id}
                      className={`flex-row items-center gap-3 px-4 py-3 ${
                        index > 0 ? "border-t border-stone-100" : ""
                      } ${row.disabled ? "bg-red-50/40" : ""}`}
                    >
                      <View
                        className={`w-9 h-9 rounded-xl items-center justify-center ${
                          row.disabled ? "bg-red-100" : "bg-emerald-100"
                        }`}
                      >
                        <Ionicons
                          name={row.disabled ? "close-circle" : "checkmark-circle"}
                          size={19}
                          color={row.disabled ? "#DC2626" : "#059669"}
                        />
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`text-sm font-sans-semibold ${
                            row.disabled ? "text-stone-500" : "text-stone-900"
                          }`}
                        >
                          {row.name}
                        </Text>
                        {row.subtitle && (
                          <Text
                            className="text-[11px] text-stone-400 font-sans-medium mt-0.5"
                            numberOfLines={1}
                          >
                            {row.subtitle}
                          </Text>
                        )}
                        <Text
                          className={`text-[10px] font-sans-bold mt-0.5 ${
                            row.disabled ? "text-red-500" : "text-emerald-600"
                          }`}
                        >
                          {row.disabled ? "OUT OF STOCK" : "AVAILABLE"}
                        </Text>
                        {row.reason && (
                          <Text className="text-[10px] text-amber-600 font-sans-medium mt-0.5">
                            {row.reason}
                          </Text>
                        )}
                      </View>
                      <Switch
                        value={!row.disabled}
                        disabled={row.autoOutOfStock}
                        onValueChange={(availableNow) =>
                          setItemDisabled(row.id, !availableNow)
                        }
                        trackColor={{ false: "#FCA5A5", true: "#6EE7B7" }}
                        thumbColor={row.disabled ? "#DC2626" : "#059669"}
                      />
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          {!loading && groups.length === 0 && (
            <View className="items-center py-10">
              <Ionicons name="search-outline" size={30} color="#A8A29E" />
              <Text className="text-sm text-stone-500 font-sans-medium mt-2">
                No items match “{query}”
              </Text>
            </View>
          )}

          <View className="flex-row items-start gap-2 px-2 mt-1">
            <Ionicons name="information-circle-outline" size={16} color="#78716C" />
            <Text className="text-[11px] text-stone-500 font-sans-medium flex-1 leading-4">
              When every item inside a category is out of stock, that category’s
              card on the main menu is marked out of stock too. Combos are
              disabled automatically when a fixed item is out of stock or when
              every option in a choice is out of stock.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
