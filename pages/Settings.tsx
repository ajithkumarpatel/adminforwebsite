import React, { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { SiteSettings } from '../types';
import { useAuth } from '../hooks/useAuth';
import Card, { CardContent, CardFooter, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
// FIX: Changed import from 'firebase/app' to '@firebase/app' to fix module resolution issue.
import { FirebaseError } from '@firebase/app';
import { Twitter, Linkedin, Facebook, Instagram, Github } from 'lucide-react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

const securityRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ... other rules should be here ...

    // --- Site Settings Rules ---
    // Allow public read for website display.
    // Only authenticated admins can write/update settings.
    match /settings/global {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`;

const PasswordChangeForm: React.FC = () => {
    const { user } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (!user || !user.email) {
            setError("Could not find user information.");
            return;
        }

        setSaving(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);

            setSuccess("Password updated successfully!");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error("Password change error:", err);
             if (err instanceof FirebaseError) {
                if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                    setError("The current password you entered is incorrect.");
                } else if (err.code === 'auth/weak-password') {
                    setError("The new password must be at least 6 characters long.");
                } else {
                     setError("An unexpected error occurred. Please try again.");
                }
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setSaving(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Account Security</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Change your login password.</p>
            </CardHeader>
             <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                     {error && <Alert title="Error">{error}</Alert>}
                     {success && <p className="text-sm p-3 rounded-md bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">{success}</p>}
                    <div>
                        <label htmlFor="currentPassword"className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                        <Input type="password" name="currentPassword" id="currentPassword" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="mt-1" />
                    </div>
                     <div>
                        <label htmlFor="newPassword"className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                        <Input type="password" name="newPassword" id="newPassword" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1" />
                    </div>
                     <div>
                        <label htmlFor="confirmPassword"className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                        <Input type="password" name="confirmPassword" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1" />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end bg-gray-50 dark:bg-gray-800/50">
                     <Button type="submit" disabled={saving}>
                        {saving ? <Spinner className="w-5 h-5 mr-2" /> : null}
                        {saving ? 'Saving...' : 'Change Password'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

const Settings: React.FC = () => {
  const [settings, setSettings] = React.useState<SiteSettings>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<React.ReactNode>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const settingsDocRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as SiteSettings);
        }
      } catch (err: any) {
        console.error("Error fetching settings:", err);
        if (err instanceof FirebaseError && err.code === 'permission-denied') {
          setError(
            <>
              <p>To manage site settings, you need to update your Firestore Security Rules. Ensure your rules file includes a section for the 'settings' collection:</p>
              <pre className="mt-4 p-3 bg-gray-800 text-white rounded-md text-xs font-mono overflow-x-auto">
                <code>{securityRules}</code>
              </pre>
            </>
          );
        } else {
          setError("Failed to load site settings. Please check your connection and try again.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const settingsDocRef = doc(db, 'settings', 'global');
      await setDoc(settingsDocRef, settings, { merge: true });
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error saving settings:", err);
       if (err instanceof FirebaseError && err.code === 'permission-denied') {
        setError(
          <p>You do not have permission to save settings. Please update your Firestore Security Rules to allow writes to the 'settings' collection for authenticated users.</p>
        );
      } else {
        setError("Failed to save settings. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Spinner className="w-10 h-10 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Site Settings</h1>
      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Global Information</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              This information will be used across your public-facing website.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && <Alert title="Error">{error}</Alert>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Email</label>
                <Input
                  type="email"
                  name="contactEmail"
                  id="contactEmail"
                  value={settings.contactEmail || ''}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="contact@yourcompany.com"
                />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                <Input
                  type="tel"
                  name="phoneNumber"
                  id="phoneNumber"
                  value={settings.phoneNumber || ''}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="+91 12345 67890"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
              <Input
                type="text"
                name="address"
                id="address"
                value={settings.address || ''}
                onChange={handleChange}
                className="mt-1"
                placeholder="123 Tech Park, Bangalore, India"
              />
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                 <h3 className="text-lg font-medium text-gray-900 dark:text-white">Social Media Links</h3>
                 <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="twitterUrl" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Twitter size={16} className="mr-2 text-[#1DA1F2]" /> Twitter Profile URL
                      </label>
                      <Input type="url" name="twitterUrl" id="twitterUrl" value={settings.twitterUrl || ''} onChange={handleChange} className="mt-1" placeholder="https://twitter.com/yourprofile" />
                    </div>
                     <div>
                      <label htmlFor="linkedinUrl" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Linkedin size={16} className="mr-2 text-[#0A66C2]" /> LinkedIn Profile URL
                      </label>
                      <Input type="url" name="linkedinUrl" id="linkedinUrl" value={settings.linkedinUrl || ''} onChange={handleChange} className="mt-1" placeholder="https://linkedin.com/in/yourprofile" />
                    </div>
                    <div>
                      <label htmlFor="facebookUrl" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Facebook size={16} className="mr-2 text-[#1877F2]" /> Facebook Profile URL
                      </label>
                      <Input type="url" name="facebookUrl" id="facebookUrl" value={settings.facebookUrl || ''} onChange={handleChange} className="mt-1" placeholder="https://facebook.com/yourprofile" />
                    </div>
                     <div>
                      <label htmlFor="instagramUrl" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Instagram size={16} className="mr-2 text-[#E4405F]" /> Instagram Profile URL
                      </label>
                      <Input type="url" name="instagramUrl" id="instagramUrl" value={settings.instagramUrl || ''} onChange={handleChange} className="mt-1" placeholder="https://instagram.com/yourprofile" />
                    </div>
                     <div>
                      <label htmlFor="githubUrl" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Github size={16} className="mr-2 text-gray-800 dark:text-gray-200" /> GitHub Profile URL
                      </label>
                      <Input type="url" name="githubUrl" id="githubUrl" value={settings.githubUrl || ''} onChange={handleChange} className="mt-1" placeholder="https://github.com/yourprofile" />
                    </div>
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
      
      <PasswordChangeForm />

    </div>
  );
};

export default Settings;