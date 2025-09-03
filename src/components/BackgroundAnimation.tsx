
import React from 'react';

export const BackgroundAnimation: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 opacity-30">
        {/* Linhas verticais animadas mais rápidas */}
        <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-cyan-500 to-transparent" 
             style={{ 
               left: '10%', 
               animation: 'moveVertical 4s linear infinite, pulse 1s ease-in-out infinite alternate'
             }}></div>
        <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-green-500 to-transparent" 
             style={{ 
               left: '25%', 
               animation: 'moveVertical 6s linear infinite reverse, pulse 1.5s ease-in-out infinite alternate'
             }}></div>
        <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-blue-500 to-transparent" 
             style={{ 
               left: '40%', 
               animation: 'moveVertical 5s linear infinite, pulse 1.2s ease-in-out infinite alternate'
             }}></div>
        <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-purple-500 to-transparent" 
             style={{ 
               left: '55%', 
               animation: 'moveVertical 7s linear infinite reverse, pulse 2s ease-in-out infinite alternate'
             }}></div>
        <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-cyan-500 to-transparent" 
             style={{ 
               left: '70%', 
               animation: 'moveVertical 4.5s linear infinite, pulse 1.8s ease-in-out infinite alternate'
             }}></div>
        <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-green-500 to-transparent" 
             style={{ 
               left: '85%', 
               animation: 'moveVertical 5.5s linear infinite reverse, pulse 1.4s ease-in-out infinite alternate'
             }}></div>
        
        {/* Linhas horizontais mais rápidas */}
        <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent" 
             style={{ 
               top: '20%', 
               animation: 'moveHorizontal 7s linear infinite, pulse 1.5s ease-in-out infinite alternate'
             }}></div>
        <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-green-500 to-transparent" 
             style={{ 
               top: '40%', 
               animation: 'moveHorizontal 9s linear infinite reverse, pulse 2s ease-in-out infinite alternate'
             }}></div>
        <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent" 
             style={{ 
               top: '60%', 
               animation: 'moveHorizontal 8s linear infinite, pulse 1.2s ease-in-out infinite alternate'
             }}></div>
        <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-purple-500 to-transparent" 
             style={{ 
               top: '80%', 
               animation: 'moveHorizontal 10s linear infinite reverse, pulse 1.9s ease-in-out infinite alternate'
             }}></div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes moveVertical {
            0% { transform: translateY(-100vh); }
            100% { transform: translateY(100vh); }
          }
          
          @keyframes moveHorizontal {
            0% { transform: translateX(-100vw); }
            100% { transform: translateX(100vw); }
          }
        `
      }} />
    </div>
  );
};
