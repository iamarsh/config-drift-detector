import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Simple test to verify setup works
describe('Vitest Setup', () => {
  it('should render a component', () => {
    const TestComponent = () => <div>Hello Test</div>;
    render(<TestComponent />);
    expect(screen.getByText('Hello Test')).toBeInTheDocument();
  });

  it('should have access to global mocks', () => {
    expect(global.ResizeObserver).toBeDefined();
  });
});
