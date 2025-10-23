import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { ContactMessage, PricingPlan } from '../types';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import { MessageSquare, Tag, Clock, Mails, Star } from 'lucide-react';
// FIX: Changed import from 'firebase/app' to '@firebase/app' to fix module resolution issue.
import { FirebaseError } from '@firebase/app';

const securityRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // --- Contacts Collection Rules ---
    // Allow public users to submit messages (create).
    // Only authenticated admins can read or delete messages.
    match /contacts/{contactId} {
      allow create: if true;
      allow read, delete: if request.auth != null;
      allow update: if false;
    }

    // --- Pricing Plans Collection Rules ---
    // Allow public users to read pricing plans for the main website.
    // Only authenticated admins can create, update, or delete plans.
    match /pricingPlans/{planId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // --- Site Settings Rules ---
    // Allow public read for website display.
    // Only authenticated admins can write/update settings.
    match /settings/global {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`;

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; loading: boolean }> = ({ title, value, icon, loading }) => (
  <Card>
    <CardContent className="flex items-center justify-between p-6">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
        {loading ? <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse mt-1"></div> : <p className="text-3xl font-bold text-gray-900 dark:text-white truncate">{value}</p>}
      </div>
      <div className="bg-primary-100 dark:bg-primary-900/50 rounded-full p-3">
        {icon}
      </div>
    </CardContent>
  </Card>
);

interface ChartData {
  name: string;
  count: number;
}

const MessageChart: React.FC<{ data: ChartData[], loading: boolean }> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="flex justify-center items-center h-72 bg-gray-50 dark:bg-gray-800/50 rounded-lg animate-pulse">
                <Spinner className="w-8 h-8 text-primary-500" />
            </div>
        );
    }
    
    if (data.length === 0) {
        return <p className="text-center py-8 text-gray-500 dark:text-gray-400">Not enough data to display chart.</p>;
    }

    const maxCount = Math.max(...data.map(d => d.count), 0);
    const yAxisLabels = [0, Math.ceil(maxCount / 2), maxCount].filter((v, i, a) => a.indexOf(v) === i); // Unique values

    return (
        <div className="p-4">
          <svg width="100%" height="250" aria-label="Messages per day chart">
              <g className="y-axis-labels">
                  {yAxisLabels.map(label => (
                      <text
                          key={label}
                          x="20"
                          y={210 - (label / maxCount) * 180}
                          dy="0.32em"
                          textAnchor="end"
                          className="text-xs fill-current text-gray-500 dark:text-gray-400"
                      >
                          {label}
                      </text>
                  ))}
              </g>
               <g className="chart-area" transform="translate(30, 0)">
                  {data.map((d, i) => {
                      const barHeight = maxCount > 0 ? (d.count / maxCount) * 180 : 0;
                      const barWidth = 30;
                      const x = (i * ((100 / data.length) * 0.8)) + '%'; // Using percentage for responsive bars
                      const y = 210 - barHeight;

                      return (
                          <g key={d.name}>
                              <rect
                                  x={x}
                                  y={y}
                                  width="8%"
                                  height={barHeight}
                                  className="fill-primary-500 hover:fill-primary-600 transition-colors"
                                  rx="4"
                              >
                                 <title>{d.name}: {d.count} messages</title>
                              </rect>
                               <text
                                  x={`calc(${x} + 4%)`}
                                  y="225"
                                  textAnchor="middle"
                                  className="text-xs fill-current text-gray-600 dark:text-gray-300 font-medium"
                              >
                                  {d.name}
                              </text>
                          </g>
                      );
                  })}
              </g>
          </svg>
        </div>
    );
};


const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState({ newMessages: 0, totalPlans: 0, totalMessages: 0, mostPopularPlan: '' });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<React.ReactNode>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // --- Fetch stats ---
        const twentyFourHoursAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
        const newMessagesQuery = query(collection(db, 'contacts'), where('createdAt', '>=', twentyFourHoursAgo));
        const newMessagesSnapshot = await getDocs(newMessagesQuery);

        const allMessagesSnapshot = await getDocs(collection(db, 'contacts'));
        
        const plansQuery = query(collection(db, 'pricingPlans'));
        const plansSnapshot = await getDocs(plansQuery);

        const popularPlanQuery = query(collection(db, 'pricingPlans'), where('mostPopular', '==', true), limit(1));
        const popularPlanSnapshot = await getDocs(popularPlanQuery);
        const popularPlan = popularPlanSnapshot.docs.map(doc => doc.data() as PricingPlan)[0];

        setStats({ 
            newMessages: newMessagesSnapshot.size, 
            totalPlans: plansSnapshot.size,
            totalMessages: allMessagesSnapshot.size,
            mostPopularPlan: popularPlan?.title || 'Not Set'
        });

        // --- Fetch recent messages ---
        const recentMessagesQuery = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'), limit(5));
        const recentMessagesSnapshot = await getDocs(recentMessagesQuery);
        const recentMessagesData = recentMessagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage));
        setMessages(recentMessagesData);

        // --- Fetch Chart Data ---
        const today = new Date();
        const chartDataPromises: Promise<any>[] = [];
        const labels: string[] = [];

        for (let i = 6; i >= 0; i--) {
            const day = new Date(today);
            day.setDate(today.getDate() - i);
            
            const startOfDay = new Date(day);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(day);
            endOfDay.setHours(23, 59, 59, 999);

            const q = query(collection(db, 'contacts'), where('createdAt', '>=', Timestamp.fromDate(startOfDay)), where('createdAt', '<=', Timestamp.fromDate(endOfDay)));
            chartDataPromises.push(getDocs(q));
            labels.push(day.toLocaleDateString('en-US', { weekday: 'short' }));
        }

        const snapshots = await Promise.all(chartDataPromises);
        const weeklyChartData = snapshots.map((snapshot, index) => ({
            name: labels[index],
            count: snapshot.size
        }));
        setChartData(weeklyChartData);

      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        if (err instanceof FirebaseError && err.code === 'permission-denied') {
            setError(
              <>
                <p>Your Firestore security rules are blocking access to dashboard data. To fix this, go to your Firebase project, navigate to <strong>Firestore Database &gt; Rules</strong>, and replace the existing rules with the following:</p>
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
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back, {user?.email || 'Admin'}!</p>
        </div>
      
      {error && (
        <Alert title="Could Not Load Dashboard Data">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="New Messages (24h)" value={stats.newMessages} icon={<MessageSquare className="text-primary-600 dark:text-primary-400" />} loading={loading} />
        <StatCard title="Total Messages" value={stats.totalMessages} icon={<Mails className="text-primary-600 dark:text-primary-400" />} loading={loading} />
        <StatCard title="Pricing Plans" value={stats.totalPlans} icon={<Tag className="text-primary-600 dark:text-primary-400" />} loading={loading} />
        <StatCard title="Most Popular Plan" value={stats.mostPopularPlan} icon={<Star className="text-primary-600 dark:text-primary-400" />} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <Card className="lg:col-span-3">
              <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Last 7 Days Engagement</h2>
              </CardHeader>
              <CardContent>
                  <MessageChart data={chartData} loading={loading} />
              </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Recent Messages</h2>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8 h-72">
                  <Spinner className="w-8 h-8 text-primary-600" />
                </div>
              ) : messages.length > 0 ? (
                <div className="overflow-x-auto">
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {messages.map(msg => (
                      <li key={msg.id} className="py-4">
                        <div className="flex space-x-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white">{msg.name} - <span className="font-normal text-gray-600 dark:text-gray-400">{msg.subject}</span></h3>
                               <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center shrink-0">
                                <Clock size={14} className="mr-1.5" />
                                {msg.createdAt.toDate().toLocaleDateString()}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{msg.message}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex justify-center items-center h-72">
                    <p className="text-center py-8 text-gray-500 dark:text-gray-400">No recent messages.</p>
                </div>
              )}
            </CardContent>
          </Card>
      </div>

    </div>
  );
};

export default Dashboard;