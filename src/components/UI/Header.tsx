import React from 'react';

export const Header: React.FC = () => {
  return (
    <div className="pointer-events-none absolute top-0 left-0 right-0 z-10 flex justify-center pt-8">
      <h1 className="font-great-vibes text-6xl text-pink-glow text-shadow-glow drop-shadow-lg">
        Merry Christmas
      </h1>
    </div>
  );
};
