
import React, { useState, useEffect } from 'react';
import { PricingPlan } from '../../types';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

interface PricingPlanFormProps {
  plan?: PricingPlan | null;
  onSubmit: (planData: Omit<PricingPlan, 'id'>) => Promise<void>;
  onClose: () => void;
}

const PricingPlanForm: React.FC<PricingPlanFormProps> = ({ plan, onSubmit, onClose }) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [features, setFeatures] = useState('');
  const [mostPopular, setMostPopular] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (plan) {
      setTitle(plan.title);
      setPrice(plan.price);
      setFeatures(plan.features.join('\n'));
      setMostPopular(plan.mostPopular);
    } else {
      setTitle('');
      setPrice('');
      setFeatures('');
      setMostPopular(false);
    }
  }, [plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title || !price || !features) {
      setError('All fields are required.');
      return;
    }

    setIsSubmitting(true);
    const featuresArray = features.split('\n').filter(f => f.trim() !== '');
    try {
      await onSubmit({ title, price, features: featuresArray, mostPopular });
      onClose();
    } catch (err) {
      setError('Failed to save the plan. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Title</label>
        <Input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
        <Input id="price" type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., Starting at ₹40,000" required />
      </div>
      <div>
        <label htmlFor="features" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Features (one per line)</label>
        <Textarea id="features" value={features} onChange={(e) => setFeatures(e.target.value)} rows={5} required />
      </div>
      <div className="flex items-center">
        <input
          id="mostPopular"
          type="checkbox"
          checked={mostPopular}
          onChange={(e) => setMostPopular(e.target.checked)}
          className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <label htmlFor="mostPopular" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">
          Mark as "Most Popular"
        </label>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="w-5 h-5" /> : (plan ? 'Update Plan' : 'Create Plan')}
        </Button>
      </div>
    </form>
  );
};

export default PricingPlanForm;
