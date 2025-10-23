import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { SiteSettings } from '../../types';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Spinner from '../ui/Spinner';
import { Briefcase, Smile, Award } from 'lucide-react';

const ImpactStat: React.FC<{ icon: React.ReactNode; value: number; label: string }> = ({ icon, value, label }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const duration = 1500;
    const incrementTime = Math.max(10, duration / end);
    
    const timer = setInterval(() => {
      start += 1;
      setDisplayValue(start);
      if (start === end) {
        clearInterval(timer);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-primary-500 mb-3">{icon}</div>
      <p className="text-4xl font-bold text-gray-800 dark:text-white">{displayValue.toLocaleString()}+</p>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
};

const ImpactNumbersDisplay: React.FC = () => {
  const [impactNumbers, setImpactNumbers] = useState<SiteSettings['impactNumbers'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNumbers = async () => {
      setLoading(true);
      setError(null);
      try {
        const settingsDocRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists() && docSnap.data().impactNumbers) {
          setImpactNumbers(docSnap.data().impactNumbers);
        } else {
          setImpactNumbers({ projectsCompleted: 0, happyClients: 0, yearsOfExperience: 0 });
        }
      } catch (err) {
        console.error("Error fetching impact numbers for display:", err);
        setError("Could not load impact numbers.");
      } finally {
        setLoading(false);
      }
    };
    fetchNumbers();
  }, []);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Homepage Impact Preview</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          This is a live preview of the "Our Impact" section on your website.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Spinner className="w-8 h-8 text-primary-600" />
          </div>
        ) : error || !impactNumbers ? (
          <div className="text-center py-8 text-red-500">{error || "No data available."}</div>
        ) : (
          <div className="grid grid-cols-3 gap-6 py-4">
            <ImpactStat 
              icon={<Briefcase size={32} />} 
              value={impactNumbers.projectsCompleted} 
              label="Projects Completed" 
            />
            <ImpactStat 
              icon={<Smile size={32} />} 
              value={impactNumbers.happyClients} 
              label="Happy Clients" 
            />
            <ImpactStat 
              icon={<Award size={32} />} 
              value={impactNumbers.yearsOfExperience} 
              label="Years Of Experience" 
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImpactNumbersDisplay;
