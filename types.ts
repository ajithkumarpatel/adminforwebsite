import { Timestamp } from 'firebase/firestore';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Timestamp;
}

export interface PricingPlan {
  id: string;
  title: string;
  price: string;
  features: string[];
  mostPopular: boolean;
}

export interface SiteSettings {
  contactEmail?: string;
  phoneNumber?: string;
  address?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  githubUrl?: string;
  impactNumbers?: {
    projectsCompleted: number;
    happyClients: number;
    yearsOfExperience: number;
  };
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: string; // Admin's email
  status: 'published' | 'draft';
  featureImageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}