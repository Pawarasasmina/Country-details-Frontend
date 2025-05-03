import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../../pages/Home';
import CountryCard from '../../components/CountryCard';
import * as api from '../../services/api';

// Mock the API calls
jest.mock('../../services/api');

// Mock the user context - Update to include favorites array
jest.mock('../../contexts/UserContext', () => ({
  useUser: () => ({
    user: { username: 'testuser', favorites: ['USA', 'AUS'] },
    logout: jest.fn(),
  }),
}));

// Sample country data
const mockCountries = [
  {
    cca3: 'USA',
    name: { common: 'United States' },
    capital: ['Washington, D.C.'],
    region: 'Americas',
    population: 331000000,
    flags: { png: 'https://flagcdn.com/w320/us.png' }
  },
  {
    cca3: 'IND',
    name: { common: 'India' },
    capital: ['New Delhi'],
    region: 'Asia',
    population: 1380000000,
    flags: { png: 'https://flagcdn.com/w320/in.png' }
  }
];

describe('Favorites Functionality Integration', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock API response
    api.getAllCountries.mockResolvedValue(mockCountries);
    
    // Mock localStorage
    const mockLocalStorage = {
      getItem: jest.fn((key) => {
        if (key === 'user') return 'testuser';
        if (key === 'users') {
          return JSON.stringify({
            testuser: { password: 'password123', favorites: ['USA'] },
          });
        }
        return null;
      }),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  test('should toggle country as favorite when heart icon is clicked', async () => {
    render(
      <BrowserRouter>
        <CountryCard country={mockCountries[1]} />
      </BrowserRouter>
    );

    // Find and click the heart icon
    const heartIcon = screen.getByRole('button');
    fireEvent.click(heartIcon);

    // Check that localStorage was updated to add IND to favorites
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'users',
      expect.stringContaining('IND')
    );
  });

  test('should display only favorite countries when toggle favorites button is clicked', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Wait for countries to load
    await waitFor(() => {
      expect(api.getAllCountries).toHaveBeenCalledTimes(1);
      expect(screen.getByText('United States')).toBeInTheDocument();
      expect(screen.getByText('India')).toBeInTheDocument();
    });

    // Click the View Favorites button
    const favoritesButton = screen.getByText(/View Favorites/i);
    fireEvent.click(favoritesButton);

    // Verify only favorites are shown
    await waitFor(() => {
      expect(screen.getByText('United States')).toBeInTheDocument();
      expect(screen.queryByText('India')).not.toBeInTheDocument();
    });

    // Click again to show all countries
    const showAllButton = screen.getByText(/Show All Countries/i);
    fireEvent.click(showAllButton);

    // Verify all countries are shown again
    await waitFor(() => {
      expect(screen.getByText('United States')).toBeInTheDocument();
      expect(screen.getByText('India')).toBeInTheDocument();
    });
  });

  test('should add and remove country from favorites', async () => {
    // Use USA (already favorited) to test removal
    render(
      <BrowserRouter>
        <CountryCard country={mockCountries[0]} />
      </BrowserRouter>
    );

    // Find and click the heart icon to remove from favorites
    const heartIcon = screen.getByRole('button');
    fireEvent.click(heartIcon);

    // Check localStorage was updated to remove USA from favorites
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'users',
      expect.not.stringContaining('USA')
    );

    // Mock localStorage to reflect USA removed
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'user') return 'testuser';
      if (key === 'users') {
        return JSON.stringify({
          testuser: { password: 'password123', favorites: [] },
        });
      }
      return null;
    });

    // Click again to add back
    fireEvent.click(heartIcon);

    // Check localStorage was updated to add USA back to favorites
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'users',
      expect.stringContaining('USA')
    );
  });

  test('should properly combine favorites filter with search', async () => {
    // Mock API to include more countries
    const extendedMockCountries = [
      ...mockCountries,
      {
        cca3: 'AUS',
        name: { common: 'Australia' },
        capital: ['Canberra'],
        region: 'Oceania',
        population: 25000000,
        flags: { png: 'https://flagcdn.com/w320/au.png' }
      }
    ];
    api.getAllCountries.mockResolvedValue(extendedMockCountries);

    // No need to mock localStorage for favorites since we're using the UserContext mock

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Wait for countries to load with longer timeout
    await waitFor(() => {
      expect(api.getAllCountries).toHaveBeenCalledTimes(1);
      expect(screen.getByText('United States')).toBeInTheDocument();
      expect(screen.getByText('Australia')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click the View Favorites button
    const favoritesButton = screen.getByText(/View Favorites/i);
    fireEvent.click(favoritesButton);

    // Wait for favorites filter to be applied - use queryAllByText to check multiple elements
    await waitFor(() => {
      // Check that at least one element containing "Favorites" exists
      const favoritesElements = screen.queryAllByText(/Favorites/i);
      expect(favoritesElements.length).toBeGreaterThan(0);
      
      // Also check for text that indicates we're in favorites mode
      expect(screen.getByText(/in Favorites/i)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Try finding the search input in multiple ways
    let searchInput;
    await waitFor(() => {
      searchInput = screen.queryByPlaceholderText(/Search/i) || 
                    screen.queryByRole('textbox') ||
                    screen.queryByLabelText(/search/i);
      expect(searchInput).not.toBeNull();
    }, { timeout: 2000 });
    
    // Search for "Aus" within favorites
    fireEvent.change(searchInput, { target: { value: 'Aus' } });
    
    // Wait for the debounce
    jest.advanceTimersByTime(500);

    // Verify filtering results
    await waitFor(() => {
      // First check that we can see Australia's name somewhere in the document
      const content = screen.getByText(/Aus/i);
      expect(content).toBeInTheDocument();
      
      // Then check other countries are filtered out
      expect(screen.queryByText('United States')).not.toBeInTheDocument();
      expect(screen.queryByText('India')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
