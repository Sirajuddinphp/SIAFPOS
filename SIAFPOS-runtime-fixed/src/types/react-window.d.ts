declare module "react-window" {
  import type { ComponentType, CSSProperties, ReactNode } from "react";

  export type ListChildComponentProps<T = unknown> = {
    index: number;
    style: CSSProperties;
    data: T;
    isScrolling?: boolean;
  };

  export type FixedSizeListProps<T = unknown> = {
    height: number;
    itemCount: number;
    itemSize: number;
    width: number | string;
    itemData?: T;
    children: ComponentType<ListChildComponentProps<T>>;
  };

  export function FixedSizeList<T = unknown>(props: FixedSizeListProps<T>): ReactNode;
}
