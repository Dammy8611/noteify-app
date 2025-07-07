# Noteify - The AI-Powered Note-Taking App

Noteify is an intelligent, modern note-taking application designed to help you capture, organize, and expand on your ideas. It combines a clean, minimalist editor with powerful generative AI features to supercharge your productivity.

## ✨ Key Features

- **Effortless Note-Taking**: A clean, distraction-free editor with intuitive markdown support for headings, bold, italics, lists, and more.
- **🤖 AI Research Assistant**: Ask a question or provide a topic, and the AI will generate a comprehensive, well-structured note for you, using its own knowledge and your existing notes for context.
- **🧠 AI Brainstorming**: Stuck with writer's block? Let the AI expand on your raw ideas, adding depth, detail, and structure to your notes.
- **🔍 Intelligent Search**: Go beyond simple keyword search. Describe what you're looking for, and the AI will semantically search your notes to find the most relevant information.
- **🏷️ AI-Powered Categorization**: Automatically suggest relevant categories for your notes to keep them organized and easy to find.
- **🔗 Secure Sharing**: Generate a unique, read-only link for any note to securely share your ideas with others.
- **💾 Versatile Downloads**: Export your notes as TXT, PDF, or DOCX files, with formatting preserved, to use them anywhere you need.
- **🔐 Secure Authentication**: Sign up and log in securely with your email and password or with your Google account.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **UI Library**: [React](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Authentication, Firestore, App Hosting)
- **Generative AI**: [Google AI](https://ai.google/) via [Genkit](https://firebase.google.com/docs/genkit)

## 🚀 Getting Started

Follow these instructions to get a local copy of the project up and running for development and testing.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- An active [Firebase Project](https://console.firebase.google.com/).

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repository-name.git
    cd your-repository-name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of your project and add your Firebase project's web app credentials. You can find these in your Firebase project settings under "General".

    ```env
    # .env

    NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

## 🔥 Deployment

This project is configured for easy deployment with **Firebase App Hosting**.

1.  **Install Firebase CLI:**
    ```bash
    npm install -g firebase-tools
    ```

2.  **Login to Firebase:**
    ```bash
    firebase login
    ```

3.  **Initialize App Hosting:**
    ```bash
    firebase init apphosting
    ```
    Follow the prompts to select your Firebase project and configure the backend.

4.  **Deploy:**
    ```bash
    firebase apphosting:backends:deploy YOUR_BACKEND_ID --location=us-central1
    ```
    Once deployed, Firebase will provide you with a live URL for your application.

## 🔐 Firebase Security Rules

For all features to work correctly, especially public note sharing, ensure your Firestore security rules are configured properly.

Navigate to **Firestore Database > Rules** in your Firebase console and use the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own profile document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Users can manage their own notes subcollection
    match /users/{userId}/notes/{noteId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow public read if a corresponding share document exists
      allow get: if get(/databases/$(database)/documents/sharedNotes/$(noteId)).data.userId == userId;
    }

    // Public read for the share link lookup
    match /sharedNotes/{noteId} {
      allow read: if true;

      // Only the note owner can create or delete the share link
      allow create: if request.auth.uid == request.resource.data.userId;
      allow delete: if request.auth.uid == resource.data.userId;
      allow update: if false;
    }
  }
}
```

---
This project was built in Firebase Studio.
