import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          background: '#0f172a', // slate-950
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: '20px', height: '20px' }}
        >
          <path 
            d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8-8-3.6-8-8z" 
            strokeOpacity="0.5"
            strokeWidth="1"
          />
          <path d="M7 12c0 2.8 2.2 5 5 5s5-2.2 5-5-2.2-5-5-5" />
          <path d="M12 7v5l3 3" />
          <circle cx="12" cy="12" r="1" fill="white" stroke="none" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
