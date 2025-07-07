export interface Note {
  id: string;
  title: string;
  content: string;
  categories: string[];
  createdAt: string;
  isPublic?: boolean;
}
