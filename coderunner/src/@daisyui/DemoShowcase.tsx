import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  Input, 
  Textarea, 
  Checkbox, 
  Alert, 
  useToast,
  PrimaryButton,
  OutlineButton,
  GhostButton,
  PricingCard,
  CheckboxGroup,
  SuccessAlert,
  ErrorAlert,
} from './index';

/**
 * Demo Showcase Component
 * Demonstrates all implemented DaisyUI components with their variants
 */
export const DemoShowcase: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    newsletter: false,
    preferences: [] as string[]
  });
  
  const { addToast, ToastContainer } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Form submitted successfully!', 'success');
    console.log('Form data:', formData);
  };

  return (
    <div className="min-h-screen container p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">DaisyUI React Components</h1>
          <p className="text-lg text-base-content/70">
            A comprehensive component library with all DaisyUI variants
          </p>
        </div>

        {/* Button Showcase */}
        <Card title="Button Components" bordered className="p-6">
          <div className="space-y-6">
            {/* Color variants */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Color Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Button>Default</Button>
                <Button color="neutral">Neutral</Button>
                <Button color="primary">Primary</Button>
                <Button color="secondary">Secondary</Button>
                <Button color="accent">Accent</Button>
                <Button color="info">Info</Button>
                <Button color="success">Success</Button>
                <Button color="warning">Warning</Button>
                <Button color="error">Error</Button>
              </div>
            </div>

            {/* Style variants */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Style Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Button color="primary">Solid</Button>
                <OutlineButton color="primary">Outline</OutlineButton>
                <GhostButton>Ghost</GhostButton>
                <Button variant="soft" color="primary">Soft</Button>
                <Button variant="link" color="primary">Link</Button>
              </div>
            </div>

            {/* Size variants */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Size Variants</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs" color="primary">XS</Button>
                <Button size="sm" color="primary">Small</Button>
                <Button size="md" color="primary">Medium</Button>
                <Button size="lg" color="primary">Large</Button>
                <Button size="xl" color="primary">XL</Button>
              </div>
            </div>

            {/* State variants */}
            <div>
              <h3 className="text-lg font-semibold mb-3">States & Modifiers</h3>
              <div className="flex flex-wrap gap-3">
                <Button loading color="primary">Loading</Button>
                <Button disabled>Disabled</Button>
                <Button active color="primary">Active</Button>
                <Button wide color="secondary">Wide Button</Button>
                <Button circle color="primary">+</Button>
                <Button square color="accent">□</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Card Showcase */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card 
            title="Basic Card" 
            image="https://picsum.photos/400/200?random=1"
            bordered
          >
            <p>This is a basic card with an image, title, and content.</p>
            <Card.Actions>
              <PrimaryButton size="sm">Action</PrimaryButton>
              <OutlineButton size="sm">Cancel</OutlineButton>
            </Card.Actions>
          </Card>

          <PricingCard
            planName="Pro Plan"
            price="$29/mo"
            features={[
              "Unlimited projects",
              "24/7 support",
              "Advanced analytics",
              "Custom integrations"
            ]}
            popular
            onAction={() => addToast('Subscription started!', 'success')}
          />

          <Card side className="md:col-span-2 lg:col-span-1">
            <figure className="w-32">
              <img src="https://picsum.photos/200/200?random=2" alt="Profile" className="rounded-lg" />
            </figure>
            <Card.Body>
              <Card.Title>Side Layout</Card.Title>
              <p>This card uses the side layout with the image positioned to the left.</p>
              <Card.Actions justify="start">
                <Button size="sm" color="primary">Connect</Button>
              </Card.Actions>
            </Card.Body>
          </Card>
        </div>

        {/* Form Showcase */}
        <Card title="Form Components" bordered className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                placeholder="Enter your name"
                bordered
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
              
              <Input
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                bordered
                color="primary"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <Textarea
              label="Message"
              placeholder="Tell us about your project..."
              bordered
              autoSize
              minRows={3}
              maxRows={8}
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            />

            <Checkbox
              label="Subscribe to newsletter"
              color="primary"
              checked={formData.newsletter}
              onChange={(e) => setFormData(prev => ({ ...prev, newsletter: e.target.checked }))}
            />

            <CheckboxGroup
              options={[
                { value: 'updates', label: 'Product updates' },
                { value: 'marketing', label: 'Marketing emails' },
                { value: 'social', label: 'Social media notifications' }
              ]}
              value={formData.preferences}
              onChange={(preferences) => setFormData(prev => ({ ...prev, preferences }))}
              color="primary"
              direction="horizontal"
              helperText="Choose your communication preferences"
            />

            <div className="flex gap-3">
              <Button type="submit" color="primary" size="lg">
                Submit Form
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => addToast('Form reset!', 'info')}
              >
                Reset
              </Button>
            </div>
          </form>
        </Card>

        {/* Alert Showcase */}
        <Card title="Alert & Feedback Components" bordered className="p-6">
          <div className="space-y-4">
            <Alert color="info" closable>
              <strong>Info:</strong> This is an informational alert with a close button.
            </Alert>

            <SuccessAlert 
              title="Success!"
              actions={
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              }
            >
              Your changes have been saved successfully.
            </SuccessAlert>

            <Alert 
              color="warning"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              }
            >
              Please review your information before submitting.
            </Alert>

            <ErrorAlert closable>
              <strong>Error:</strong> Something went wrong. Please try again.
            </ErrorAlert>

            <div className="pt-4">
              <h4 className="font-semibold mb-3">Toast Notifications</h4>
              <div className="flex flex-wrap gap-3">
                <Button 
                  size="sm" 
                  color="info"
                  onClick={() => addToast('Info toast message', 'info')}
                >
                  Show Info Toast
                </Button>
                <Button 
                  size="sm" 
                  color="success"
                  onClick={() => addToast('Success toast message', 'success')}
                >
                  Show Success Toast
                </Button>
                <Button 
                  size="sm" 
                  color="warning"
                  onClick={() => addToast('Warning toast message', 'warning')}
                >
                  Show Warning Toast
                </Button>
                <Button 
                  size="sm" 
                  color="error"
                  onClick={() => addToast('Error toast message', 'error')}
                >
                  Show Error Toast
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Component Grid */}
        <Card title="All Component Variants" bordered className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Input variants */}
            <div className="space-y-3">
              <h4 className="font-semibold">Input Variants</h4>
              <Input placeholder="Default input" />
              <Input placeholder="Primary input" color="primary" bordered />
              <Input placeholder="Ghost input" ghost />
              <Input placeholder="Error state" error helperText="This field is required" />
            </div>

            {/* Textarea variants */}
            <div className="space-y-3">
              <h4 className="font-semibold">Textarea Variants</h4>
              <Textarea placeholder="Default textarea" rows={2} />
              <Textarea placeholder="Bordered textarea" bordered rows={2} />
              <Textarea placeholder="Auto-resize textarea" autoSize minRows={2} maxRows={4} />
            </div>

            {/* Checkbox variants */}
            <div className="space-y-3">
              <h4 className="font-semibold">Checkbox Variants</h4>
              <Checkbox label="Default checkbox" />
              <Checkbox label="Primary checkbox" color="primary" checked />
              <Checkbox label="Large checkbox" size="lg" color="accent" />
              <Checkbox label="Indeterminate" indeterminate />
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-base-content/60">
          <p>DaisyUI React Component Library • Built with TypeScript & TailwindCSS</p>
          <p className="text-sm mt-2">
            This demo showcases {' '}
            <span className="font-semibold">8 out of 61</span> DaisyUI components implemented
          </p>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default DemoShowcase;