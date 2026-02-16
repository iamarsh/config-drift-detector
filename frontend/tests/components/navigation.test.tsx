import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigation } from '@/components/layout/navigation';

// Mock next/navigation
const mockPush = vi.fn();
const mockPathname = vi.fn(() => '/');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => mockPathname(),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    themes: ['light', 'dark'],
  }),
}));

describe('Navigation', () => {
  it('renders all navigation links correctly', () => {
    render(<Navigation />);

    // Check brand name
    expect(screen.getByText('Config Drift Detector')).toBeInTheDocument();

    // Check all navigation links are rendered
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /drifts/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /baselines/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /trends/i })).toBeInTheDocument();

    // Verify links have correct hrefs
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /^drifts$/i })).toHaveAttribute('href', '/drifts');
    expect(screen.getByRole('link', { name: /baselines/i })).toHaveAttribute('href', '/baselines');
    expect(screen.getByRole('link', { name: /trends/i })).toHaveAttribute('href', '/trends');
  });

  it('shows active state for current route', () => {
    // Mock pathname as /drifts
    mockPathname.mockReturnValue('/drifts');

    render(<Navigation />);

    // Find the Drifts link
    const driftsLink = screen.getByRole('link', { name: /^drifts$/i });

    // Active link should have aws-orange text color
    expect(driftsLink).toHaveClass('text-aws-orange');

    // Active link should have bottom indicator div
    const activeIndicator = driftsLink.querySelector('.absolute.bottom-0.bg-aws-orange');
    expect(activeIndicator).toBeInTheDocument();
  });

  it('shows active state for nested routes', () => {
    // Mock pathname as /drifts/rds (nested route)
    mockPathname.mockReturnValue('/drifts/rds');

    render(<Navigation />);

    // Drifts link should still be active for nested route
    const driftsLink = screen.getByRole('link', { name: /^drifts$/i });
    expect(driftsLink).toHaveClass('text-aws-orange');
  });

  it('opens mobile menu when hamburger button clicked', async () => {
    const user = userEvent.setup();

    render(<Navigation />);

    // Find mobile menu button (hamburger icon)
    const mobileMenuButton = screen.getByRole('button', { name: /open menu/i });
    expect(mobileMenuButton).toBeInTheDocument();

    // Click the mobile menu button
    await user.click(mobileMenuButton);

    // Mobile menu should be visible with "Menu" title
    expect(screen.getByText('Menu')).toBeInTheDocument();

    // Close button should be present
    const closeButton = screen.getByRole('button', { name: /close menu/i });
    expect(closeButton).toBeInTheDocument();

    // Click close button to close menu
    await user.click(closeButton);

    // Menu title should no longer be visible after closing
    // Note: Headless UI Dialog removes content from DOM when closed
    await vi.waitFor(() => {
      expect(screen.queryByText('Menu')).not.toBeInTheDocument();
    });
  });

  it('renders theme toggle button', () => {
    render(<Navigation />);

    // Theme toggle button should be present
    const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
    expect(themeToggle).toBeInTheDocument();
  });

  it('home link is only active on exact match', () => {
    // When on /drifts, home should not be active
    mockPathname.mockReturnValue('/drifts');

    const { rerender } = render(<Navigation />);

    const homeLink = screen.getByRole('link', { name: /dashboard/i });
    expect(homeLink).not.toHaveClass('text-aws-orange');

    // When on /, home should be active
    mockPathname.mockReturnValue('/');
    rerender(<Navigation />);

    const homeLinkActive = screen.getByRole('link', { name: /dashboard/i });
    expect(homeLinkActive).toHaveClass('text-aws-orange');
  });
});
