import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';

describe('Card Component', () => {
  it('renders card with children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies padding by default', () => {
    const { container } = render(<Card>Padded Card</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('p-6');
  });

  it('removes padding when padding prop is false', () => {
    const { container } = render(<Card padding={false}>No Padding</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).not.toHaveClass('p-6');
  });

  it('applies base styling classes', () => {
    const { container } = render(<Card>Styled Card</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'border', 'border-gray-200', 'shadow-sm');
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Custom Card</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom-class');
  });
});

describe('CardHeader Component', () => {
  it('renders header with children', () => {
    render(<CardHeader>Header Content</CardHeader>);
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('applies base styling classes', () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    const header = container.firstChild as HTMLElement;
    expect(header).toHaveClass('mb-4');
  });

  it('applies custom className', () => {
    const { container } = render(<CardHeader className="custom-header">Header</CardHeader>);
    const header = container.firstChild as HTMLElement;
    expect(header).toHaveClass('custom-header');
  });
});

describe('CardTitle Component', () => {
  it('renders title with children', () => {
    render(<CardTitle>Title Content</CardTitle>);
    expect(screen.getByText('Title Content')).toBeInTheDocument();
  });

  it('renders as h3 element', () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByText('Title');
    expect(title.tagName).toBe('H3');
  });

  it('applies base styling classes', () => {
    render(<CardTitle>Styled Title</CardTitle>);
    const title = screen.getByText('Styled Title');
    expect(title).toHaveClass('text-xl', 'font-bold', 'text-gray-900');
  });

  it('applies custom className', () => {
    render(<CardTitle className="custom-title">Title</CardTitle>);
    const title = screen.getByText('Title');
    expect(title).toHaveClass('custom-title');
  });
});

describe('CardContent Component', () => {
  it('renders content with children', () => {
    render(<CardContent>Content</CardContent>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies padding by default', () => {
    const { container } = render(<CardContent>Padded Content</CardContent>);
    const content = container.firstChild as HTMLElement;
    expect(content).toHaveClass('p-6');
  });

  it('removes padding when padding prop is false', () => {
    const { container } = render(<CardContent padding={false}>No Padding</CardContent>);
    const content = container.firstChild as HTMLElement;
    expect(content).not.toHaveClass('p-6');
  });

  it('applies custom className', () => {
    const { container } = render(<CardContent className="custom-content">Content</CardContent>);
    const content = container.firstChild as HTMLElement;
    expect(content).toHaveClass('custom-content');
  });
});

describe('Card Composition', () => {
  it('renders complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
        <CardContent>Test Content</CardContent>
      </Card>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
