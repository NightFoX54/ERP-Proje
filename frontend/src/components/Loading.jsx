import React from 'react';

const Loading = ({ message = 'Yükleniyor...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <div className="spinner mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );
};

export default Loading;

