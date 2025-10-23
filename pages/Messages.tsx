
import React, { useState, useEffect, useMemo, useCallback } from 'react';
// FIX: Using named import for react-router-dom to resolve module export issues.
import { useSearchParams } from 'react-router-dom';
import { collection, query, getDocs, orderBy as fbOrderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ContactMessage } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import { Trash2, ArrowUpDown, Eye, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { FirebaseError } from '@firebase/app';

const securityRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rules for the 'contacts' collection
    match /contacts/{contactId} {
      // ANYONE can create (submit) a message.
      allow create: if true;

      // ONLY authenticated users (your admins) can read, list, and delete messages.
      allow read, delete: if request.auth != null;
    }
  }
}`;

const ITEMS_PER_PAGE = 10;

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<React.ReactNode>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [messageToDelete, setMessageToDelete] = useState<ContactMessage | null>(null);
  const [viewingMessage, setViewingMessage] = useState<ContactMessage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const messagesQuery = query(collection(db, 'contacts'), fbOrderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(messagesQuery);
      const messagesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage));
      setMessages(messagesData);
    } catch (err: any) {
      console.error("Error fetching messages:", err);
      if (err instanceof FirebaseError && err.code === 'permission-denied') {
        setError(
          <>
            <p>To view messages, you need to update your Firestore Security Rules. Go to your Firebase project's <strong>Firestore Database &gt; Rules</strong> tab and use the following rules:</p>
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
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams]);

  const filteredMessages = useMemo(() => {
    const searchTerm = searchParams.get('search')?.toLowerCase() || '';
    if (!searchTerm) return messages;

    return messages.filter(msg => 
        msg.name.toLowerCase().includes(searchTerm) ||
        msg.email.toLowerCase().includes(searchTerm) ||
        msg.subject.toLowerCase().includes(searchTerm) ||
        msg.message.toLowerCase().includes(searchTerm)
    );
  }, [messages, searchParams]);

  const sortedMessages = useMemo(() => {
    return [...filteredMessages].sort((a, b) => {
      const dateA = a.createdAt.toMillis();
      const dateB = b.createdAt.toMillis();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [filteredMessages, sortOrder]);

  const totalPages = Math.ceil(sortedMessages.length / ITEMS_PER_PAGE);
  const paginatedMessages = useMemo(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      return sortedMessages.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedMessages, currentPage]);


  const handleSort = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };
  
  const handleDelete = async () => {
    if (!messageToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'contacts', messageToDelete.id));
      setMessages(prev => prev.filter(msg => msg.id !== messageToDelete.id));
      setMessageToDelete(null);
    } catch (err) {
      console.error("Error deleting message:", err);
      alert('Failed to delete message.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  const handleExportCSV = () => {
    if (sortedMessages.length === 0) {
      alert("No messages to export.");
      return;
    }

    const headers = ["ID", "Name", "Email", "Subject", "Message", "Date Received"];
    const rows = sortedMessages.map(msg => [
      `"${msg.id}"`,
      `"${msg.name.replace(/"/g, '""')}"`,
      `"${msg.email.replace(/"/g, '""')}"`,
      `"${msg.subject.replace(/"/g, '""')}"`,
      `"${msg.message.replace(/"/g, '""')}"`,
      `"${msg.createdAt.toDate().toISOString()}"`
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `messages_export_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Contact Messages</h1>
      {error && (
        <Alert title="Error Fetching Messages">
          {error}
        </Alert>
      )}
      <Card>
        <CardHeader className="flex justify-between items-center flex-wrap gap-4">
          <p className="text-gray-600 dark:text-gray-400">View and manage all submissions from your website's contact form.</p>
          <Button variant="secondary" onClick={handleExportCSV} disabled={sortedMessages.length === 0}>
            <Download size={16} className="mr-2" />
            Export to CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <Spinner className="w-10 h-10 text-primary-600" />
              </div>
            ) : paginatedMessages.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <button onClick={handleSort} className="flex items-center group">
                      Date Received
                      <ArrowUpDown size={14} className="ml-2 text-gray-400 group-hover:text-gray-600" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedMessages.map(msg => (
                  <tr key={msg.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{msg.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{msg.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{msg.subject}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate" title={msg.message}>{msg.message}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{msg.createdAt.toDate().toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Button variant="secondary" size="sm" onClick={() => setViewingMessage(msg)} aria-label="View message">
                        <Eye size={16} />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setMessageToDelete(msg)} aria-label="Delete message">
                         <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            ) : (
                <p className="text-center py-16 text-gray-500 dark:text-gray-400">
                  {searchParams.get('search') ? `No messages found for "${searchParams.get('search')}"` : 'No messages found.'}
                </p>
            )}
          </div>
        </CardContent>
        {totalPages > 1 && !loading && (
          <CardFooter className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center space-x-2">
                <Button variant="secondary" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}>
                    <ChevronLeft size={16} className="mr-1" /> Previous
                </Button>
                <Button variant="secondary" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
                    Next <ChevronRight size={16} className="ml-1" />
                </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* View Message Modal */}
      <Modal
        isOpen={!!viewingMessage}
        onClose={() => setViewingMessage(null)}
        title={`Message from ${viewingMessage?.name}`}
        size="2xl"
      >
        {viewingMessage && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">From</p>
              <p className="text-gray-900 dark:text-white">{viewingMessage.name} &lt;{viewingMessage.email}&gt;</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Received</p>
              <p className="text-gray-900 dark:text-white">{viewingMessage.createdAt.toDate().toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Subject</p>
              <p className="text-gray-900 dark:text-white">{viewingMessage.subject}</p>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Message</p>
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-3 rounded-md mt-1 max-h-60 overflow-y-auto">{viewingMessage.message}</p>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="secondary" onClick={() => setViewingMessage(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!messageToDelete}
        onClose={() => setMessageToDelete(null)}
        title="Confirm Deletion"
      >
        <div>
          <p className="text-gray-600 dark:text-gray-300">Are you sure you want to delete this message from "{messageToDelete?.name}"?</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This action cannot be undone.</p>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setMessageToDelete(null)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Spinner className="w-5 h-5"/> : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Messages;
