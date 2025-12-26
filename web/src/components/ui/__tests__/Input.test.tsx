import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input, Textarea } from '../Input';

describe('Input Component', () => {
  it('renders input without label', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders input with label', () => {
    render(<Input label="Username" />);
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('renders input with error message', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('applies error styling when error prop is present', () => {
    render(<Input error="Error message" data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveClass('border-red-500');
  });

  it('does not apply error styling when no error', () => {
    render(<Input data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).not.toHaveClass('border-red-500');
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveClass('custom-input');
  });

  it('applies base styling classes', () => {
    render(<Input data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveClass('w-full', 'px-3', 'py-2', 'border', 'border-gray-300', 'rounded-md');
  });

  it('handles text input', async () => {
    const user = userEvent.setup();
    render(<Input data-testid="input" />);
    const input = screen.getByTestId('input') as HTMLInputElement;

    await user.type(input, 'Hello World');
    expect(input.value).toBe('Hello World');
  });

  it('handles onChange event', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    render(<Input onChange={handleChange} data-testid="input" />);
    const input = screen.getByTestId('input');

    await user.type(input, 'a');
    expect(handleChange).toHaveBeenCalled();
  });

  it('supports different input types', () => {
    const { rerender } = render(<Input type="email" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');

    rerender(<Input type="number" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'number');
  });

  it('can be disabled', () => {
    render(<Input disabled data-testid="input" />);
    expect(screen.getByTestId('input')).toBeDisabled();
  });

  it('can be required', () => {
    render(<Input required data-testid="input" />);
    expect(screen.getByTestId('input')).toBeRequired();
  });

  it('supports placeholder', () => {
    render(<Input placeholder="Enter your name" />);
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });

  it('supports default value', () => {
    render(<Input defaultValue="Default text" data-testid="input" />);
    const input = screen.getByTestId('input') as HTMLInputElement;
    expect(input.value).toBe('Default text');
  });

  it('supports controlled input with value prop', () => {
    const { rerender } = render(<Input value="Initial" onChange={() => {}} data-testid="input" />);
    const input = screen.getByTestId('input') as HTMLInputElement;
    expect(input.value).toBe('Initial');

    rerender(<Input value="Updated" onChange={() => {}} data-testid="input" />);
    expect(input.value).toBe('Updated');
  });

  it('prevents wheel event on number inputs', () => {
    render(<Input type="number" data-testid="input" />);
    const input = screen.getByTestId('input');

    const wheelEvent = new WheelEvent('wheel', { bubbles: true, cancelable: true });
    const preventDefaultSpy = jest.spyOn(wheelEvent, 'preventDefault');

    input.dispatchEvent(wheelEvent);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});

describe('Textarea Component', () => {
  it('renders textarea without label', () => {
    render(<Textarea placeholder="Enter description" />);
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
  });

  it('renders textarea with label', () => {
    render(<Textarea label="Description" />);
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('renders textarea with error message', () => {
    render(<Textarea label="Comment" error="Too long" />);
    expect(screen.getByText('Too long')).toBeInTheDocument();
  });

  it('applies error styling when error prop is present', () => {
    render(<Textarea error="Error message" data-testid="textarea" />);
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveClass('border-red-500');
  });

  it('applies custom className', () => {
    render(<Textarea className="custom-textarea" data-testid="textarea" />);
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveClass('custom-textarea');
  });

  it('applies base styling classes', () => {
    render(<Textarea data-testid="textarea" />);
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveClass('w-full', 'px-3', 'py-2', 'border', 'border-gray-300', 'rounded-md');
  });

  it('handles text input', async () => {
    const user = userEvent.setup();
    render(<Textarea data-testid="textarea" />);
    const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;

    await user.type(textarea, 'Multi-line\ntext');
    expect(textarea.value).toBe('Multi-line\ntext');
  });

  it('handles onChange event', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    render(<Textarea onChange={handleChange} data-testid="textarea" />);
    const textarea = screen.getByTestId('textarea');

    await user.type(textarea, 'a');
    expect(handleChange).toHaveBeenCalled();
  });

  it('can be disabled', () => {
    render(<Textarea disabled data-testid="textarea" />);
    expect(screen.getByTestId('textarea')).toBeDisabled();
  });

  it('can be required', () => {
    render(<Textarea required data-testid="textarea" />);
    expect(screen.getByTestId('textarea')).toBeRequired();
  });

  it('supports rows attribute', () => {
    render(<Textarea rows={5} data-testid="textarea" />);
    expect(screen.getByTestId('textarea')).toHaveAttribute('rows', '5');
  });

  it('supports default value', () => {
    render(<Textarea defaultValue="Default content" data-testid="textarea" />);
    const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Default content');
  });
});
