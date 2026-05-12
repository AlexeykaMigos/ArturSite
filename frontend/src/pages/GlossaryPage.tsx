import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { BookOpen, Search, Filter } from 'lucide-react';
import { useState } from 'react';
import type { GlossaryTerm } from '@/types';

export default function GlossaryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: terms, isLoading } = useQuery<GlossaryTerm[]>({
    queryKey: ['glossary', searchQuery, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      const response = await api.get(`/glossary?${params}`);
      return response.data;
    },
  });

  const { data: categories } = useQuery<string[]>({
    queryKey: ['glossary-categories'],
    queryFn: async () => {
      const response = await api.get('/glossary/categories');
      return response.data;
    },
  });

  const groupedTerms = terms?.reduce((acc, term) => {
    const category = term.category || 'Без категории';
    if (!acc[category]) acc[category] = [];
    acc[category].push(term);
    return acc;
  }, {} as Record<string, GlossaryTerm[]>) || {};

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <BookOpen className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Глоссарий</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Словарь терминов и определений
          </p>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск терминов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Все категории</option>
              {categories?.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedTerms).map(([category, categoryTerms]) => (
          <div key={category} className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {category}
            </h2>
            <div className="space-y-4">
              {categoryTerms.map((term) => (
                <div
                  key={term.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <h3 className="font-medium text-primary mb-1">{term.term}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {term.definition}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!terms || terms.length === 0 && (
        <div className="card p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery || selectedCategory !== 'all'
              ? 'Не найдено терминов по заданным критериям'
              : 'Глоссарий пуст'}
          </p>
        </div>
      )}
    </div>
  );
}
