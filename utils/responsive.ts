import { useWindowDimensions } from "react-native";

export const MAX_CONTENT_WIDTH = 1200;
export const PAGE_PADDING = 16;
export const GRID_GAP = 12;

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const columns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const cardWidth =
    (contentWidth - PAGE_PADDING * 2 - GRID_GAP * (columns - 1)) / columns;

  return {
    width,
    height,
    columns,
    contentWidth,
    cardWidth,
    isTablet: width >= 768,
    isDesktop: width >= 1024,
  };
}
