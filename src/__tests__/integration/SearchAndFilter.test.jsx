import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../../pages/Home';
import * as api from '../../services/api';
import { act } from 'react'; 

// Mock the API calls
jest.mock('../../services/api');

// Mock the user context
jest.mock('../../contexts/UserContext', () => ({
  useUser: () => ({
    user: { username: 'testuser' },
    logout: jest.fn(),
  }),
}));

// Mock country data without focusing on population values
const mockCountries = [
  {
    cca3: 'USA',
    name: { common: 'United States' },
    capital: ['Washington, D.C.'],
    region: 'Americas',
    subregion: 'North America',
    population: 0, // Using 0 as placeholder
    languages: { eng: 'English' },
    flags: { png: 'https://flagcdn.com/w320/us.png' }
  },
  {
    cca3: 'IND',
    name: { common: 'India' },
    capital: ['New Delhi'],
    region: 'Asia',
    subregion: 'South Asia',
    population: 0, // Using 0 as placeholder
    languages: { hin: 'Hindi', eng: 'English' },
    flags: { png: 'https://flagcdn.com/w320/in.png' }
  },
  {
    cca3: 'FRA',
    name: { common: 'France' },
    capital: ['Paris'],
    region: 'Europe',
    subregion: 'Western Europe',
    population: 0, // Using 0 as placeholder
    languages: { fra: 'French' },
    flags: { png: 'https://flagcdn.com/w320/fr.png' }
  }
];

// Create a custom render function that wraps rendering in act
const renderWithAct = async (component) => {
  let result;
  await act(async () => {
    result = render(component);
  });
  return result;
};

describe('Search and Filter Integration', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock API response
    api.getAllCountries.mockResolvedValue(mockCountries);
    api.getCountryByName.mockImplementation(async (name) => {
      return mockCountries.filter(c => 
        c.name.common.toLowerCase().includes(name.toLowerCase())
      );
    });
    api.getCountriesByRegion.mockImplementation(async (region) => {
      return mockCountries.filter(c => c.region === region);
    });
  });

  test('should search for countries by name', async () => {
    await renderWithAct(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Wait for countries to load with longer timeout
    await waitFor(() => {
      expect(screen.getByText('United States')).toBeInTheDocument();
      expect(screen.getByText('India')).toBeInTheDocument();
      expect(screen.getByText('France')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Instead of looking for "Filter", find the search input directly
    let searchInput;
    await waitFor(() => {
      // Try different selectors to find the search input
      searchInput = screen.queryByPlaceholderText(/Search/i) || 
                   screen.queryByRole('textbox') ||
                   screen.queryByLabelText(/search/i);
      expect(searchInput).not.toBeNull();
    }, { timeout: 2000 });
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'India' } });
    });
    
    // Use a longer timeout for this test to ensure it has time to complete
    await waitFor(() => {
      expect(screen.getByText('India')).toBeInTheDocument();
      expect(screen.queryByText('United States')).not.toBeInTheDocument();
      expect(screen.queryByText('France')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // Increasing timeout for this specific test
  test('should filter countries by region', async () => {
    await renderWithAct(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('United States')).toBeInTheDocument();
    });

    // Click on Region dropdown specifically by finding the one with "Region" option
    const selects = screen.getAllByRole('combobox');
    // Simplified way to get the region dropdown - just get the second one which is for regions
    const regionSelect = selects[1]; // Index 1 should be the region dropdown
    
    expect(regionSelect).toBeTruthy();

    // Set region to Europe
    await act(async () => {
      fireEvent.change(regionSelect, { target: { value: 'Europe' } });
    });

    // Wait with extended timeout
    await waitFor(() => {
      expect(screen.getByText('France')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Check filtered results separately to isolate errors
    await waitFor(() => {
      expect(screen.queryByText('United States')).not.toBeInTheDocument();
      expect(screen.queryByText('India')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  }, 10000); // 10 second timeout for this test

  test('should combine search and filter', async () => {
    await renderWithAct(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Wait for initial render with longer timeout
    await waitFor(() => {
      expect(screen.getByText('India')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Get region dropdown (second dropdown)
    const selects = screen.getAllByRole('combobox');
    const regionSelect = selects[1];

    // Apply Asia filter
    await act(async () => {
      fireEvent.change(regionSelect, { target: { value: 'Asia' } });
    });

    // Wait for Asia filter to be applied
    await waitFor(() => {
      expect(screen.getByText('India')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Get search input - try multiple selectors
    let searchInput;
    await waitFor(() => {
      searchInput = screen.queryByPlaceholderText(/Search/i) || 
                   screen.queryByRole('textbox') ||
                   screen.queryByLabelText(/search/i);
      expect(searchInput).not.toBeNull();
    }, { timeout: 2000 });
    
    // Search for "Ind"
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Ind' } });
    });

    // Verify India is still shown
    await waitFor(() => {
      expect(screen.getByText('India')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Verify other countries are filtered out
    await waitFor(() => {
      expect(screen.queryByText('United States')).not.toBeInTheDocument();
      expect(screen.queryByText('France')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  }, 10000); // 10 second timeout

  test('should clear filters when clear button is clicked', async () => {
    await renderWithAct(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Wait for countries to load
    await waitFor(() => {
      expect(screen.getByText('United States')).toBeInTheDocument();
    });

    // Get region dropdown (second dropdown)
    const selects = screen.getAllByRole('combobox');
    const regionSelect = selects[1];

    // Apply Europe filter
    await act(async () => {
      fireEvent.change(regionSelect, { target: { value: 'Europe' } });
    });

    // Verify filter applied
    await waitFor(() => {
      expect(screen.getByText('France')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Wait for the clear button to appear and click it
    const clearButton = await screen.findByText(/Clear all filters/i);
    
    await act(async () => {
      fireEvent.click(clearButton);
    });

    // Verify all countries are shown again
    await waitFor(() => {
      expect(screen.getByText('United States')).toBeInTheDocument();
      expect(screen.getByText('India')).toBeInTheDocument();
      expect(screen.getByText('France')).toBeInTheDocument();
    }, { timeout: 2000 });
  }, 10000); // 10 second timeout
});
