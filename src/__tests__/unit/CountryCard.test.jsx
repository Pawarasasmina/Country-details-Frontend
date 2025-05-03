import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CountryCard from '../../components/CountryCard';

// Mock UserContext
jest.mock('../../contexts/UserContext', () => ({
  useUser: () => ({
    user: { username: 'testuser', favorites: ['USA'] },
    logout: jest.fn(),
  }),
}));

describe('CountryCard Component', () => {
  const mockCountry = {
    cca3: 'USA',
    name: { common: 'United States' },
    capital: ['Washington, D.C.'],
    region: 'Americas',
    population: 331000000,
    flags: { png: 'https://flagcdn.com/w320/us.png' }
  };

  // Mock localStorage
  beforeEach(() => {
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

  test('renders country information correctly', () => {
    render(
      <BrowserRouter>
        <CountryCard country={mockCountry} />
      </BrowserRouter>
    );

    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('Washington, D.C.')).toBeInTheDocument();
    expect(screen.getByText('Americas')).toBeInTheDocument();
    expect(screen.getByText('331.0M')).toBeInTheDocument();
    expect(screen.getByText('(331,000,000)')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', mockCountry.flags.png);
  });

  test('should toggle favorite status when heart icon is clicked', () => {
    render(
      <BrowserRouter>
        <CountryCard country={mockCountry} />
      </BrowserRouter>
    );

    // Find and click the heart icon
    const heartIcon = screen.getByRole('button');
    fireEvent.click(heartIcon);

    // Check localStorage was updated to remove USA from favorites
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'users',
      expect.not.stringContaining('USA')
    );

    // Click again to add back
    fireEvent.click(heartIcon);

    // Check localStorage was updated to add USA back to favorites
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'users',
      expect.stringContaining('USA')
    );
  });

 
  test('renders "View Details" link with correct URL', () => {
    render(
      <BrowserRouter>
        <CountryCard country={mockCountry} />
      </BrowserRouter>
    );

    const detailsLink = screen.getByText(/view details/i);
    expect(detailsLink).toBeInTheDocument();
    expect(detailsLink.closest('a')).toHaveAttribute('href', '/country/USA');
  });
});
