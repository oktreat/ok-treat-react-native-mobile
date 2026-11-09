import React, { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

// Shared glossy paw coin for Home, wallet and earned-coins motion.
export default function TreatCoinMark({ size = 22 }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const rim = `${id}rim`, face = `${id}face`, paw = `${id}paw`;
  return <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
    <Defs>
      <LinearGradient id={rim} x1="15%" y1="0%" x2="80%" y2="100%">
        <Stop offset="0" stopColor="#FFF9B0" /><Stop offset="0.23" stopColor="#FFD900" />
        <Stop offset="0.5" stopColor="#FFB600" /><Stop offset="0.74" stopColor="#FFF06A" />
        <Stop offset="1" stopColor="#CE6900" />
      </LinearGradient>
      <LinearGradient id={face} x1="20%" y1="0%" x2="75%" y2="100%">
        <Stop offset="0" stopColor="#FFF17B" /><Stop offset="0.4" stopColor="#FFD21B" />
        <Stop offset="1" stopColor="#F49A00" />
      </LinearGradient>
      <LinearGradient id={paw} x1="0%" y1="0%" x2="80%" y2="100%">
        <Stop offset="0" stopColor="#FFF6A0" /><Stop offset="0.4" stopColor="#FFDD26" />
        <Stop offset="1" stopColor="#F7A000" />
      </LinearGradient>
    </Defs>
    <Circle cx="50" cy="51" r="47" fill="#B95C00" />
    <Circle cx="50" cy="48" r="46" fill={`url(#${rim})`} stroke="#E79500" strokeWidth="1.2" />
    <Circle cx="50" cy="48" r="38" fill={`url(#${face})`} stroke="#B96A00" strokeWidth="2" />
    <Circle cx="50" cy="48" r="35.8" fill="none" stroke="#FFE77A" strokeWidth="1" />
    <Path d="M15 35 A39 39 0 0 1 66 12" fill="none" stroke="#FFFCE0" strokeWidth="2.6" strokeLinecap="round" />
    <Ellipse cx="30" cy="43" rx="7" ry="10" transform="rotate(-28 30 43)" fill={`url(#${paw})`} stroke="#CE7C00" strokeWidth="1.5" />
    <Ellipse cx="43" cy="32" rx="7" ry="10" transform="rotate(-12 43 32)" fill={`url(#${paw})`} stroke="#CE7C00" strokeWidth="1.5" />
    <Ellipse cx="59" cy="32" rx="7" ry="10" transform="rotate(12 59 32)" fill={`url(#${paw})`} stroke="#CE7C00" strokeWidth="1.5" />
    <Ellipse cx="72" cy="43" rx="7" ry="10" transform="rotate(28 72 43)" fill={`url(#${paw})`} stroke="#CE7C00" strokeWidth="1.5" />
    <Path d="M34 58 C39 52 42 46 50 46 C58 46 62 53 67 59 C78 73 63 77 55 72 C52 70 48 70 45 72 C33 79 23 70 34 58 Z" fill={`url(#${paw})`} stroke="#BF6A00" strokeWidth="1.8" />
    <Path d="M36 58 C41 51 44 48 49 48" fill="none" stroke="#FFF9BB" strokeWidth="1.8" strokeLinecap="round" />
    <Path d="M18 20 L19.5 25 L25 27 L19.5 28.5 L18 34 L16.5 28.5 L11 27 L16.5 25 Z" fill="#FFFFFF" />
  </Svg>;
}
