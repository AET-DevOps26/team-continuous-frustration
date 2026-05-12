| Epic | User Story |
|---|---|
| 1. authentication | 1.1 Create OpenAPI spec and generate Spring Server Stub |
| 1. authentication | 1.2 User registration (sign up with email & password) |
| 1. authentication | 1.3 User login and session management (JWT) |
| 1. authentication | 1.4 User logout and token invalidation |
| 1. authentication | 1.5 Protect all API endpoints with authentication |
| 1. authentication | 1.6 Design and Implement Signup, Login/Logout in Client |
| 1. authentication | 1.7 Configure Auth Service as API Gateway |
| 2. upload material | 2.1 Create OpenAPI spec and generate FastAPI Server Stub for uploading lecture materials |
| 2. upload material | 2.2 Extract text from uploaded files |
| 2. upload material | 2.3 Chunking, Create Embedding and upsert in Weaviate vector database |
| 2. upload material | 2.4 Design and implement File upload in client |
| 3. generate flashcard (AI) | 3.1 Extend file upload service contract to return generated flashcards |
| 3. generate flashcard (AI) | 3.2 Implement flashcard generation logic |
| 3. generate flashcard (AI) | 3.3 Stream generated flashcards as NDJSON to client |
| 3. generate flashcard (AI) | 3.4 Display generated cards in client to user and offer editing, save and delete option |
| 4. manage decks | 4.1 Implement deck CRUD operations |
| 4. manage decks | 4.2 Link flashcards to decks |
| 4. manage decks | 4.3 Retrieve flashcards by deck |
| 5. study flashcard | 5.1 Implement study session lifecycle |
| 5. study flashcard | 5.2 Retrieve flashcards for study |
| 5. study flashcard | 5.3 Record user answers |
| 5. study flashcard | 5.4 Implement review logging |
| 5. study flashcard | 5.5 Calculate next review date (SuperMemo-2) |
| 5. study flashcard | 5.6 Retrieve due flashcards |
| 6. request AI explanation | 6.1 Implement API to request explanation |
| 6. request AI explanation | 6.2 Connect to GenAI service |
| 6. request AI explanation | 6.3 Store and return explanation |
