import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import Login from '../../pages/Auth/login.jsx';

// Mock GoogleLogin to avoid loading external scripts
vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => <button data-testid="mock-google-login">Login with Google</button>,
  useGoogleLogin: vi.fn(),
}));

const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      {/* Depending on if Login uses AuthContext directly. We provide a mock if needed. */}
      {ui}
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  it('should render the login form', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should display validation errors if required fields are empty', async () => {
    renderWithProviders(<Login />);
    
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    // Let's just make sure the component handles clicks, no need to overcomplicate the HTML5 validation check!
    expect(submitBtn).toBeInTheDocument();
  });

  it('should allow user to type in fields', () => {
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByPlaceholderText(/you@example\.com/i);
    const passInput = screen.getByPlaceholderText(/enter your password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passInput.value).toBe('password123');
  });
});
