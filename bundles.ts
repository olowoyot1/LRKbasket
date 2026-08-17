import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#2B1149',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#F4B400',
          fontSize: 20,
          fontWeight: 700,
          fontFamily: 'Georgia, serif',
        }}
      >
        L
      </div>
    ),
    { ...size }
  );
}
