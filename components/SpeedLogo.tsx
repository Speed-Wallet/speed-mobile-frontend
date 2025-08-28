import React from 'react';
import Svg, { Rect, Circle, Path } from 'react-native-svg';

interface SpeedLogoProps {
  size?: number;
}

export default function SpeedLogo({ size = 120 }: SpeedLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      {/* Circle */}
      <Circle cx="256" cy="256" r="200" fill="#00CFFF" />

      {/* Lightning bolt (rotated & thicker bottom) */}
      <Path
        fill="#0b0b0f"
        d="
          M 225 110
          L 305 130
          L 270 215
          L 325 215
          L 215 405
          L 250 285
          L 195 285
          Z
        "
        transform="rotate(8,256,256)"
      />
    </Svg>
  );
}
