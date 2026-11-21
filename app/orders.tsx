import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { Rect, Svg, Text as SvgText } from "react-native-svg";
import { useDisabledItems } from "../context/DisabledItemsContext";
import { categories, combosCategory } from "../data/products";
import {
  getOrderAnalytics,
  getTodaysOrders,
  updateOrderStatus,
  type AdminOrder,
  type AnalyticsDay,
  type AnalyticsItem,
  type BackendOrderItem,
  type OrderAnalytics,
  type OrderStatus,
} from "../services/api";
import Sheet from "../components/Sheet";
import {
  formatOrderDuration,
  getOrderElapsedMs,
  isLateOrder,
  orderProgressColor,
} from "../utils/orderDisplay";

const REFRESH_SECONDS = 30;
const ALERT_DURATION_MS = 60_000;
const ALERT_SOUND = require("../assets/sound/notification.wav");

type TabKey = "new" | "accepted" | "delivered" | "cancelled";

const TABS: { key: TabKey; label: string }[] = [
  { key: "new", label: "New" },
  { key: "accepted", label: "Accepted" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_ACTIONS: {
  label: string;
  status: OrderStatus;
  className: string;
  textClassName: string;
}[] = [
  {
    label: "Accept",
    status: "accepted",
    className: "bg-emerald-50 border-emerald-100",
    textClassName: "text-emerald-700",
  },
  {
    label: "Delivered",
    status: "delivered",
    className: "bg-sky-50 border-sky-100",
    textClassName: "text-sky-700",
  },
  {
    label: "Cancel",
    status: "cancelled",
    className: "bg-red-50 border-red-100",
    textClassName: "text-red-600",
  },
];

function sourceLabel(order: AdminOrder): string {
  if (order.tableNumber) return `Table ${order.tableNumber}`;
  if (order.counterNumber) return `Counter ${order.counterNumber}`;
  return "Delivery";
}

function matchesTab(order: AdminOrder, tab: TabKey): boolean {
  if (tab === "new") return order.orderStatus === "placed";
  return order.orderStatus === tab;
}

function statusStyle(status: string): string {
  if (status === "placed") return "bg-orange-50 text-orange-700";
  if (status === "accepted") return "bg-emerald-50 text-emerald-700";
  if (status === "delivered") return "bg-sky-50 text-sky-700";
  return "bg-red-50 text-red-600";
}

interface OrderStats {
  total: number;
  placed: number;
  accepted: number;
  delivered: number;
  cancelled: number;
  revenue: number;
  itemsSold: number;
  avgOrder: number;
  coinsUsed: number;
  coinsEarned: number;
  tableOrders: number;
  counterOrders: number;
  deliveryOrders: number;
}

function buildStats(orders: AdminOrder[]): OrderStats {
  const billable = orders.filter((order) => order.orderStatus !== "cancelled");
  const revenue = billable.reduce((sum, order) => sum + (order.finalAmount ?? 0), 0);
  const itemsSold = billable.reduce(
    (sum, order) =>
      sum + order.items.reduce((count, item) => count + (item.quantity ?? 0), 0),
    0
  );

  return {
    total: orders.length,
    placed: orders.filter((order) => order.orderStatus === "placed").length,
    accepted: orders.filter((order) => order.orderStatus === "accepted").length,
    delivered: orders.filter((order) => order.orderStatus === "delivered").length,
    cancelled: orders.filter((order) => order.orderStatus === "cancelled").length,
    revenue,
    itemsSold,
    avgOrder: billable.length ? Math.round(revenue / billable.length) : 0,
    coinsUsed: orders.reduce((sum, order) => sum + (order.coinsUsed ?? 0), 0),
    coinsEarned: orders.reduce((sum, order) => sum + (order.coinsEarned ?? 0), 0),
    tableOrders: orders.filter((order) => !!order.tableNumber).length,
    counterOrders: orders.filter((order) => !!order.counterNumber).length,
    deliveryOrders: orders.filter(
      (order) => !order.tableNumber && !order.counterNumber
    ).length,
  };
}

function StatCell({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View className="flex-1 items-center py-2">
      <Ionicons name={icon} size={16} color={color} />
      <Text className="text-base font-sans-extrabold text-stone-900 mt-1">{value}</Text>
      <Text className="text-[10px] text-stone-400 font-sans-medium text-center">{label}</Text>
    </View>
  );
}

function StatsPanel({ stats }: { stats: OrderStats }) {
  const [expanded, setExpanded] = useState(false);

  const rows: { label: string; count: number; color: string; bg: string }[] = [
    { label: "New", count: stats.placed, color: "#EA580C", bg: "bg-orange-500" },
    { label: "Accepted", count: stats.accepted, color: "#059669", bg: "bg-emerald-500" },
    { label: "Delivered", count: stats.delivered, color: "#0284C7", bg: "bg-sky-500" },
    { label: "Cancelled", count: stats.cancelled, color: "#DC2626", bg: "bg-red-500" },
  ];

  return (
    <View className="mx-4 mt-3 bg-white rounded-3xl border border-stone-100 px-4 py-3">
      <Pressable
        onPress={() => setExpanded((value) => !value)}
        className="flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-2">
          <Ionicons name="stats-chart" size={17} color="#EA580C" />
          <Text className="text-sm font-sans-extrabold text-stone-900">Today&apos;s summary</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="text-[10px] font-sans-semibold text-stone-400">
            {expanded ? "Hide" : "Details"}
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color="#A8A29E"
          />
        </View>
      </Pressable>

      <View className="flex-row mt-2 pt-1 border-t border-stone-100">
        <StatCell label="Orders" value={String(stats.total)} icon="receipt-outline" color="#EA580C" />
        <StatCell label="Sales" value={`₹${stats.revenue}`} icon="cash-outline" color="#059669" />
        <StatCell label="Items" value={String(stats.itemsSold)} icon="cart-outline" color="#0284C7" />
        <StatCell label="Avg / order" value={`₹${stats.avgOrder}`} icon="trending-up-outline" color="#7C3AED" />
      </View>

      {expanded ? (
        <View className="border-t border-stone-100 mt-1 pt-3">
          <Text className="text-[10px] text-stone-400 font-sans-bold uppercase tracking-wide mb-2">
            By status
          </Text>
          {rows.map((row) => (
            <View key={row.label} className="flex-row items-center gap-2 mb-2">
              <Text className="text-[11px] text-stone-600 font-sans-medium w-[60px]">
                {row.label}
              </Text>
              <View className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                <View
                  className={`h-full rounded-full ${row.bg}`}
                  style={{
                    width: `${
                      stats.total ? Math.round((row.count / stats.total) * 100) : 0
                    }%`,
                  }}
                />
              </View>
              <Text className="text-[11px] font-sans-bold text-stone-800 w-6 text-right">
                {row.count}
              </Text>
            </View>
          ))}

          <View className="flex-row flex-wrap mt-3 pt-3 border-t border-stone-100">
            <View className="w-1/2 mb-2">
              <Text className="text-[10px] text-stone-400 font-sans-medium">Coins used</Text>
              <Text className="text-xs font-sans-bold text-stone-800">🪙 {stats.coinsUsed}</Text>
            </View>
            <View className="w-1/2 mb-2">
              <Text className="text-[10px] text-stone-400 font-sans-medium">Coins earned</Text>
              <Text className="text-xs font-sans-bold text-stone-800">🪙 {stats.coinsEarned}</Text>
            </View>
            <View className="w-1/3">
              <Text className="text-[10px] text-stone-400 font-sans-medium">Table</Text>
              <Text className="text-xs font-sans-bold text-stone-800">{stats.tableOrders}</Text>
            </View>
            <View className="w-1/3">
              <Text className="text-[10px] text-stone-400 font-sans-medium">Counter</Text>
              <Text className="text-xs font-sans-bold text-stone-800">{stats.counterOrders}</Text>
            </View>
            <View className="w-1/3">
              <Text className="text-[10px] text-stone-400 font-sans-medium">Delivery</Text>
              <Text className="text-xs font-sans-bold text-stone-800">{stats.deliveryOrders}</Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const CHART_DAYS = 14;

function recentDates(count: number): string[] {
  const now = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  return Array.from(
    { length: count },
    (_, index) =>
      new Date(todayUtc - (count - 1 - index) * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)
  );
}

function SalesChart({ daily }: { daily: AnalyticsDay[] }) {
  const days = useMemo(() => {
    const byDate = new Map(daily.map((day) => [day.date, day]));
    return recentDates(CHART_DAYS).map(
      (date) =>
        byDate.get(date) ?? { date, orders: 0, itemsSold: 0, revenue: 0 }
    );
  }, [daily]);

  const maxItems = Math.max(1, ...days.map((day) => day.itemsSold));
  const maxRevenue = Math.max(1, ...days.map((day) => day.revenue));
  const dayWidth = 58;
  const plotHeight = 120;

  return (
    <View>
      <View className="flex-row items-center gap-4 mb-2">
        <View className="flex-row items-center gap-1.5">
          <View className="w-2.5 h-2.5 rounded-sm bg-orange-600" />
          <Text className="text-[10px] text-stone-500 font-sans-semibold">
            Items sold
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
          <Text className="text-[10px] text-stone-500 font-sans-semibold">
            Revenue (₹)
          </Text>
        </View>
      </View>
      <ScrollView horizontal showsVerticalScrollIndicator={false}>
        <Svg width={dayWidth * days.length} height={plotHeight + 20}>
          {days.map((day, index) => {
            const left = index * dayWidth;
            const itemHeight = (day.itemsSold / maxItems) * plotHeight;
            const revenueHeight = (day.revenue / maxRevenue) * plotHeight;
            return (
              <Fragment key={day.date}>
                <Rect
                  x={left + 8}
                  y={plotHeight - itemHeight}
                  width={14}
                  height={itemHeight}
                  rx={3}
                  fill="#EA580C"
                />
                <Rect
                  x={left + 30}
                  y={plotHeight - revenueHeight}
                  width={14}
                  height={revenueHeight}
                  rx={3}
                  fill="#059669"
                />
                {day.itemsSold > 0 ? (
                  <SvgText
                    x={left + 15}
                    y={plotHeight - itemHeight - 4}
                    fontSize={9}
                    textAnchor="middle"
                    fill="#57534E"
                  >
                    {day.itemsSold}
                  </SvgText>
                ) : null}
                {day.revenue > 0 ? (
                  <SvgText
                    x={left + 37}
                    y={plotHeight - revenueHeight - 4}
                    fontSize={9}
                    textAnchor="middle"
                    fill="#57534E"
                  >
                    {day.revenue}
                  </SvgText>
                ) : null}
                <SvgText
                  x={left + 29}
                  y={plotHeight + 15}
                  fontSize={9}
                  textAnchor="middle"
                  fill="#A8A29E"
                >
                  {day.date.slice(8)}
                </SvgText>
              </Fragment>
            );
          })}
        </Svg>
      </ScrollView>
      <Text className="text-[10px] text-stone-400 font-sans-medium mt-1">
        Peak: {maxItems} items · ₹{maxRevenue} per day · last {CHART_DAYS} days
      </Text>
    </View>
  );
}

function shortLabel(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function ItemSalesChart({ items }: { items: AnalyticsItem[] }) {
  const rows = useMemo(() => {
    const baseName = (name: string) => name.split(" · ")[0].trim();
    const result: {
      name: string;
      category: string;
      quantity: number;
      revenue: number;
    }[] = [];

    for (const category of [...categories, combosCategory]) {
      for (const sub of category.subcategories) {
        const name = baseName(sub.name);
        if (result.some((row) => row.name === name)) continue;
        const matches = items.filter((item) => baseName(item.name) === name);
        result.push({
          name,
          category: category.name,
          quantity: matches.reduce((sum, item) => sum + item.quantity, 0),
          revenue: matches.reduce((sum, item) => sum + item.revenue, 0),
        });
      }
    }

    for (const item of items) {
      if (!result.some((row) => row.name === baseName(item.name))) {
        result.push({
          name: item.name,
          category: "Other",
          quantity: item.quantity,
          revenue: item.revenue,
        });
      }
    }

    return result;
  }, [items]);

  const maxQuantity = Math.max(1, ...rows.map((row) => row.quantity));
  const maxRevenue = Math.max(1, ...rows.map((row) => row.revenue));
  const rowWidth = 64;
  const plotHeight = 110;

  return (
    <View>
      <View className="flex-row items-center gap-4 mb-2">
        <View className="flex-row items-center gap-1.5">
          <View className="w-2.5 h-2.5 rounded-sm bg-orange-600" />
          <Text className="text-[10px] text-stone-500 font-sans-semibold">
            Qty sold
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
          <Text className="text-[10px] text-stone-500 font-sans-semibold">
            Net value (₹)
          </Text>
        </View>
      </View>
      <ScrollView horizontal showsVerticalScrollIndicator={false}>
        <Svg width={rowWidth * rows.length} height={plotHeight + 32}>
          {rows.map((row, index) => {
            const left = index * rowWidth;
            const quantityHeight = (row.quantity / maxQuantity) * plotHeight;
            const revenueHeight = (row.revenue / maxRevenue) * plotHeight;
            return (
              <Fragment key={`${row.category}-${row.name}`}>
                <Rect
                  x={left + 8}
                  y={plotHeight - quantityHeight}
                  width={14}
                  height={quantityHeight}
                  rx={3}
                  fill="#EA580C"
                />
                <Rect
                  x={left + 34}
                  y={plotHeight - revenueHeight}
                  width={14}
                  height={revenueHeight}
                  rx={3}
                  fill="#059669"
                />
                {row.quantity > 0 ? (
                  <SvgText
                    x={left + 15}
                    y={plotHeight - quantityHeight - 4}
                    fontSize={8}
                    textAnchor="middle"
                    fill="#57534E"
                  >
                    {row.quantity}
                  </SvgText>
                ) : null}
                {row.revenue > 0 ? (
                  <SvgText
                    x={left + 41}
                    y={plotHeight - revenueHeight - 4}
                    fontSize={8}
                    textAnchor="middle"
                    fill="#57534E"
                  >
                    {row.revenue}
                  </SvgText>
                ) : null}
                <SvgText
                  x={left + 32}
                  y={plotHeight + 13}
                  fontSize={8}
                  textAnchor="middle"
                  fill="#A8A29E"
                >
                  {shortLabel(row.category, 12)}
                </SvgText>
                <SvgText
                  x={left + 32}
                  y={plotHeight + 26}
                  fontSize={8}
                  textAnchor="middle"
                  fill="#78716C"
                >
                  {shortLabel(row.name, 14)}
                </SvgText>
              </Fragment>
            );
          })}
        </Svg>
      </ScrollView>
      <Text className="text-[10px] text-stone-400 font-sans-medium mt-1">
        {rows.length} items · peak {maxQuantity} qty / ₹{maxRevenue} · swipe to see all
      </Text>
    </View>
  );
}

function ItemPerformanceList({
  title,
  items,
  color,
}: {
  title: string;
  items: AnalyticsItem[];
  color: string;
}) {
  return (
    <View className="flex-1">
      <Text
        className="text-[11px] font-sans-extrabold uppercase tracking-wide mb-2"
        style={{ color }}
      >
        {title}
      </Text>
      {items.length === 0 ? (
        <Text className="text-[11px] text-stone-400 font-sans-medium">
          No items yet
        </Text>
      ) : (
        items.map((item) => (
          <View key={item.name} className="mb-2">
            <Text numberOfLines={1} className="text-[11px] text-stone-800 font-sans-semibold">
              {item.name}
            </Text>
            <Text className="text-[10px] text-stone-400 font-sans-medium">
              {item.quantity} sold · ₹{item.revenue}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

function AnalyticsSheet({
  visible,
  onClose,
  analytics,
  loading,
  error,
}: {
  visible: boolean;
  onClose: () => void;
  analytics: OrderAnalytics | null;
  loading: boolean;
  error: string | null;
}) {
  const topItems = analytics?.items.slice(0, 5) ?? [];
  const bottomItems = (analytics?.items ?? [])
    .slice(-5)
    .reverse()
    .filter((item) => !topItems.some((top) => top.name === item.name));

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      sheetClassName="px-5 pt-0 pb-6"
      sheetStyle={{ maxHeight: "88%" }}
    >
      <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
        <Text className="text-base font-sans-extrabold text-stone-900 mb-1">
          Sales analytics
        </Text>
        <Text className="text-[11px] text-stone-400 font-sans-medium mb-3">
          All-time totals and daily performance
        </Text>

        {loading ? (
          <ActivityIndicator color="#EA580C" />
        ) : error ? (
          <Text className="text-xs text-red-600 font-sans-semibold">{error}</Text>
        ) : analytics ? (
          <>
            <View className="flex-row bg-stone-50 rounded-2xl py-2 mb-4">
              <StatCell
                label="Orders"
                value={String(analytics.lifetime.orders)}
                icon="receipt-outline"
                color="#EA580C"
              />
              <StatCell
                label="Items sold"
                value={String(analytics.lifetime.itemsSold)}
                icon="cart-outline"
                color="#0284C7"
              />
              <StatCell
                label="Revenue"
                value={`₹${analytics.lifetime.revenue}`}
                icon="cash-outline"
                color="#059669"
              />
            </View>

            <Text className="text-[11px] text-stone-500 font-sans-extrabold uppercase tracking-wide mb-2">
              Items by category · quantity &amp; net value (lifetime)
            </Text>
            <ItemSalesChart items={analytics.items} />

            <View className="h-px bg-stone-100 my-4" />
            <Text className="text-[11px] text-stone-500 font-sans-extrabold uppercase tracking-wide mb-2">
              Daily items sold &amp; revenue
            </Text>
            <SalesChart daily={analytics.daily} />

            <View className="h-px bg-stone-100 my-4" />
            <View className="flex-row gap-4">
              <ItemPerformanceList title="Top items" items={topItems} color="#059669" />
              <ItemPerformanceList
                title="Least performing"
                items={bottomItems}
                color="#DC2626"
              />
            </View>
          </>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}

function ItemRow({ item }: { item: BackendOrderItem }) {
  return (
    <View className="flex-row items-start justify-between py-2 border-b border-stone-100">
      <View className="flex-1 pr-3">
        <Text className="text-xs text-stone-800 font-sans-semibold">{item.name}</Text>
        <Text className="text-[10px] text-stone-400 font-sans-medium mt-0.5">
          ₹{item.price} × {item.quantity}
        </Text>
      </View>
      <Text className="text-xs text-stone-900 font-sans-extrabold">
        ₹{item.price * item.quantity}
      </Text>
    </View>
  );
}

function OrderDetailSheet({
  order,
  onClose,
  onStatusUpdate,
  updatingId,
}: {
  order: AdminOrder | null;
  onClose: () => void;
  onStatusUpdate: (order: AdminOrder, status: OrderStatus) => void;
  updatingId: string | null;
}) {
  if (!order) return null;

  const elapsed = getOrderElapsedMs(order.createdAt);
  const late = isLateOrder(order, elapsed);

  return (
    <Sheet visible={!!order} onClose={onClose} sheetStyle={{ maxHeight: "88%" }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between pb-3">
          <View className="flex-1 pr-3">
            <Text className="text-lg font-sans-extrabold text-stone-900">
              {order.orderId || `#${order._id.slice(-6).toUpperCase()}`}
            </Text>
            <Text
              className="text-[11px] font-sans-semibold mt-0.5"
              style={{ color: orderProgressColor(elapsed) }}
            >
              Placed {formatOrderDuration(elapsed)} ago ·{" "}
              {new Date(order.createdAt).toLocaleString()}
            </Text>
          </View>
          <Pressable onPress={onClose} className="p-2 rounded-full bg-stone-100">
            <Ionicons name="close" size={18} color="#57534E" />
          </Pressable>
        </View>

        <View className="flex-row items-center gap-2 flex-wrap pb-3">
          <View className={`rounded-full px-2.5 py-1 ${statusStyle(order.orderStatus)}`}>
            <Text className="text-[10px] font-sans-bold capitalize">{order.orderStatus}</Text>
          </View>
          {late ? (
            <View className="bg-red-500 rounded-full px-2.5 py-1">
              <Text className="text-[10px] font-sans-bold text-white">
                Late · {formatOrderDuration(elapsed)}
              </Text>
            </View>
          ) : null}
          <View className="bg-orange-50 rounded-full px-2.5 py-1">
            <Text className="text-[10px] font-sans-bold text-orange-700">
              {sourceLabel(order)}
            </Text>
          </View>
        </View>

        {(order.customerName || order.customerMobile) && (
          <View className="bg-stone-50 rounded-2xl px-3 py-2.5 mb-3 flex-row items-center gap-2 flex-wrap">
            <Ionicons name="person-outline" size={15} color="#78716C" />
            {order.customerName ? (
              <Text className="text-xs text-stone-700 font-sans-semibold">{order.customerName}</Text>
            ) : null}
            {order.customerMobile ? (
              <Text className="text-xs text-stone-500 font-sans-medium">📱 {order.customerMobile}</Text>
            ) : null}
          </View>
        )}

        <Text className="text-[11px] text-stone-400 font-sans-bold uppercase tracking-wide mb-1">
          Items ({order.items.length})
        </Text>
        <View className="border-t border-stone-200">
          {order.items.map((item, index) => (
            <ItemRow key={`${item.name}-${index}`} item={item} />
          ))}
        </View>

        <View className="mt-4 bg-white rounded-2xl border border-stone-100 px-3 py-2">
          <View className="flex-row items-center justify-between py-1.5">
            <Text className="text-xs text-stone-500 font-sans-medium">Subtotal</Text>
            <Text className="text-xs text-stone-700 font-sans-semibold">₹{order.totalAmount ?? 0}</Text>
          </View>
          {order.coinsUsed > 0 && (
            <View className="flex-row items-center justify-between py-1.5">
              <Text className="text-xs text-emerald-600 font-sans-medium">Coins used</Text>
              <Text className="text-xs text-emerald-600 font-sans-semibold">−₹{order.coinsUsed}</Text>
            </View>
          )}
          <View className="flex-row items-center justify-between py-1.5">
            <Text className="text-xs text-stone-500 font-sans-medium">Delivery</Text>
            <Text className="text-xs text-stone-700 font-sans-semibold">₹{order.deliveryFee ?? 0}</Text>
          </View>
          <View className="flex-row items-center justify-between py-2 border-t border-stone-100 mt-1">
            <Text className="text-sm font-sans-bold text-stone-900">Final total</Text>
            <Text className="text-base font-sans-extrabold text-orange-600">₹{order.finalAmount}</Text>
          </View>
        </View>

        <View className="flex-row gap-2 mt-4 flex-wrap">
          {STATUS_ACTIONS.map((action) => {
            const isCurrent = order.orderStatus === action.status;
            const isUpdating = updatingId === order._id;
            return (
              <Pressable
                key={action.status}
                onPress={() => onStatusUpdate(order, action.status)}
                disabled={isCurrent || isUpdating}
                className={`flex-row items-center gap-1.5 border rounded-full px-3 py-1.5 ${
                  isCurrent || isUpdating ? "opacity-40" : "active:opacity-80"
                } ${action.className}`}
              >
                {isUpdating ? <ActivityIndicator size="small" color="#57534E" /> : null}
                <Text className={`text-[11px] font-sans-bold ${action.textClassName}`}>
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Sheet>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const { unlock, lock, unlocked, verifying } = useDisabledItems();

  const [staffKey, setStaffKey] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("new");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);
  const [analytics, setAnalytics] = useState<OrderAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const [secondsLeft, setSecondsLeft] = useState(REFRESH_SECONDS);
  const secondsRef = useRef(REFRESH_SECONDS);
  const refreshingRef = useRef(false);
  const knownIdsRef = useRef<Set<string> | null>(null);

  const [alertOrderIds, setAlertOrderIds] = useState<string[]>([]);
  const alertIdsRef = useRef<string[]>([]);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const hasAccess = unlocked && staffKey.length > 0;
  const refreshCountdown = `00:${String(secondsLeft).padStart(2, "0")}`;

  const stopAlert = useCallback(async () => {
    if (alertTimerRef.current) {
      clearTimeout(alertTimerRef.current);
      alertTimerRef.current = null;
    }
    alertIdsRef.current = [];
    setAlertOrderIds([]);
    const sound = soundRef.current;
    soundRef.current = null;
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch {
        // sound may already be unloaded
      }
    }
  }, []);

  const startAlert = useCallback(
    async (ids: string[]) => {
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      alertIdsRef.current = ids;
      setAlertOrderIds(ids);

      alertTimerRef.current = setTimeout(() => {
        void stopAlert();
      }, ALERT_DURATION_MS);

      try {
        const existing = soundRef.current;
        if (existing) {
          await existing.unloadAsync();
        }
        const { sound } = await Audio.Sound.createAsync(ALERT_SOUND, {
          isLooping: true,
          volume: 1.0,
        });
        soundRef.current = sound;
        await sound.playAsync();
      } catch {
        // Audio unavailable (e.g. web without permission) - banner still shown
      }
    },
    [stopAlert]
  );

  useEffect(() => {
    return () => {
      void lock();
      void stopAlert();
    };
  }, [lock, stopAlert]);

  const handleLoadError = useCallback(
    (err: unknown) => {
      const message = err instanceof Error ? err.message : "Could not load orders";
      if (message.toLowerCase().includes("invalid staff key")) {
        setStaffKey("");
        setOrders([]);
        knownIdsRef.current = null;
        void lock();
        setUnlockError("That staff key is not valid. Please try again.");
      } else {
        setLoadError(message);
      }
    },
    [lock]
  );

  const refreshOrders = useCallback(
    async (silent = false) => {
      if (refreshingRef.current) return;
      refreshingRef.current = true;
      if (!silent) setLoading(true);
      try {
        const data = await getTodaysOrders(staffKey);
        const previous = knownIdsRef.current;
        knownIdsRef.current = new Set(data.orders.map((order) => order._id));

        const newIds = previous
          ? data.orders
              .filter(
                (order) =>
                  order.orderStatus === "placed" && !previous.has(order._id)
              )
              .map((order) => order._id)
          : [];

        setOrders(data.orders);
        setLoadError(null);

        if (newIds.length > 0) {
          void startAlert(newIds);
        }
      } catch (err) {
        handleLoadError(err);
      } finally {
        refreshingRef.current = false;
        secondsRef.current = REFRESH_SECONDS;
        setLoading(false);
        setSecondsLeft(REFRESH_SECONDS);
      }
    },
    [handleLoadError, staffKey, startAlert]
  );

  useEffect(() => {
    if (!unlocked || !staffKey) return;

    secondsRef.current = REFRESH_SECONDS;
    void Promise.resolve().then(() => refreshOrders());
    const interval = setInterval(() => {
      secondsRef.current -= 1;
      if (secondsRef.current <= 0) {
        secondsRef.current = REFRESH_SECONDS;
        void refreshOrders(true);
      }
      setSecondsLeft(secondsRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, [unlocked, staffKey, refreshOrders]);

  useEffect(() => {
    if (alertIdsRef.current.length === 0) return;
    const stillPlaced = alertIdsRef.current.some((id) =>
      orders.some((order) => order._id === id && order.orderStatus === "placed")
    );
    if (!stillPlaced) void stopAlert();
  }, [orders, stopAlert]);

  const handleUnlock = async () => {
    const ok = await unlock(staffKey);
    if (!ok) {
      setUnlockError("That staff key is not valid. Please try again.");
      return;
    }
    setUnlockError(null);
    setLoading(true);
  };

  const openAnalytics = async () => {
    setAnalyticsVisible(true);
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      setAnalytics(await getOrderAnalytics(staffKey));
    } catch (err) {
      setAnalyticsError(
        err instanceof Error ? err.message : "Could not load analytics"
      );
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleStatusUpdate = async (order: AdminOrder, status: OrderStatus) => {
    if (updatingId) return;
    setUpdatingId(order._id);
    setLoadError(null);
    try {
      await updateOrderStatus(order.orderId || order._id, staffKey, status);
      setOrders((current) =>
        current.map((item) =>
          item._id === order._id ? { ...item, orderStatus: status } : item
        )
      );
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not update order");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLock = () => {
    setStaffKey("");
    setOrders([]);
    knownIdsRef.current = null;
    setAnalyticsVisible(false);
    setUnlockError(null);
    void stopAlert();
    void lock();
  };

  const visibleOrders = orders.filter((order) => matchesTab(order, activeTab));
  const selectedOrder = orders.find((order) => order._id === selectedOrderId) ?? null;
  const alertCount = alertOrderIds.length;
  const stats = buildStats(orders);

  return (
    <View className="flex-1 bg-stone-100">
      <SafeAreaView edges={["top"]} className="bg-white/90 border-b border-stone-200">
        <View className="px-4 py-3 flex-row items-center gap-3">
          <Pressable
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/");
            }}
            className="p-2 rounded-full bg-stone-100 active:opacity-80"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#57534E" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-lg font-sans-extrabold text-stone-900 tracking-tight">
              Orders Management
            </Text>
            <Text className="text-[11px] text-stone-500 font-sans-medium">
              Staff access to all orders
            </Text>
          </View>
          {hasAccess && (
            <>
              <Pressable
                onPress={() => void openAnalytics()}
                className="p-2 rounded-full bg-orange-100 active:opacity-80"
                accessibilityLabel="View sales analytics"
              >
                <Ionicons name="bar-chart" size={19} color="#EA580C" />
              </Pressable>
              <Pressable
                onPress={() => void refreshOrders()}
                className="p-2 rounded-full bg-orange-100 active:opacity-80"
                accessibilityLabel="Refresh orders"
              >
                <Ionicons name="refresh" size={19} color="#EA580C" />
              </Pressable>
              <Pressable
                onPress={handleLock}
                className="p-2 rounded-full bg-stone-100 active:opacity-80"
                accessibilityLabel="Lock staff access"
              >
                <Ionicons name="lock-closed-outline" size={19} color="#57534E" />
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>

      {!hasAccess ? (
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
            <Text className="text-xl font-sans-extrabold text-stone-900">Staff access</Text>
            <Text className="text-sm text-stone-500 font-sans-medium mt-1 leading-5">
              Enter your staff key to view and manage all customer orders.
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
            {unlockError ? (
              <View className="flex-row items-center gap-2 mt-3">
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text className="text-xs text-red-600 font-sans-semibold flex-1">{unlockError}</Text>
              </View>
            ) : null}
            <Pressable
              onPress={() => void handleUnlock()}
              disabled={verifying || !staffKey.trim()}
              className={`mt-4 rounded-2xl py-3.5 items-center justify-center flex-row gap-2 ${
                verifying || !staffKey.trim() ? "bg-stone-300" : "bg-orange-600 active:opacity-90"
              }`}
            >
              {verifying ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="key" size={17} color="white" />
                  <Text className="text-white text-sm font-sans-bold">Unlock orders</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          {alertCount > 0 && (
            <Pressable
              onPress={() => {
                setActiveTab("new");
                void stopAlert();
              }}
              className="mx-4 mt-3 bg-red-600 rounded-2xl px-4 py-3 flex-row items-center gap-3 active:opacity-90"
            >
              <Ionicons name="notifications" size={22} color="white" />
              <View className="flex-1">
                <Text className="text-white text-sm font-sans-extrabold">
                  🔔 NEW ORDER{alertCount > 1 ? `S` : ""} — {alertCount}
                </Text>
                <Text className="text-white/80 text-[10px] font-sans-medium">
                  Tap to view & silence
                </Text>
              </View>
              <Ionicons name="volume-high" size={20} color="white" />
            </Pressable>
          )}

          <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
            <Text className="text-sm text-stone-500 font-sans-semibold">
              {loading ? "Loading orders…" : `${visibleOrders.length} orders`}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="time-outline" size={13} color="#A8A29E" />
              <Text className="text-[11px] text-stone-400 font-sans-medium">
                Refresh in {refreshCountdown}
              </Text>
            </View>
          </View>

          {loadError ? (
            <View className="mx-4 mb-2 flex-row items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text className="text-xs text-red-700 font-sans-semibold flex-1">{loadError}</Text>
            </View>
          ) : null}

          <StatsPanel stats={stats} />

          <View className="flex-row mx-4 mb-2 mt-3 bg-white rounded-2xl p-1 border border-stone-200">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              const count = orders.filter((order) => matchesTab(order, tab.key)).length;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className={`flex-1 rounded-xl py-2 items-center ${active ? "bg-orange-600" : ""}`}
                >
                  <Text
                    className={`text-[11px] font-sans-bold ${active ? "text-white" : "text-stone-500"}`}
                  >
                    {tab.label} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="px-4">
            {!loading && visibleOrders.length === 0 ? (
              <View className="bg-white rounded-3xl py-14 items-center border border-white">
                <Ionicons name="receipt-outline" size={48} color="#D6D3D1" />
                <Text className="text-stone-400 text-sm mt-3 font-sans-medium">
                  No orders in this tab
                </Text>
              </View>
            ) : (
              visibleOrders.map((order) => {
                const elapsed = getOrderElapsedMs(order.createdAt);
                const late = isLateOrder(order, elapsed);
                return (
                <View
                  key={order._id}
                  className={`bg-white rounded-3xl p-4 mb-3 border ${
                    late ? "border-red-300" : "border-white"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-sans-extrabold text-stone-900">
                      {order.orderId || `#${order._id.slice(-6).toUpperCase()}`}
                    </Text>
                    <View className="flex-row items-center gap-1.5">
                      <View className={`rounded-full px-2.5 py-1 ${statusStyle(order.orderStatus)}`}>
                        <Text className="text-[10px] font-sans-bold capitalize">
                          {order.orderStatus}
                        </Text>
                      </View>
                      {late ? (
                        <View className="bg-red-500 rounded-full px-2 py-1">
                          <Text className="text-[10px] font-sans-bold text-white">Late</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <Text
                    className="text-[11px] font-sans-semibold mt-1"
                    style={{ color: orderProgressColor(elapsed) }}
                  >
                    Placed {formatOrderDuration(elapsed)} ago ·{" "}
                    {new Date(order.createdAt).toLocaleString()}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-2 flex-wrap">
                    <View className="bg-orange-50 rounded-full px-2.5 py-1">
                      <Text className="text-[10px] font-sans-bold text-orange-700">
                        {sourceLabel(order)}
                      </Text>
                    </View>
                    {order.customerMobile ? (
                      <Text className="text-[11px] text-stone-600 font-sans-medium">
                        📱 {order.customerMobile}
                      </Text>
                    ) : null}
                    {order.customerName ? (
                      <Text className="text-[11px] text-stone-600 font-sans-medium">
                        {order.customerName}
                      </Text>
                    ) : null}
                  </View>
                  <View className="border-t border-stone-100 mt-3 pt-2">
                    {order.items.slice(0, 3).map((item, index) => (
                      <View key={`${item.name}-${index}`} className="flex-row justify-between py-0.5">
                        <Text className="text-xs text-stone-600 font-sans-medium flex-1" numberOfLines={1}>
                          {item.name} × {item.quantity}
                        </Text>
                        <Text className="text-xs text-stone-800 font-sans-semibold">
                          ₹{item.price * item.quantity}
                        </Text>
                      </View>
                    ))}
                    {order.items.length > 3 ? (
                      <Text className="text-[10px] text-stone-400 font-sans-medium mt-1">
                        +{order.items.length - 3} more items
                      </Text>
                    ) : null}
                  </View>
                  <View className="flex-row items-center justify-between border-t border-stone-100 mt-2 pt-2">
                    <Text className="text-sm font-sans-bold text-stone-900">Final total</Text>
                    <Text className="text-base font-sans-extrabold text-orange-600">
                      ₹{order.finalAmount}
                    </Text>
                  </View>
                  <View className="flex-row gap-2 mt-3 flex-wrap">
                    {STATUS_ACTIONS.map((action) => {
                      const isCurrent = order.orderStatus === action.status;
                      const isUpdating = updatingId === order._id;
                      return (
                        <Pressable
                          key={action.status}
                          onPress={() => void handleStatusUpdate(order, action.status)}
                          disabled={isCurrent || isUpdating}
                          className={`flex-row items-center gap-1.5 border rounded-full px-3 py-1.5 ${
                            isCurrent || isUpdating ? "opacity-40" : "active:opacity-80"
                          } ${action.className}`}
                        >
                          {isUpdating ? <ActivityIndicator size="small" color="#57534E" /> : null}
                          <Text className={`text-[11px] font-sans-bold ${action.textClassName}`}>
                            {action.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Pressable
                    onPress={() => setSelectedOrderId(order._id)}
                    className="mt-3 py-2 flex-row items-center justify-center gap-2 bg-orange-50 rounded-xl active:opacity-80"
                  >
                    <Ionicons name="eye-outline" size={17} color="#EA580C" />
                    <Text className="text-xs font-sans-bold text-orange-700">View full details</Text>
                  </Pressable>
                </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      <OrderDetailSheet
        order={selectedOrder}
        onClose={() => setSelectedOrderId(null)}
        onStatusUpdate={(order, status) => void handleStatusUpdate(order, status)}
        updatingId={updatingId}
      />
      <AnalyticsSheet
        visible={analyticsVisible}
        onClose={() => setAnalyticsVisible(false)}
        analytics={analytics}
        loading={analyticsLoading}
        error={analyticsError}
      />
    </View>
  );
}
