import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface HighlightedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function HighlightedInput({ value, onChange, className, ...props }: HighlightedInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleScroll = () => {
      setScrollLeft(input.scrollLeft);
    };

    input.addEventListener('scroll', handleScroll);
    return () => input.removeEventListener('scroll', handleScroll);
  }, []);

  // Highlight {{variableName}} patterns
  const renderHighlightedText = (text: string) => {
    const regex = /(\{\{[\w]+\}\})/g;
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <span 
            key={index} 
            className="bg-primary/20 text-primary font-semibold rounded px-0.5"
          >
            {part}
          </span>
        );
      }
      // Replace spaces with non-breaking spaces for proper alignment
      return <span key={index}>{part.replace(/ /g, '\u00A0')}</span>;
    });
  };

  return (
    <div className="relative">
      {/* Hidden highlight layer */}
      <div
        ref={highlightRef}
        className={cn(
          "absolute inset-0 pointer-events-none overflow-hidden whitespace-pre font-mono text-sm px-3 py-2 text-transparent",
          className
        )}
        style={{ 
          transform: `translateX(-${scrollLeft}px)`,
          paddingRight: scrollLeft > 0 ? `${scrollLeft}px` : undefined
        }}
        aria-hidden="true"
      >
        {renderHighlightedText(value || '')}
      </div>
      
      {/* Actual input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-mono",
          className
        )}
        {...props}
      />
    </div>
  );
}
