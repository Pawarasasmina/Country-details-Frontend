import * as api from '../../services/api';

// Mock fetch
global.fetch = jest.fn();

describe('API Service', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('getAllCountries should fetch countries from API', async () => {
    const mockCountries = [
      { name: { common: 'United States' }, cca3: 'USA' },
      { name: { common: 'India' }, cca3: 'IND' }
    ];
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCountries
    });

    const result = await api.getAllCountries();
    
    expect(fetch).toHaveBeenCalledWith('https://restcountries.com/v3.1/all');
    expect(result).toEqual(mockCountries);
  });

  test('getCountryByName should fetch countries by name', async () => {
    const mockCountry = [{ name: { common: 'India' }, cca3: 'IND' }];
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCountry
    });

    const result = await api.getCountryByName('India');
    
    expect(fetch).toHaveBeenCalledWith('https://restcountries.com/v3.1/name/India');
    expect(result).toEqual(mockCountry);
  });

  test('getCountriesByRegion should fetch countries by region', async () => {
    const mockRegionCountries = [
      { name: { common: 'France' }, cca3: 'FRA', region: 'Europe' },
      { name: { common: 'Germany' }, cca3: 'DEU', region: 'Europe' }
    ];
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRegionCountries
    });

    const result = await api.getCountriesByRegion('Europe');
    
    expect(fetch).toHaveBeenCalledWith('https://restcountries.com/v3.1/region/Europe');
    expect(result).toEqual(mockRegionCountries);
  });

  test('getCountryByCode should fetch country by code', async () => {
    const mockCountry = [{ name: { common: 'United States' }, cca3: 'USA' }];
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCountry
    });

    const result = await api.getCountryByCode('USA');
    
    expect(fetch).toHaveBeenCalledWith('https://restcountries.com/v3.1/alpha/USA');
    expect(result).toEqual(mockCountry);
  });

  test('API should handle errors properly', async () => {
    // Mock a failed response that still has a json method
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => { throw new Error('HTTP error! Status: 404 Not Found'); }
    });

    await expect(api.getAllCountries()).rejects.toThrow('HTTP error! Status: 404 Not Found');
  });

  // Additional tests for edge cases
  test('should handle network errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    
    await expect(api.getAllCountries()).rejects.toThrow('Network error');
  });

  test('should handle empty response', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });
    
    const result = await api.getAllCountries();
    expect(result).toEqual([]);
  });

  test('should handle malformed JSON response', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error('Invalid JSON'); }
    });
    
    await expect(api.getAllCountries()).rejects.toThrow('Invalid JSON');
  });
});
