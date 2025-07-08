import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { TagInputProps, Tag } from '../types';
import { searchTags, getErrorMessage } from '../utils/api';

export const TagInput: React.FC<TagInputProps> = ({
  selectedTags,
  onTagsChange,
  placeholder = 'Add tags...',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search for tags with debouncing
  const searchForTags = useCallback(async (query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchTags(query);
        // Filter out already selected tags
        const filteredResults = results.filter(
          tag => !selectedTags.includes(tag.name)
        );
        setSuggestions(filteredResults);
        setShowSuggestions(true);
        setSelectedSuggestionIndex(-1);
      } catch (error) {
        console.error('Failed to search tags:', getErrorMessage(error));
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [selectedTags]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.trim()) {
      searchForTags(value.trim());
    } else {
      // Show recent tags when input is empty
      searchForTags('');
    }
  }, [searchForTags]);

  // Add tag
  const addTag = useCallback((tagName: string) => {
    const trimmedName = tagName.trim();
    if (trimmedName && !selectedTags.includes(trimmedName)) {
      onTagsChange([...selectedTags, trimmedName]);
    }
    setInputValue('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    inputRef.current?.focus();
  }, [selectedTags, onTagsChange]);

  // Remove tag
  const removeTag = useCallback((tagName: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagName));
  }, [selectedTags, onTagsChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        addTag(suggestions[selectedSuggestionIndex].name);
      } else if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(selectedTags[selectedTags.length - 1]);
    } else if (e.key === ',' || e.key === ' ') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    }
  }, [inputValue, suggestions, selectedSuggestionIndex, selectedTags, addTag, removeTag]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate a color for tags
  const getTagColor = (tagName: string): string => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-yellow-100 text-yellow-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
    ];
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
      hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="relative">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 text-current hover:text-current/70"
                type="button"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            } else {
              searchForTags(inputValue);
            }
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && (suggestions.length > 0 || inputValue.trim()) && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {/* Create new tag option */}
          {inputValue.trim() && !suggestions.find(s => s.name.toLowerCase() === inputValue.toLowerCase()) && (
            <button
              onClick={() => addTag(inputValue.trim())}
              className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center ${
                selectedSuggestionIndex === -1 ? 'bg-blue-50' : ''
              }`}
            >
              <span className="text-gray-500 mr-2">+</span>
              Create "{inputValue.trim()}"
            </button>
          )}

          {/* Existing tags */}
          {suggestions.map((tag, index) => (
            <button
              key={tag.id}
              onClick={() => addTag(tag.name)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                selectedSuggestionIndex === index ? 'bg-blue-50' : ''
              }`}
            >
              <span>{tag.name}</span>
              {tag.color && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
              )}
            </button>
          ))}

          {/* No results */}
          {suggestions.length === 0 && !inputValue.trim() && !isLoading && (
            <div className="px-3 py-2 text-gray-500 text-sm">
              Start typing to search tags...
            </div>
          )}
        </div>
      )}

      {/* Help text */}
      <div className="text-xs text-gray-500 mt-1">
        Press Enter, comma, or space to add tags
      </div>
    </div>
  );
};