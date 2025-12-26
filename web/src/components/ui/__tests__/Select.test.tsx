import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../Select';

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('Select Component', () => {
  it('renders select with options', () => {
    render(<Select options={mockOptions} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('renders select without label', () => {
    render(<Select options={mockOptions} data-testid="select" />);
    expect(screen.getByTestId('select')).toBeInTheDocument();
  });

  it('renders select with label', () => {
    render(<Select label="Choose option" options={mockOptions} />);
    expect(screen.getByLabelText('Choose option')).toBeInTheDocument();
  });

  it('renders all provided options', () => {
    render(<Select options={mockOptions} />);
    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(3);
  });

  it('renders options with correct values and labels', () => {
    render(<Select options={mockOptions} />);
    const option1 = screen.getByRole('option', { name: 'Option 1' }) as HTMLOptionElement;
    const option2 = screen.getByRole('option', { name: 'Option 2' }) as HTMLOptionElement;

    expect(option1.value).toBe('option1');
    expect(option2.value).toBe('option2');
  });

  it('renders select with error message', () => {
    render(<Select label="Category" options={mockOptions} error="Required field" />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('applies error styling when error prop is present', () => {
    render(<Select options={mockOptions} error="Error" data-testid="select" />);
    const select = screen.getByTestId('select');
    expect(select).toHaveClass('border-red-500');
  });

  it('does not apply error styling when no error', () => {
    render(<Select options={mockOptions} data-testid="select" />);
    const select = screen.getByTestId('select');
    expect(select).not.toHaveClass('border-red-500');
  });

  it('applies custom className', () => {
    render(<Select options={mockOptions} className="custom-select" data-testid="select" />);
    const select = screen.getByTestId('select');
    expect(select).toHaveClass('custom-select');
  });

  it('applies base styling classes', () => {
    render(<Select options={mockOptions} data-testid="select" />);
    const select = screen.getByTestId('select');
    expect(select).toHaveClass('w-full', 'px-3', 'py-2', 'border', 'border-gray-300', 'rounded-md');
  });

  it('handles selection change', async () => {
    const user = userEvent.setup();
    render(<Select options={mockOptions} data-testid="select" />);
    const select = screen.getByTestId('select') as HTMLSelectElement;

    await user.selectOptions(select, 'option2');
    expect(select.value).toBe('option2');
  });

  it('handles onChange event', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    render(<Select options={mockOptions} onChange={handleChange} data-testid="select" />);
    const select = screen.getByTestId('select');

    await user.selectOptions(select, 'option2');
    expect(handleChange).toHaveBeenCalled();
  });

  it('can be disabled', () => {
    render(<Select options={mockOptions} disabled data-testid="select" />);
    expect(screen.getByTestId('select')).toBeDisabled();
  });

  it('can be required', () => {
    render(<Select options={mockOptions} required data-testid="select" />);
    expect(screen.getByTestId('select')).toBeRequired();
  });

  it('supports default value', () => {
    render(<Select options={mockOptions} defaultValue="option2" data-testid="select" />);
    const select = screen.getByTestId('select') as HTMLSelectElement;
    expect(select.value).toBe('option2');
  });

  it('supports controlled select with value prop', () => {
    const { rerender } = render(
      <Select options={mockOptions} value="option1" onChange={() => {}} data-testid="select" />
    );
    const select = screen.getByTestId('select') as HTMLSelectElement;
    expect(select.value).toBe('option1');

    rerender(<Select options={mockOptions} value="option3" onChange={() => {}} data-testid="select" />);
    expect(select.value).toBe('option3');
  });

  it('renders empty select when options array is empty', () => {
    render(<Select options={[]} data-testid="select" />);
    const select = screen.getByTestId('select');
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(0);
  });

  it('renders with name attribute', () => {
    render(<Select options={mockOptions} name="category" data-testid="select" />);
    expect(screen.getByTestId('select')).toHaveAttribute('name', 'category');
  });

  it('renders options with unique keys', () => {
    const { container } = render(<Select options={mockOptions} />);
    const options = container.querySelectorAll('option');

    options.forEach((option, index) => {
      expect(option).toHaveAttribute('value', mockOptions[index].value);
    });
  });

  it('supports multiple selection', () => {
    render(<Select options={mockOptions} multiple data-testid="select" />);
    expect(screen.getByTestId('select')).toHaveAttribute('multiple');
  });
});
