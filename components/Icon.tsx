// Implement the Icon component with SVG paths.
import React from 'react';

type IconType = 'logo' | 'upload' | 'pacs' | 'user' | 'search' | 'ai' | 'save' | 'close' | 'zoom-in' | 'zoom-out' | 'pan' | 'rotate' | 'window-level' | 'annotate' | 'reset' | 'clear-annotations' | 'scroll' | 'tags' | 'report';

interface IconProps {
  icon: IconType;
  className?: string;
  // FIX: Add optional title prop to fix type error and improve accessibility.
  title?: string;
}

const ICONS: Record<IconType, React.ReactNode> = {
    logo: (
        <path
          d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
        />
    ),
    upload: (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
    ),
    pacs: (
      <g strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        <path d="M12 22a10 10 0 110-20 10 10 0 010 20z" />
      </g>
    ),
    user: (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
    ),
    search: (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
    ),
    ai: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    ),
    save: (
         <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
        />
    ),
    close: (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
        />
    ),
    'zoom-in': <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3h-6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />,
    'zoom-out': <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />,
    pan: <path fillRule="evenodd" d="M10 3a1 1 0 011 1v1.586l1.707-1.707a1 1 0 011.414 1.414L12.414 6H14a1 1 0 110 2h-1.586l1.707 1.707a1 1 0 01-1.414 1.414L11 9.414V11a1 1 0 11-2 0V9.414l-1.707 1.707a1 1 0 01-1.414-1.414L7.586 8H6a1 1 0 110-2h1.586L5.879 4.293a1 1 0 011.414-1.414L9 4.586V4a1 1 0 011-1z" clipRule="evenodd"/>,
    rotate: <path d="M15 3h6v6M3 15v6h6M21 15a9 9 0 11-9-9 9 9 0 014.5 1.1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />,
    'window-level': <path d="M12 3v18M3 12h18M9 4v16M15 4v16" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />,
    annotate: <path d="M12 15l-4-4m0 0l4-4m-4 4h12M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />,
    reset: <path d="M3 4h18M5 8v12a2 2 0 002 2h10a2 2 0 002-2V8M9 4V2a2 2 0 012-2h2a2 2 0 012 2v2M10 12l4 4m0-4l-4 4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />,
    'clear-annotations': <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />,
    scroll: <path d="M8 5h8M8 9h8M8 13h4M8 17h4" strokeWidth={2} strokeLinecap="round" />,
    tags: <path d="M5 5h14M5 9h14M5 13h6M5 17h6" strokeWidth={2} strokeLinecap="round" />,
    report: <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />,
};


export const Icon: React.FC<IconProps> = ({ icon, className, title }) => {
  const isSolid = ['pan'].includes(icon);
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill={isSolid ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke={isSolid ? "none" : "currentColor"}
      // FIX: Conditionally set aria-hidden based on title presence for better accessibility.
      aria-hidden={!title}
    >
      {/* FIX: Add title element for accessibility and tooltips. */}
      {title && <title>{title}</title>}
      {ICONS[icon]}
    </svg>
  );
};