import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastContainer, useToast, type Toast } from '@/components/toast';
import { renderHook } from '@testing-library/react';

describe('ToastContainer', () => {
  const mockToasts: Toast[] = [
    {
      id: 'toast-1',
      title: 'Success!',
      message: 'Operation completed successfully',
      type: 'success',
      duration: 5000,
    },
    {
      id: 'toast-2',
      title: 'Error!',
      message: 'Something went wrong',
      type: 'error',
      duration: 5000,
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders toast notifications correctly', () => {
    const mockOnDismiss = vi.fn();
    render(<ToastContainer toasts={mockToasts} onDismiss={mockOnDismiss} />);

    // Check if both toasts are rendered
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
    expect(screen.getByText('Error!')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Check if toast notifications have proper ARIA attributes
    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(2);
    alerts.forEach((alert) => {
      expect(alert).toHaveAttribute('aria-live', 'polite');
      expect(alert).toHaveAttribute('aria-atomic', 'true');
    });
  });

  it('auto-dismisses toast after duration', async () => {
    const mockOnDismiss = vi.fn();
    render(
      <ToastContainer
        toasts={[
          {
            id: 'toast-auto',
            title: 'Auto dismiss',
            message: 'This will disappear',
            type: 'info',
            duration: 3000,
          },
        ]}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Auto dismiss')).toBeInTheDocument();

    // Fast-forward time by 3000ms (duration) + 300ms (exit animation)
    await act(async () => {
      vi.advanceTimersByTime(3300);
    });

    // onDismiss should be called after duration + exit animation
    expect(mockOnDismiss).toHaveBeenCalledWith('toast-auto');
  });

  it('manually dismisses toast when close button clicked', async () => {
    const mockOnDismiss = vi.fn();

    render(
      <ToastContainer
        toasts={[
          {
            id: 'toast-manual',
            title: 'Manual dismiss',
            message: 'Click to close',
            type: 'warning',
            duration: 10000,
          },
        ]}
        onDismiss={mockOnDismiss}
      />
    );

    // Find and click the dismiss button
    const dismissButton = screen.getByLabelText('Dismiss notification');
    expect(dismissButton).toBeInTheDocument();

    // Click button and advance timer for exit animation
    await act(async () => {
      dismissButton.click();
      vi.advanceTimersByTime(300);
    });

    // onDismiss should be called
    expect(mockOnDismiss).toHaveBeenCalledWith('toast-manual');
  });

  it('displays correct icons for each toast type', () => {
    const mockOnDismiss = vi.fn();
    const toastTypes: Toast[] = [
      {
        id: 'success-toast',
        title: 'Success',
        message: 'Success message',
        type: 'success',
      },
      {
        id: 'error-toast',
        title: 'Error',
        message: 'Error message',
        type: 'error',
      },
      {
        id: 'warning-toast',
        title: 'Warning',
        message: 'Warning message',
        type: 'warning',
      },
      {
        id: 'info-toast',
        title: 'Info',
        message: 'Info message',
        type: 'info',
      },
    ];

    render(<ToastContainer toasts={toastTypes} onDismiss={mockOnDismiss} />);

    // All toasts should be rendered
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();

    // Check that each toast has an SVG icon (4 types + 4 close buttons = 8 SVGs total)
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(8);
  });

  it('renders empty container when no toasts', () => {
    const mockOnDismiss = vi.fn();
    const { container } = render(<ToastContainer toasts={[]} onDismiss={mockOnDismiss} />);

    // Container should be empty but still rendered
    const toastContainer = container.querySelector('.fixed.top-4.right-4');
    expect(toastContainer).toBeInTheDocument();
    expect(toastContainer?.children).toHaveLength(0);
  });
});

describe('useToast hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('adds and dismisses toasts correctly', () => {
    const { result } = renderHook(() => useToast());

    // Initially no toasts
    expect(result.current.toasts).toHaveLength(0);

    // Add a toast
    act(() => {
      result.current.addToast({
        title: 'Test Toast',
        message: 'Test message',
        type: 'success',
      });
    });

    // Toast should be added
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Test Toast');
    expect(result.current.toasts[0].message).toBe('Test message');
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].id).toBeDefined();

    // Dismiss the toast
    const toastId = result.current.toasts[0].id;
    act(() => {
      result.current.dismissToast(toastId);
    });

    // Toast should be removed
    expect(result.current.toasts).toHaveLength(0);
  });

  it('handles multiple toasts', () => {
    const { result } = renderHook(() => useToast());

    // Add multiple toasts
    act(() => {
      result.current.addToast({
        title: 'Toast 1',
        message: 'Message 1',
        type: 'info',
      });
      result.current.addToast({
        title: 'Toast 2',
        message: 'Message 2',
        type: 'warning',
      });
      result.current.addToast({
        title: 'Toast 3',
        message: 'Message 3',
        type: 'error',
      });
    });

    // All toasts should be present
    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.toasts[0].title).toBe('Toast 1');
    expect(result.current.toasts[1].title).toBe('Toast 2');
    expect(result.current.toasts[2].title).toBe('Toast 3');

    // Dismiss middle toast
    const middleToastId = result.current.toasts[1].id;
    act(() => {
      result.current.dismissToast(middleToastId);
    });

    // Should have 2 toasts remaining
    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0].title).toBe('Toast 1');
    expect(result.current.toasts[1].title).toBe('Toast 3');

    // Dismiss all remaining toasts one by one
    const firstId = result.current.toasts[0].id;
    act(() => {
      result.current.dismissToast(firstId);
    });

    expect(result.current.toasts).toHaveLength(1);

    const secondId = result.current.toasts[0].id;
    act(() => {
      result.current.dismissToast(secondId);
    });

    // All toasts should be dismissed
    expect(result.current.toasts).toHaveLength(0);
  });
});
