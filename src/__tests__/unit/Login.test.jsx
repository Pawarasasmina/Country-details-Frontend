import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../../pages/Login';
import { BrowserRouter } from 'react-router-dom';

// Mock the image import
jest.mock('../../../assets/bg.jpg', () => 'bg-image-mock', { virtual: true });

// Mock the UserContext
jest.mock('../../contexts/UserContext');
import { useUser } from '../../contexts/UserContext';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

beforeEach(() => {
  // Mock localStorage
  const mockLocalStorage = {
    getItem: jest.fn((key) => {
      if (key === 'users') {
        return JSON.stringify({
          pawara: { password: '1234', favorites: [] },
        });
      }
      return null;
    }),
    setItem: jest.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });
  
  // Reset mocks
  mockNavigate.mockClear();
  jest.clearAllMocks();
});

test('calls login with username when form is submitted', async () => {
  const mockLogin = jest.fn();
  useUser.mockReturnValue({ login: mockLogin });

  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );

  fireEvent.change(screen.getByPlaceholderText(/Enter your username/i), {
    target: { value: 'pawara' },
  });
  fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
    target: { value: '1234' },
  });

  // Submit the form
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

  // Wait for the login function to be called after the success animation
  await waitFor(() => {
    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith('pawara');
  }, { timeout: 1000 });
});
