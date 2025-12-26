import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Button } from '../../Button';
import { Badge } from '../../Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../Card';
import { Alert } from '../../Alert';
import { Input, Textarea } from '../../Input';
import { Select } from '../../Select';

describe('UI Components - Accessibility Tests', () => {
  describe('Button Accessibility', () => {
    it('should have no accessibility violations with text', async () => {
      const { container } = render(<Button>Click me</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when disabled', async () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with different variants', async () => {
      const { container } = render(
        <div>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Badge Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Badge>Status</Badge>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with different variants', async () => {
      const { container } = render(
        <div>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Card Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>Card content goes here</CardContent>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Alert Accessibility', () => {
    it('should have no accessibility violations with role alert', async () => {
      const { container } = render(<Alert>This is an alert message</Alert>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with different variants', async () => {
      const { container } = render(
        <div>
          <Alert variant="info">Info message</Alert>
          <Alert variant="success">Success message</Alert>
          <Alert variant="warning">Warning message</Alert>
          <Alert variant="error">Error message</Alert>
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Input Accessibility', () => {
    it('should have no accessibility violations with label', async () => {
      const { container } = render(<Input label="Email" type="email" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with error message', async () => {
      const { container } = render(
        <Input label="Username" error="Username is required" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when disabled', async () => {
      const { container } = render(<Input label="Disabled" disabled />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when required', async () => {
      const { container } = render(<Input label="Required field" required />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Textarea Accessibility', () => {
    it('should have no accessibility violations with label', async () => {
      const { container } = render(<Textarea label="Description" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with error', async () => {
      const { container } = render(
        <Textarea label="Comment" error="Comment is too long" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Select Accessibility', () => {
    const options = [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
      { value: '3', label: 'Option 3' },
    ];

    it('should have no accessibility violations with label', async () => {
      const { container } = render(
        <Select label="Choose option" options={options} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with error', async () => {
      const { container } = render(
        <Select label="Select" options={options} error="Required field" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when disabled', async () => {
      const { container } = render(
        <Select label="Disabled" options={options} disabled />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Accessibility', () => {
    it('should have no violations with complete form', async () => {
      const { container } = render(
        <form>
          <Input label="Name" type="text" required />
          <Input label="Email" type="email" required />
          <Textarea label="Message" rows={4} />
          <Select
            label="Category"
            options={[
              { value: 'general', label: 'General' },
              { value: 'support', label: 'Support' },
            ]}
          />
          <Button type="submit">Submit</Button>
        </form>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
