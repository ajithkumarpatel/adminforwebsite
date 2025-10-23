import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import Card, { CardContent, CardFooter, CardHeader } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Alert from '../ui/Alert';

interface ImpactNumbers {
  projectsCompleted: number;
  happyClients: number;
  yearsOfExperience: number;
}

const ImpactNumbersAdmin: React.FC = () => {
  const [numbers, setNumbers] = useState<ImpactNumbers>({
    projectsCompleted: 0,
    happyClients: 0,
    yearsOfExperience: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchNumbers = async () => {
      setLoading(true);
      setError(null);
      try {
        const settingsDocRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists() && docSnap.data().impactNumbers) {
          setNumbers(docSnap.data().impactNumbers);
        }
      } catch (err) {
        console.error("Error fetching impact numbers:", err);
        setError("Failed to load impact numbers. Please check your Firestore permissions.");
      } finally {
        setLoading(false);
      }
    };
    fetchNumbers();
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNumbers(prev => ({ ...prev, [name]: Number(value) < 0 ? 0 : Number(value) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const settingsDocRef = doc(db, 'settings', 'global');
      await setDoc(settingsDocRef, { impactNumbers: numbers }, { merge: true });
      setSuccess("Impact numbers updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving impact numbers:", err);
      setError("Failed to save numbers. Please check your permissions and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Update Impact Numbers</h2>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-48">
          <Spinner className="w-8 h-8 text-primary-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSave}>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Update Impact Numbers</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Edit the numbers displayed on your homepage's "Our Impact" section.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <Alert title="Error">{error}</Alert>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="projectsCompleted" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Projects Completed</label>
              <Input
                type="number"
                name="projectsCompleted"
                id="projectsCompleted"
                value={numbers.projectsCompleted}
                onChange={handleChange}
                className="mt-1"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="happyClients" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Happy Clients</label>
              <Input
                type="number"
                name="happyClients"
                id="happyClients"
                value={numbers.happyClients}
                onChange={handleChange}
                className="mt-1"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Years of Experience</label>
              <Input
                type="number"
                name="yearsOfExperience"
                id="yearsOfExperience"
                value={numbers.yearsOfExperience}
                onChange={handleChange}
                className="mt-1"
                min="0"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          {success && <p className="text-sm text-green-600 dark:text-green-400 animate-pulse">{success}</p>}
          <div className="flex-grow"></div>
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner className="w-5 h-5 mr-2" /> : null}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default ImpactNumbersAdmin;