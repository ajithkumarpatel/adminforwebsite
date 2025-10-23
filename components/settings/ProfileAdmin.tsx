import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateProfile } from 'firebase/auth';
import Card, { CardContent, CardFooter, CardHeader } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Alert from '../ui/Alert';

const ProfileAdmin: React.FC = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("No user is logged in.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateProfile(user, { displayName });
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave}>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Admin Profile</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Update your administrator name.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <Alert title="Error">{error}</Alert>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <Input
                type="text"
                name="displayName"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <Input
                type="email"
                name="email"
                id="email"
                value={user?.email || ''}
                disabled
                className="mt-1 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          {success && <p className="text-sm text-green-600 dark:text-green-400 animate-pulse">{success}</p>}
          <div className="flex-grow"></div>
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner className="w-5 h-5 mr-2" /> : null}
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default ProfileAdmin;
