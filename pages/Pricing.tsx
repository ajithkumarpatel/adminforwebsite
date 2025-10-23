import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { PricingPlan } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import PricingPlanForm from '../components/pricing/PricingPlanForm';
import Alert from '../components/ui/Alert';
import { PlusCircle, Edit, Trash2, CheckCircle, Star } from 'lucide-react';
// FIX: Changed import from 'firebase/app' to '@firebase/app' to fix module resolution issue.
import { FirebaseError } from '@firebase/app';

const securityRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rules for the 'pricingPlans' collection
    match /pricingPlans/{planId} {
      // ANYONE can read the plans (for your public website).
      allow read: if true;

      // ONLY authenticated users (your admins) can create, update, or delete plans.
      allow write: if request.auth != null;
    }
  }
}`;

const Pricing: React.FC = () => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<React.ReactNode>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<PricingPlan | null>(null);
  
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const plansQuery = query(collection(db, 'pricingPlans'), orderBy('title'));
      const querySnapshot = await getDocs(plansQuery);
      const plansData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PricingPlan));
      setPlans(plansData);
    } catch (err: any) {
      console.error("Error fetching pricing plans:", err);
      if (err instanceof FirebaseError && err.code === 'permission-denied') {
        setError(
          <>
            <p>To manage pricing plans, you need to update your Firestore Security Rules. Go to your Firebase project's <strong>Firestore Database &gt; Rules</strong> tab and use the following rules:</p>
            <pre className="mt-4 p-3 bg-gray-800 text-white rounded-md text-xs font-mono overflow-x-auto">
              <code>{securityRules}</code>
            </pre>
          </>
        );
      } else {
        setError(`An unexpected error occurred: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleCreateNew = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const handleEdit = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (planData: Omit<PricingPlan, 'id'>) => {
    if (editingPlan) {
      // Update existing plan
      const planDoc = doc(db, 'pricingPlans', editingPlan.id);
      await updateDoc(planDoc, planData);
    } else {
      // Create new plan
      await addDoc(collection(db, 'pricingPlans'), planData);
    }
    fetchPlans();
  };
  
  const handleDelete = async () => {
    if (!planToDelete) return;
    await deleteDoc(doc(db, 'pricingPlans', planToDelete.id));
    setPlanToDelete(null);
    fetchPlans();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Pricing Plans</h1>
        <Button onClick={handleCreateNew}>
          <PlusCircle size={20} className="mr-2" />
          Create New Plan
        </Button>
      </div>

      {error && (
        <Alert title="Error Fetching Plans">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Spinner className="w-10 h-10 text-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <Card key={plan.id} className="flex flex-col">
              {plan.mostPopular && (
                <div className="bg-primary-600 text-white text-sm font-semibold py-1 px-3 text-center flex items-center justify-center">
                  <Star size={14} className="mr-1.5" /> Most Popular
                </div>
              )}
              <CardHeader>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.title}</h3>
                <p className="text-2xl font-semibold text-primary-600 dark:text-primary-400 mt-2">{plan.price}</p>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle size={18} className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex justify-end space-x-2">
                <Button variant="secondary" size="sm" onClick={() => handleEdit(plan)}><Edit size={16} /></Button>
                <Button variant="destructive" size="sm" onClick={() => setPlanToDelete(plan)}><Trash2 size={16} /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Edit Pricing Plan' : 'Create New Pricing Plan'}
      >
        <PricingPlanForm
          plan={editingPlan}
          onSubmit={handleFormSubmit}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        title="Confirm Deletion"
      >
        <div>
          <p className="text-gray-600 dark:text-gray-300">Are you sure you want to delete the "{planToDelete?.title}" plan?</p>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setPlanToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Pricing;