declare module 'react-native-snap-carousel' {
  import { ComponentType } from 'react';
  import { ViewStyle } from 'react-native';

  interface CarouselProps<T> {
    data: T[];
    renderItem: (info: { item: T; index: number }) => React.ReactNode;
    sliderWidth?: number;
    itemWidth?: number;
    sliderHeight?: number;
    itemHeight?: number;
    vertical?: boolean;
    loop?: boolean;
    loopClonesPerSide?: number;
    inactiveSlideScale?: number;
    inactiveSlideOpacity?: number;
    inactiveSlideShift?: number;
    onSnapToItem?: (index: number) => void;
    useScrollView?: boolean;
    enableMomentum?: boolean;
    lockScrollWhileSnapping?: boolean;
    enableSnap?: boolean;
    decelerationRate?: number | 'fast' | 'normal';
    activeSlideAlignment?: 'start' | 'center' | 'end';
    containerCustomStyle?: ViewStyle;
    contentContainerCustomStyle?: ViewStyle;
    slideStyle?: ViewStyle;
    firstItem?: number;
    autoplay?: boolean;
    autoplayInterval?: number;
    autoplayDelay?: number;
    callbackOffsetMargin?: number;
    scrollEndDragDebounceValue?: number;
    onScrollIndexChanged?: (index: number) => void;
    onScrollBegin?: () => void;
    onScrollEnd?: (index: number) => void;
  }

  export default class Carousel<T> extends React.Component<CarouselProps<T>> {
    snapToItem: (index: number, animated?: boolean, fireCallback?: boolean) => void;
    snapToNext: (animated?: boolean) => void;
    snapToPrev: (animated?: boolean) => void;
    startAutoplay: (instantly?: boolean) => void;
    stopAutoplay: () => void;
    triggerRenderingHack: () => void;
    currentIndex: () => number;
    currentScrollPosition: () => number;
  }

  export function getInputRangeFromIndexes(
    range: number[],
    index: number,
    carouselProps: CarouselProps<any>
  ): number[];

  export function getScrollInterpolator(
    index: number,
    carouselProps: CarouselProps<any>
  ): (index: number) => number;

  export function getSlideInterpolatedStyle(
    index: number,
    animatedValue: any,
    carouselProps: CarouselProps<any>,
    animateTransitions?: boolean,
    animateWhenScrolling?: boolean
  ): any;

  export const Carousel: typeof Carousel;
  export const getInputRangeFromIndexes: typeof getInputRangeFromIndexes;
  export const getScrollInterpolator: typeof getScrollInterpolator;
  export const getSlideInterpolatedStyle: typeof getSlideInterpolatedStyle;
}
