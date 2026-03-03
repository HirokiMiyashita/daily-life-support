export function AppLogo({ size = 120 }: { size?: number }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Circle */}
        <circle cx="60" cy="60" r="58" fill="#FF6B35" opacity="0.1" />
        
        {/* Weight Scale Base */}
        <rect x="30" y="70" width="60" height="8" rx="4" fill="#1A2332" />
        
        {/* Weight Scale Platform */}
        <rect x="35" y="60" width="50" height="12" rx="6" fill="#FF6B35" />
        
        {/* Digital Display Background */}
        <rect x="42" y="45" width="36" height="18" rx="4" fill="#1A2332" />
        
        {/* -20kg Text */}
        <text
          x="60"
          y="57"
          fontSize="11"
          fontWeight="bold"
          fill="#00B4D8"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
        >
          -20kg
        </text>
        
        {/* Lightning Bolt - Energy/Action Symbol */}
        <path
          d="M65 25 L58 40 L63 40 L57 55 L68 38 L62 38 L65 25Z"
          fill="#FF6B35"
          stroke="#FF6B35"
          strokeWidth="1"
        />
        
        {/* Check Mark - Achievement Symbol */}
        <path
          d="M48 32 L50 35 L55 28"
          stroke="#00B4D8"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Motivational Dots/Sparkles */}
        <circle cx="75" cy="30" r="2" fill="#00B4D8" />
        <circle cx="80" cy="45" r="2" fill="#FF6B35" />
        <circle cx="40" cy="35" r="2" fill="#00B4D8" />
        
        {/* Arrow Down - Weight Loss Direction */}
        <path
          d="M88 50 L88 65 M83 60 L88 65 L93 60"
          stroke="#00B4D8"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }
  
  export function AppLogoCompact({ size = 40 }: { size?: number }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Simplified version for header */}
        <circle cx="20" cy="20" r="18" fill="#FF6B35" />
        
        {/* -20 Text */}
        <text
          x="20"
          y="25"
          fontSize="12"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
        >
          -20
        </text>
        
        {/* Lightning */}
        <path
          d="M22 8 L18 16 L20 16 L17 24 L24 14 L21 14 L22 8Z"
          fill="#00B4D8"
        />
      </svg>
    );
  }
  