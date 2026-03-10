import React from 'react';

const verticalLines = [
  { left: '6%', color: 'rgba(34, 211, 238, 0.8)', duration: '2.8s', pulse: '0.8s', delay: '0s' },
  { left: '12%', color: 'rgba(16, 185, 129, 0.78)', duration: '3.4s', pulse: '1s', delay: '-0.6s' },
  { left: '19%', color: 'rgba(255, 255, 255, 0.32)', duration: '2.6s', pulse: '0.9s', delay: '-1.1s' },
  { left: '27%', color: 'rgba(168, 85, 247, 0.7)', duration: '3.8s', pulse: '1.2s', delay: '-0.4s' },
  { left: '35%', color: 'rgba(34, 211, 238, 0.72)', duration: '3.1s', pulse: '0.9s', delay: '-1.8s' },
  { left: '44%', color: 'rgba(16, 185, 129, 0.68)', duration: '2.9s', pulse: '0.85s', delay: '-0.9s' },
  { left: '53%', color: 'rgba(255, 255, 255, 0.26)', duration: '3.6s', pulse: '1.1s', delay: '-1.4s' },
  { left: '61%', color: 'rgba(168, 85, 247, 0.72)', duration: '2.7s', pulse: '0.95s', delay: '-0.3s' },
  { left: '70%', color: 'rgba(34, 211, 238, 0.75)', duration: '3.2s', pulse: '1.05s', delay: '-1.6s' },
  { left: '79%', color: 'rgba(16, 185, 129, 0.74)', duration: '2.85s', pulse: '0.9s', delay: '-0.7s' },
  { left: '88%', color: 'rgba(255, 255, 255, 0.28)', duration: '3.5s', pulse: '1.15s', delay: '-1.2s' },
  { left: '94%', color: 'rgba(168, 85, 247, 0.68)', duration: '3s', pulse: '0.85s', delay: '-0.5s' },
];

const horizontalLines = [
  { top: '10%', color: 'rgba(34, 211, 238, 0.7)', duration: '4.8s', pulse: '1s', delay: '-0.4s' },
  { top: '22%', color: 'rgba(16, 185, 129, 0.65)', duration: '5.4s', pulse: '1.1s', delay: '-1.2s' },
  { top: '34%', color: 'rgba(255, 255, 255, 0.2)', duration: '4.6s', pulse: '0.95s', delay: '-0.8s' },
  { top: '46%', color: 'rgba(168, 85, 247, 0.62)', duration: '5.8s', pulse: '1.2s', delay: '-1.7s' },
  { top: '58%', color: 'rgba(34, 211, 238, 0.68)', duration: '4.9s', pulse: '1s', delay: '-0.5s' },
  { top: '70%', color: 'rgba(16, 185, 129, 0.62)', duration: '5.3s', pulse: '1.05s', delay: '-1.4s' },
  { top: '82%', color: 'rgba(255, 255, 255, 0.18)', duration: '4.7s', pulse: '0.9s', delay: '-0.9s' },
  { top: '92%', color: 'rgba(168, 85, 247, 0.58)', duration: '5.6s', pulse: '1.15s', delay: '-1.1s' },
];

export const BackgroundAnimation: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 opacity-50">
        {verticalLines.map((line, index) => (
          <div
            key={`vertical-${index}`}
            className="absolute h-full w-px"
            style={{
              left: line.left,
              background: `linear-gradient(to bottom, transparent 0%, ${line.color} 50%, transparent 100%)`,
              animation: `${index % 2 === 0 ? 'moveVertical' : 'moveVerticalReverse'} ${line.duration} linear infinite ${line.delay}, pulse ${line.pulse} ease-in-out infinite alternate`,
            }}
          />
        ))}

        {horizontalLines.map((line, index) => (
          <div
            key={`horizontal-${index}`}
            className="absolute h-px w-full"
            style={{
              top: line.top,
              background: `linear-gradient(to right, transparent 0%, ${line.color} 50%, transparent 100%)`,
              animation: `${index % 2 === 0 ? 'moveHorizontal' : 'moveHorizontalReverse'} ${line.duration} linear infinite ${line.delay}, pulse ${line.pulse} ease-in-out infinite alternate`,
            }}
          />
        ))}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes moveVertical {
              0% { transform: translateY(-100vh); }
              100% { transform: translateY(100vh); }
            }

            @keyframes moveVerticalReverse {
              0% { transform: translateY(100vh); }
              100% { transform: translateY(-100vh); }
            }

            @keyframes moveHorizontal {
              0% { transform: translateX(-100vw); }
              100% { transform: translateX(100vw); }
            }

            @keyframes moveHorizontalReverse {
              0% { transform: translateX(100vw); }
              100% { transform: translateX(-100vw); }
            }

            @keyframes pulse {
              0% { opacity: 0.32; }
              100% { opacity: 0.92; }
            }
          `,
        }}
      />
    </div>
  );
};
