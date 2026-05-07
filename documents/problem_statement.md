**1. Problem Statement**

Students today are faced with an overwhelming amount of learning material, such as lecture slides, PDFs,
and notes. Traditional study methods like re-reading and highlighting are largely passive and have been
shown to be inefficient for long-term knowledge retention. While techniques such as active recall and
spaced repetition are proven to significantly improve learning outcomes, they are often underutilized due
to the manual effort required to create and manage study materials like flashcards.

Additionally, students frequently encounter difficulties in understanding complex concepts and must
rely on external resources, which disrupts their study flow. Existing tools often fail to provide an inte-
grated solution that combines efficient memorization techniques with personalized explanations.

This project aims to address these challenges by developing an AI-powered study assistant that
automates the creation of flashcards from lecture materials, optimizes review scheduling using spaced
repetition algorithms, and provides on-demand explanations to support deeper understanding.

**2. Main Functionality**

The application provides the following core functionalities:
- Automatic generation of flashcards from uploaded lecture materials (e.g., PDFs, text).
- Implementation of spaced repetition (SuperMemo-2 algorithm) to optimize review intervals.
- Interactive study sessions based on active recall principles.
- AI-powered explanations that simplify complex concepts on demand.

**3. Target Users**

The primary target users of the application are:
- University students preparing for exams.
- Students in knowledge-intensive fields such as STEM, medicine, and law.
Secondary users may include lifelong learners and participants in online courses who seek efficient
study methods.

**4 GenAI Integration**

Generative AI is integrated into the system in two key ways:
1. Flashcard Generation: The system processes raw lecture materials and converts them into
structured flashcards in a question-answer format. This significantly reduces the manual effort
required for content preparation.
2. Concept Explanation: During study sessions, users can request simplified explanations of flash-
cards. The AI generates clear, concise explanations, potentially including examples or analogies,
enabling better understanding without leaving the application.

**5 Usage Scenarios**

**5.1 Exam Preparation**

A student uploads lecture material into the system. The application automatically generates flashcards
and schedules them for review using a spaced repetition algorithm. The student engages in study sessions
where they actively recall answers and rate difficulty, allowing the system to adapt future review intervals.

**5.2 Understanding Difficult Concepts**

While studying, a student encounters a flashcard they do not fully understand. The student requests
an explanation, and the AI provides a simplified and more intuitive version of the concept, improving
comprehension.

**5.3 Active Study Sessions**

The system presents flashcards that are due for review. The student attempts to recall the answer, reveals
it, and rates their performance. The system updates the review schedule accordingly, ensuring efficient
long-term retention.

**5.4 Flexible AI Deployment**

The system supports both cloud-based and local AI models. Users can choose between high-performance
cloud models or privacy-preserving local models, depending on their needs.
