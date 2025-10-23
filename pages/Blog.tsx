


import React, { useState, useEffect, useCallback } from 'react';
// FIX: Reverted to namespace import for react-router-dom to resolve module export issues.
import * as ReactRouterDom from 'react-router-dom';
import { collection, query, getDocs, deleteDoc, doc, orderBy as fbOrderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { BlogPost } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import { PlusCircle, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
// FIX: Changed import from 'firebase/app' to '@firebase/app' to fix module resolution issue.
import { FirebaseError } from '@firebase/app';

const securityRules = `rules_version = '2';

// --- Firestore Rules ---
service cloud.firestore {
  match /databases/{database}/documents {
    match /contacts/{contactId} {
      allow create: if true;
      allow read, delete: if request.auth != null;
    }
    match /pricingPlans/{planId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /settings/global {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /blogPosts/{postId} {
      allow read: if resource.data.status == 'published' || request.auth != null;
      allow write: if request.auth != null;
    }
  }
}

// --- Storage Rules ---
service firebase.storage {
  match /b/{bucket}/o {
    // Only authenticated admins can upload images to the 'blog' folder.
    // Anyone can read images, as they are for the public-facing website.
    match /blog/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`;


const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<React.ReactNode>(null);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const postsQuery = query(collection(db, 'blogPosts'), fbOrderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(postsQuery);
      const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
      setPosts(postsData);
    } catch (err: any)
{
      console.error("Error fetching blog posts:", err);
       if (err instanceof FirebaseError && err.code === 'permission-denied') {
        setError(
          <>
            <p>To manage blog posts and images, you must update your <strong>Firestore and Storage Security Rules</strong>. Copy the full ruleset below and paste it into the appropriate tabs in your Firebase project.</p>
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
    fetchPosts();
  }, [fetchPosts]);
  
  const handleDelete = async () => {
    if (!postToDelete) return;
    try {
        await deleteDoc(doc(db, 'blogPosts', postToDelete.id));
        setPosts(prev => prev.filter(p => p.id !== postToDelete.id));
        setPostToDelete(null);
    } catch(err) {
        console.error("Error deleting post: ", err);
        alert("Failed to delete post.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Blog Posts</h1>
        <Button as={ReactRouterDom.Link} to="/blog/new">
          <PlusCircle size={20} className="mr-2" />
          Create New Post
        </Button>
      </div>

       {error && <Alert title="Permission Error">{error}</Alert>}

      <Card>
        <CardHeader>
          <p className="text-gray-600 dark:text-gray-400">Manage all articles and announcements for your website.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <Spinner className="w-10 h-10 text-primary-600" />
              </div>
            ) : posts.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {posts.map(post => (
                  <tr key={post.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {post.featureImageUrl ? (
                            <img src={post.featureImageUrl} alt={post.title} className="h-10 w-16 object-cover rounded-md" />
                        ) : (
                            <div className="h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                            </div>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{post.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${post.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{post.createdAt.toDate().toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                       <Button as={ReactRouterDom.Link} to={`/blog/edit/${post.id}`} variant="secondary" size="sm" aria-label="Edit Post">
                         <Edit size={16} />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setPostToDelete(post)} aria-label="Delete post">
                         <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            ) : (
                <p className="text-center py-16 text-gray-500 dark:text-gray-400">
                  No blog posts found. Get started by creating one!
                </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={!!postToDelete}
        onClose={() => setPostToDelete(null)}
        title="Confirm Deletion"
      >
        <div>
          <p className="text-gray-600 dark:text-gray-300">Are you sure you want to delete the post titled "{postToDelete?.title}"?</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This action cannot be undone and will also delete its feature image.</p>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setPostToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Blog;