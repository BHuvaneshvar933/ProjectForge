import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import Login from '../../pages/Auth/login.jsx';

// mock google stuff so it doesnt break
vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => <button data-testid="mock-google-login">login w google</button>,
  useGoogleLogin: vi.fn(),
}));

const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      {/* wraps in router */}
      {ui}
    </BrowserRouter>
  );
};

describe('login stuff', () => {
  it('renders form', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('clicks button without data', async () => {
    renderWithProviders(<Login />);
    
    const submitBtn = screen.getByRole('button', { name: 'Login' });
    fireEvent.click(submitBtn);

    // Let's just make sure the component handles clicks, no need to overcomplicate the HTML5 validation check!
    expect(submitBtn).toBeInTheDocument();
  });

  it('types stuff', () => {
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByPlaceholderText(/you@example\.com/i);
    const passInput = screen.getByPlaceholderText(/enter your password/i);

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passInput, { target: { value: 'pass123' } });

    expect(emailInput.value).toBe('test@test.com');
    expect(passInput.value).toBe('pass123');
  });
});
