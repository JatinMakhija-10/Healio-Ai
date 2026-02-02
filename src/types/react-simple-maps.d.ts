// Type declarations for react-simple-maps
declare module 'react-simple-maps' {
    import { ComponentType, ReactNode } from 'react';

    export interface ComposableMapProps {
        projection?: string;
        projectionConfig?: {
            rotate?: [number, number, number];
            center?: [number, number];
            scale?: number;
        };
        width?: number;
        height?: number;
        style?: React.CSSProperties;
        className?: string;
        children?: ReactNode;
    }

    export interface GeographiesProps {
        geography: string | object;
        children: (geographies: { geographies: Geography[] }) => ReactNode;
    }

    export interface Geography {
        rsmKey: string;
        properties: {
            name?: string;
            [key: string]: any;
        };
        geometry: object;
    }

    export interface GeographyProps {
        geography: Geography;
        style?: {
            default?: React.CSSProperties;
            hover?: React.CSSProperties;
            pressed?: React.CSSProperties;
        };
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        className?: string;
        onMouseEnter?: (event: React.MouseEvent) => void;
        onMouseLeave?: (event: React.MouseEvent) => void;
        onClick?: (event: React.MouseEvent) => void;
    }

    export interface MarkerProps {
        coordinates: [number, number];
        children?: ReactNode;
    }

    export interface ZoomableGroupProps {
        center?: [number, number];
        zoom?: number;
        minZoom?: number;
        maxZoom?: number;
        children?: ReactNode;
    }

    export const ComposableMap: ComponentType<ComposableMapProps>;
    export const Geographies: ComponentType<GeographiesProps>;
    export const Geography: ComponentType<GeographyProps>;
    export const Marker: ComponentType<MarkerProps>;
    export const ZoomableGroup: ComponentType<ZoomableGroupProps>;
}
