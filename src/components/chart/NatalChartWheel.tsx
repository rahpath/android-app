import Svg, { Circle, G, Line, Text as SvgText } from "react-native-svg";

import {
  SIGN_DEFINITIONS,
  getPlanetShortLabel,
} from "@/astrology/signUtils";
import type { NatalChart } from "@/types/domain";

type NatalChartWheelProps = {
  chart: NatalChart;
  size?: number;
};

const aspectColors: Record<string, string> = {
  conjunction: "rgba(255,255,255,0.24)",
  trine: "rgba(122,216,255,0.5)",
  sextile: "rgba(159,227,154,0.45)",
  square: "rgba(255,138,122,0.45)",
  opposition: "rgba(242,200,121,0.45)",
};

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  degree: number,
) {
  const radians = ((degree - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  };
}

export function NatalChartWheel({
  chart,
  size = 270,
}: NatalChartWheelProps) {
  const center = size / 2;
  const outerRadius = size * 0.46;
  const signRadius = size * 0.365;
  const labelRadius = size * 0.415;
  const planetRadius = size * 0.285;
  const innerRadius = size * 0.165;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={center}
        cy={center}
        r={outerRadius}
        fill="rgba(255,255,255,0.04)"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth={1.4}
      />
      <Circle
        cx={center}
        cy={center}
        r={signRadius}
        fill="rgba(14,18,47,0.76)"
        stroke="rgba(163,139,255,0.16)"
        strokeWidth={1}
      />
      <Circle
        cx={center}
        cy={center}
        r={innerRadius}
        fill="rgba(107,124,255,0.10)"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={1}
      />

      {SIGN_DEFINITIONS.map((sign) => {
        const linePoint = polarToCartesian(center, center, outerRadius, sign.startDegree);
        const labelPoint = polarToCartesian(center, center, labelRadius, sign.startDegree + 15);
        return (
          <G key={sign.key}>
            <Line
              x1={center}
              y1={center}
              x2={linePoint.x}
              y2={linePoint.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
            <SvgText
              x={labelPoint.x}
              y={labelPoint.y}
              fill={sign.color}
              fontSize={10}
              fontWeight="700"
              textAnchor="middle"
            >
              {sign.shortLabel}
            </SvgText>
          </G>
        );
      })}

      {chart.houses.map((house) => {
        const point = polarToCartesian(center, center, signRadius, house.degree);
        return (
          <Line
            key={`house-${house.id}`}
            x1={center}
            y1={center}
            x2={point.x}
            y2={point.y}
            stroke="rgba(163,139,255,0.18)"
            strokeWidth={0.8}
          />
        );
      })}

      {chart.aspects.slice(0, 10).map((aspect) => {
        const from = chart.placements.find((placement) => placement.key === aspect.fromKey);
        const to = chart.placements.find((placement) => placement.key === aspect.toKey);
        if (!from || !to) {
          return null;
        }

        const fromPoint = polarToCartesian(center, center, innerRadius + 12, from.degree);
        const toPoint = polarToCartesian(center, center, innerRadius + 12, to.degree);

        return (
          <Line
            key={`${aspect.fromKey}-${aspect.toKey}-${aspect.aspectKey}`}
            x1={fromPoint.x}
            y1={fromPoint.y}
            x2={toPoint.x}
            y2={toPoint.y}
            stroke={aspectColors[aspect.aspectKey] ?? "rgba(255,255,255,0.18)"}
            strokeWidth={0.8}
          />
        );
      })}

      {chart.placements.slice(0, 10).map((placement) => {
        const point = polarToCartesian(center, center, planetRadius, placement.degree);
        return (
          <G key={placement.key}>
            <Circle
              cx={point.x}
              cy={point.y}
              r={12}
              fill="rgba(11,15,42,0.92)"
              stroke="rgba(163,139,255,0.55)"
              strokeWidth={1}
            />
            <SvgText
              x={point.x}
              y={point.y + 3.5}
              fill="#FFFFFF"
              fontSize={9}
              fontWeight="700"
              textAnchor="middle"
            >
              {getPlanetShortLabel(placement.key)}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
