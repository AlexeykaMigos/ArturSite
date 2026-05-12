import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { BookOpen, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category?: string;
}

interface GlossaryTooltipProps {
  term: string;
  children: React.ReactNode;
}

export function GlossaryTooltip({ term, children }: GlossaryTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const { data: glossaryTerms } = useQuery<GlossaryTerm[]>({
    queryKey: ['glossary'],
    queryFn: async () => {
      const response = await api.get('/glossary');
      return response.data;
    },
  });

  const matchedTerm = glossaryTerms?.find(
    t => t.term.toLowerCase() === term.toLowerCase()
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!matchedTerm) return;

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
    setIsOpen(!isOpen);
  };

  if (!matchedTerm) {
    return <>{children}</>;
  }

  return (
    <>
      <span
        ref={triggerRef}
        onClick={handleToggle}
        className={cn(
          'cursor-pointer border-b-2 border-dashed border-primary/50 hover:border-primary hover:text-primary transition-colors',
          isOpen && 'text-primary border-primary'
        )}
      >
        {children}
      </span>

      {isOpen && (
        <div
          ref={tooltipRef}
          className="fixed z-50 w-80 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
          style={{ top: position.top, left: position.left }}
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              {matchedTerm.term}
            </h4>
          </div>

          {matchedTerm.category && (
            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded mb-2">
              {matchedTerm.category}
            </span>
          )}

          <p className="text-sm text-gray-600 dark:text-gray-300">
            {matchedTerm.definition}
          </p>
        </div>
      )}
    </>
  );
}
