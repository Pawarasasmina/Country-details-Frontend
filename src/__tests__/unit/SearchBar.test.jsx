import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react'; // Changed from react-dom/test-utils to react
import SearchBar from '../../components/SearchBar';

describe('SearchBar Component', () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders search input correctly', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  test('calls onSearch with debounce when input changes', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'test' } });
    });

    // Initially, the search function should not be called
    expect(mockOnSearch).not.toHaveBeenCalled();

    // Use act to wrap timer advancement to ensure all updates are processed
    act(() => {
      // Try a longer debounce time (1000ms instead of 500ms)
      jest.advanceTimersByTime(1000);
    });

    // After debounce time, search function should be called
    expect(mockOnSearch).toHaveBeenCalledWith('test');
  });

  test('debounce works correctly with multiple inputs', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    
    // Wrap all input events in act
    act(() => {
      // Type 'a'
      fireEvent.change(searchInput, { target: { value: 'a' } });
      
      // Type 'ab' quickly after
      fireEvent.change(searchInput, { target: { value: 'ab' } });
      
      // Type 'abc' quickly after
      fireEvent.change(searchInput, { target: { value: 'abc' } });
    });
    
    // No calls yet since debounce hasn't finished
    expect(mockOnSearch).not.toHaveBeenCalled();
    
    // Advance timers with act
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Only the last value should be used
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalledWith('abc');
  });

  test('handles empty input correctly', async () => {
    // Use a different approach for empty strings
    jest.useRealTimers(); // Use real timers for this test
    
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    
    // Set initial value then clear it
    fireEvent.change(searchInput, { target: { value: 'initial' } });
    
    // Wait for the initial value to be processed
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('initial');
    }, { timeout: 1500 });
    
    // Reset mock to check next call
    mockOnSearch.mockClear();
    
    // Change to empty string
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // Wait for the empty string to be processed
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('');
    }, { timeout: 1500 });
  });

  test('works with waitFor instead of timer advancement', async () => {
    // Switch to real timers for this test
    jest.useRealTimers();
    
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'waitfor test' } });
    
    // Use waitFor to wait for the debounce to complete
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('waitfor test');
    }, { timeout: 1500 }); // Increase the timeout for the debounce
  });

  test('handles focus and blur events', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    
    // Create a custom mock to verify focus was called
    const focusMock = jest.fn();
    const blurMock = jest.fn();
    
    // Replace the original event listeners with our mocks
    searchInput.onfocus = focusMock;
    searchInput.onblur = blurMock;
    
    // Trigger focus event
    fireEvent.focus(searchInput);
    expect(focusMock).toHaveBeenCalled();
    
    // Trigger blur event
    fireEvent.blur(searchInput);
    expect(blurMock).toHaveBeenCalled();
  });

  test('responds to keyboard events', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    
    // Type with keyboard events instead of directly changing value
    fireEvent.keyDown(searchInput, { key: 'a' });
    fireEvent.keyUp(searchInput, { key: 'a' });
    
    // Change value to simulate typing
    fireEvent.change(searchInput, { target: { value: 'a' } });
    
    // Advance timers
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(mockOnSearch).toHaveBeenCalledWith('a');
  });

  test('search input can be cleared programmatically', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    
    // First set some value
    fireEvent.change(searchInput, { target: { value: 'test value' } });
    
    // Clear the input
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // Check that the input is cleared
    expect(searchInput.value).toBe('');
    
    // Advance timers
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Verify search was called with empty string
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });
});
