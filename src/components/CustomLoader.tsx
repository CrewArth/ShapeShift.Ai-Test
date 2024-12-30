import React from 'react';

interface CustomLoaderProps {
  message?: string;
  progress?: number;
}

export const CustomLoader: React.FC<CustomLoaderProps> = ({ message, progress }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      
      {message && (
        <p className="text-[var(--foreground)] text-lg font-medium text-center">
          {message}
        </p>
      )}
      {progress !== undefined && (
        <div className="w-full max-w-xs">
          <div className="h-2 bg-[var(--background-secondary)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#FF156D] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[var(--foreground-secondary)] text-sm text-center mt-2">
            {progress}%
          </p>
        </div>
      )}
    </div>
  );
}; 