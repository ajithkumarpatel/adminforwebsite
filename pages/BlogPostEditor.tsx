
import React, { useState, useEffect, useCallback, useMemo } from 'react';
// FIX: Using named imports for react-router-dom to resolve module export issues.
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { BlogPost } from '../types';
import Card, { CardContent, CardFooter, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import ToggleSwitch from '../components/ui/ToggleSwitch';
import { marked } from 'marked';

const BlogPostEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('draft');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!id;

  const fetchPost = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const postDocRef = doc(db, 'blogPosts', id);
      const docSnap = await getDoc(postDocRef);
      if (docSnap.exists()) {
        const postData = docSnap.data() as Omit<BlogPost, 'id'>;
        setTitle(postData.title);
        setContent(postData.content);
        setStatus(postData.status);
        if (postData.featureImageUrl) {
            setImagePreview(postData.featureImageUrl);
        }
      } else {
        setError("Blog post not found.");
      }
    } catch (err) {
      console.error("Error fetching post:", err);
      setError("Failed to load the blog post. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      fetchPost();
    }
  }, [isEditing, fetchPost]);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        // FIX: Corrected typo from `readDataURL` to `readAsDataURL`
        reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !user?.email) {
      setError("Title and content are required.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      let featureImageUrl: string | undefined = isEditing && !imageFile ? imagePreview || undefined : undefined;
      
      if (imageFile) {
        const storageRef = ref(storage, `blog/${Date.now()}_${imageFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);

        // Listen for state changes, errors, and completion of the upload.
        uploadTask.on('state_changed',
          (snapshot) => {
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            // The 'await' below will also catch this error, but logging it here can be useful for debugging.
            console.error("Upload error listener:", error);
          }
        );

        // Wait for the upload to complete. This is more robust than a manual promise.
        await uploadTask;

        // Upload completed successfully, now we can get the download URL
        featureImageUrl = await getDownloadURL(uploadTask.snapshot.ref);
      }
      
      const postData = {
        title,
        content,
        status,
        author: user.email,
        featureImageUrl,
        updatedAt: serverTimestamp(),
      };
      
      if (isEditing) {
        const postDocRef = doc(db, 'blogPosts', id);
        await setDoc(postDocRef, postData, { merge: true });
      } else {
        await addDoc(collection(db, 'blogPosts'), {
          ...postData,
          createdAt: serverTimestamp(),
        });
      }
      navigate('/blog');
    } catch (err: any) {
      console.error("Error saving post:", err);
      setError(typeof err === 'string' ? err : "Failed to save the post. Please check your permissions and try again.");
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };
  
   const markdownPreview = useMemo(() => {
    return marked.parse(content || '');
  }, [content]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Spinner className="w-10 h-10 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <form onSubmit={handleSave}>
          <div className="flex justify-between items-center mb-6">
               <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h1>
              <div className="flex items-center space-x-4">
                 <Button type="button" variant="secondary" onClick={() => navigate('/blog')} disabled={saving}>
                    Cancel
                 </Button>
                <Button type="submit" disabled={saving || uploadProgress !== null}>
                  {saving ? <Spinner className="w-5 h-5 mr-2" /> : null}
                  {uploadProgress !== null ? `Uploading... ${Math.round(uploadProgress)}%` : (saving ? 'Saving...' : 'Save Post')}
                </Button>
            </div>
          </div>
          
           {error && <Alert title="Error" className="mb-4">{error}</Alert>}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <Card>
                        <CardContent className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                                <Input type="text" name="title" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 !py-3 !text-lg" placeholder="Your post title" required />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-300 dark:bg-gray-600 rounded-lg overflow-hidden" style={{ minHeight: '600px'}}>
                        {/* Markdown Editor */}
                        <div className="bg-white dark:bg-gray-900">
                             <Textarea name="content" id="content" value={content} onChange={(e) => setContent(e.target.value)} className="!h-full !border-0 !rounded-none resize-none focus:!ring-0" rows={25} placeholder="Write your blog post here... Markdown is supported." required />
                        </div>

                         {/* Preview Pane */}
                        <div className="bg-white dark:bg-gray-800 p-6 overflow-y-auto">
                            <div
                                className="prose prose-lg dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: markdownPreview }}
                            />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                     <Card>
                         <CardHeader><h3 className="text-lg font-medium">Publish Settings</h3></CardHeader>
                         <CardContent>
                             <ToggleSwitch 
                                id="status"
                                checked={status === 'published'}
                                onChange={(checked) => setStatus(checked ? 'published' : 'draft')}
                                label={status === 'published' ? 'Published' : 'Draft'}
                            />
                         </CardContent>
                     </Card>
                     <Card>
                          <CardHeader><h3 className="text-lg font-medium">Feature Image</h3></CardHeader>
                          <CardContent>
                              <Input id="feature-image" type="file" onChange={handleImageChange} accept="image/*" className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                              {imagePreview && <img src={imagePreview} alt="Preview" className="mt-4 rounded-lg w-full object-cover" />}
                          </CardContent>
                     </Card>
                </div>
            </div>
      </form>
       <style>{`
            .prose h1, .prose h2, .prose h3 { margin-bottom: 0.5em; margin-top: 1em; }
            .prose a { color: #2563eb; }
            .dark .prose a { color: #60a5fa; }
            .prose pre { background-color: #1f2937; color: #d1d5db; padding: 1em; border-radius: 0.5em; }
            .prose blockquote { border-left-color: #2563eb; }
        `}</style>
    </div>
  );
};

export default BlogPostEditor;
