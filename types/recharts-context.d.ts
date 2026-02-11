declare module "recharts/lib/context/chartLayoutContext" {
  export interface ChartOffset {
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
    width?: number;
    height?: number;
  }
  export function useOffset(): ChartOffset;
  export function useChartHeight(): number;
}
