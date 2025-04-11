import { useEffect, useState } from "react";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  backgroundColor?: string;
  progressColor?: string;
}

export default function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 4,
  backgroundColor = "#e2e8f0",
  progressColor = "#2563eb"
}: ProgressRingProps) {
  // Radius is calculated based on size and stroke width
  const radius = (size - strokeWidth) / 2;
  
  // Circle circumference
  const circumference = radius * 2 * Math.PI;
  
  // Calculate stroke dash offset based on progress
  const [dashOffset, setDashOffset] = useState(circumference);
  
  // Animate progress on mount and when it changes
  useEffect(() => {
    // Clamp progress between 0-100
    const clampedProgress = Math.min(100, Math.max(0, progress));
    
    // Calculate the new offset
    const offset = circumference - (clampedProgress / 100) * circumference;
    
    // Set with a slight delay for animation
    const timer = setTimeout(() => {
      setDashOffset(offset);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [progress, circumference]);

  return (
    <svg className="transform -rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={backgroundColor}
        strokeWidth={strokeWidth}
      />
      
      {/* Progress circle */}
      <circle
        className="transition-all duration-500 ease-in-out"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={progressColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
    </svg>
  );
}
