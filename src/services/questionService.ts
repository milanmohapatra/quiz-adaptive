import { collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Question } from '../types/quiz';

const sampleQuestions: Omit<Question, 'id'>[] = [
  // History Questions - Easy
  {
    category: 'history',
    difficulty: 'easy',
    question: 'Who was the first President of India?',
    options: ['Dr. Rajendra Prasad', 'Jawaharlal Nehru', 'Sardar Patel', 'B.R. Ambedkar'],
    correctAnswer: 'Dr. Rajendra Prasad',
    explanation: 'Dr. Rajendra Prasad served as the first President of India from 1950 to 1962.'
  },
  {
    category: 'history',
    difficulty: 'easy',
    question: 'In which year did India gain independence?',
    options: ['1947', '1945', '1950', '1942'],
    correctAnswer: '1947',
    explanation: 'India gained independence from British rule on August 15, 1947.'
  },
  {
    category: 'history',
    difficulty: 'easy',
    question: 'Who is known as the "Father of the Nation" in India?',
    options: ['Mahatma Gandhi', 'Jawaharlal Nehru', 'Subhas Chandra Bose', 'Bhagat Singh'],
    correctAnswer: 'Mahatma Gandhi',
    explanation: 'Mahatma Gandhi is known as the Father of the Nation for his role in India\'s independence movement.'
  },
  {
    category: 'history',
    difficulty: 'easy',
    question: 'Which movement was started by Mahatma Gandhi in 1942?',
    options: ['Quit India Movement', 'Non-Cooperation Movement', 'Civil Disobedience Movement', 'Khilafat Movement'],
    correctAnswer: 'Quit India Movement',
    explanation: 'The Quit India Movement was launched by Mahatma Gandhi in August 1942 demanding an end to British rule.'
  },
  
  // History Questions - Intermediate
  {
    category: 'history',
    difficulty: 'intermediate',
    question: 'Which empire was ruled by Ashoka the Great?',
    options: ['Mauryan Empire', 'Gupta Empire', 'Mughal Empire', 'Chola Empire'],
    correctAnswer: 'Mauryan Empire',
    explanation: 'Ashoka the Great ruled the Mauryan Empire from 268 BCE to 232 BCE.'
  },
  {
    category: 'history',
    difficulty: 'intermediate',
    question: 'Who established the Slave Dynasty in Delhi?',
    options: ['Qutub-ud-din Aibak', 'Iltutmish', 'Razia Sultan', 'Balban'],
    correctAnswer: 'Qutub-ud-din Aibak',
    explanation: 'Qutub-ud-din Aibak established the Slave Dynasty (Mamluk Dynasty) in 1206 CE.'
  },
  {
    category: 'history',
    difficulty: 'intermediate',
    question: 'Which battle in 1757 marked the beginning of British rule in India?',
    options: ['Battle of Plassey', 'Battle of Buxar', 'Battle of Panipat', 'Battle of Haldighati'],
    correctAnswer: 'Battle of Plassey',
    explanation: 'The Battle of Plassey in 1757 between the British East India Company and Nawab of Bengal marked the beginning of British rule.'
  },
  
  // History Questions - Expert
  {
    category: 'history',
    difficulty: 'expert',
    question: 'Which Indian revolutionary established the India House in London?',
    options: ['Shyamji Krishna Varma', 'Lala Hardayal', 'V.D. Savarkar', 'Madame Bhikaji Cama'],
    correctAnswer: 'Shyamji Krishna Varma',
    explanation: 'Shyamji Krishna Varma established the India House in London in 1905 as a hub for Indian revolutionaries.'
  },
  {
    category: 'history',
    difficulty: 'expert',
    question: 'Who was the founder of the Satavahana dynasty?',
    options: ['Simuka', 'Gautamiputra Satakarni', 'Vashishtiputra Sri Pulamavi', 'Yajna Sri Satakarni'],
    correctAnswer: 'Simuka',
    explanation: 'Simuka founded the Satavahana dynasty in 230 BCE and ruled for 23 years.'
  },

  // Sports Questions - Easy
  {
    category: 'sports',
    difficulty: 'easy',
    question: 'Who holds the record for most international cricket centuries?',
    options: ['Sachin Tendulkar', 'Virat Kohli', 'Ricky Ponting', 'Kumar Sangakkara'],
    correctAnswer: 'Sachin Tendulkar',
    explanation: 'Sachin Tendulkar holds the record with 100 international centuries.'
  },
  {
    category: 'sports',
    difficulty: 'easy',
    question: 'Which sport is Saina Nehwal associated with?',
    options: ['Badminton', 'Tennis', 'Table Tennis', 'Squash'],
    correctAnswer: 'Badminton',
    explanation: 'Saina Nehwal is a professional badminton player who has won numerous international titles.'
  },
  {
    category: 'sports',
    difficulty: 'easy',
    question: 'In which sport did Mary Kom win an Olympic medal?',
    options: ['Boxing', 'Wrestling', 'Weightlifting', 'Shooting'],
    correctAnswer: 'Boxing',
    explanation: 'Mary Kom won a bronze medal in boxing at the 2012 London Olympics.'
  },

  // Sports Questions - Intermediate
  {
    category: 'sports',
    difficulty: 'intermediate',
    question: 'Which year did India win its first Cricket World Cup?',
    options: ['1983', '1975', '1979', '1987'],
    correctAnswer: '1983',
    explanation: 'India won its first Cricket World Cup in 1983 under Kapil Dev\'s captaincy.'
  },
  {
    category: 'sports',
    difficulty: 'intermediate',
    question: 'Who was the first Indian woman to win an Olympic medal?',
    options: ['Karnam Malleswari', 'P.T. Usha', 'Mary Kom', 'Saina Nehwal'],
    correctAnswer: 'Karnam Malleswari',
    explanation: 'Karnam Malleswari won a bronze medal in weightlifting at the 2000 Sydney Olympics.'
  },
  {
    category: 'sports',
    difficulty: 'intermediate',
    question: 'Which Indian cricketer has taken 10 wickets in a Test innings?',
    options: ['Anil Kumble', 'Kapil Dev', 'Harbhajan Singh', 'R Ashwin'],
    correctAnswer: 'Anil Kumble',
    explanation: 'Anil Kumble took 10 wickets for 74 runs against Pakistan in 1999, becoming only the second bowler to take all 10 wickets in a Test innings.'
  },

  // Sports Questions - Expert
  {
    category: 'sports',
    difficulty: 'expert',
    question: 'Who was the first Indian to win an individual Olympic medal?',
    options: ['KD Jadhav', 'Milkha Singh', 'PT Usha', 'Karnam Malleswari'],
    correctAnswer: 'KD Jadhav',
    explanation: 'KD Jadhav won bronze in wrestling at the 1952 Helsinki Olympics.'
  },
  {
    category: 'sports',
    difficulty: 'expert',
    question: 'Which Indian chess player became the youngest Grandmaster at the time in 1988?',
    options: ['Viswanathan Anand', 'Pentala Harikrishna', 'Koneru Humpy', 'Krishnan Sasikiran'],
    correctAnswer: 'Viswanathan Anand',
    explanation: 'Viswanathan Anand became India\'s first Grandmaster in 1988 at the age of 18.'
  },

  // Mythology Questions - Easy
  {
    category: 'mythology',
    difficulty: 'easy',
    question: 'Who was the guru of Lord Rama in the Ramayana?',
    options: ['Vasishtha', 'Vishwamitra', 'Valmiki', 'Agastya'],
    correctAnswer: 'Vasishtha',
    explanation: 'Sage Vasishtha was the guru of Lord Rama and the royal priest of the Ikshvaku dynasty.'
  },
  {
    category: 'mythology',
    difficulty: 'easy',
    question: 'Who wrote the Ramayana?',
    options: ['Valmiki', 'Ved Vyasa', 'Tulsidas', 'Kamban'],
    correctAnswer: 'Valmiki',
    explanation: 'The original Ramayana was written by Sage Valmiki in Sanskrit.'
  },
  {
    category: 'mythology',
    difficulty: 'easy',
    question: 'Who is known as the remover of obstacles in Hindu mythology?',
    options: ['Ganesha', 'Hanuman', 'Krishna', 'Shiva'],
    correctAnswer: 'Ganesha',
    explanation: 'Lord Ganesha is known as Vighnaharta (remover of obstacles) in Hindu mythology.'
  },

  // Mythology Questions - Intermediate
  {
    category: 'mythology',
    difficulty: 'intermediate',
    question: 'Which demon king was blessed by Lord Brahma with immortality during day and night?',
    options: ['Hiranyakashipu', 'Ravana', 'Mahishasura', 'Bhasmasura'],
    correctAnswer: 'Hiranyakashipu',
    explanation: 'Hiranyakashipu was blessed with conditions that made him nearly immortal, but was ultimately killed by Lord Vishnu in his Narasimha avatar.'
  },
  {
    category: 'mythology',
    difficulty: 'intermediate',
    question: 'In the Mahabharata, who was Abhimanyu\'s wife?',
    options: ['Uttara', 'Dushala', 'Bhanumati', 'Chitrangada'],
    correctAnswer: 'Uttara',
    explanation: 'Uttara was the daughter of King Virata and was married to Abhimanyu, son of Arjuna.'
  },

  // Mythology Questions - Expert
  {
    category: 'mythology',
    difficulty: 'expert',
    question: 'Who was the first Indian to win an individual Olympic medal?',
    options: ['KD Jadhav', 'Milkha Singh', 'PT Usha', 'Karnam Malleswari'],
    correctAnswer: 'KD Jadhav',
    explanation: 'KD Jadhav won bronze in wrestling at the 1952 Helsinki Olympics.'
  },

  // Politics Questions - Easy
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'Which article of the Indian Constitution deals with the President\'s rule in states?',
    options: ['Article 356', 'Article 370', 'Article 352', 'Article 360'],
    correctAnswer: 'Article 356',
    explanation: 'Article 356 deals with provisions in case of failure of constitutional machinery in states.'
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'Who was India\'s first Deputy Prime Minister?',
    options: ['Sardar Vallabhbhai Patel', 'Morarji Desai', 'Dr. B.R. Ambedkar', 'C. Rajagopalachari'],
    correctAnswer: 'Sardar Vallabhbhai Patel',
    explanation: 'Sardar Vallabhbhai Patel served as the first Deputy Prime Minister of India from 1947 to 1950.'
  },

  // Politics Questions - Intermediate
  {
    category: 'politics',
    difficulty: 'intermediate',
    question: 'Who was the first Deputy Prime Minister?',
    options: ['Sardar Vallabhbhai Patel', 'Morarji Desai', 'Dr. B.R. Ambedkar', 'C. Rajagopalachari'],
    correctAnswer: 'Sardar Vallabhbhai Patel',
    explanation: 'Sardar Vallabhbhai Patel served as the first Deputy Prime Minister of India from 1947 to 1950.'
  },

  // Politics Questions - Expert
  {
    category: 'politics',
    difficulty: 'expert',
    question: 'Which committee recommended the three-tier system of Panchayati Raj?',
    options: ['Balwant Rai Mehta Committee', 'Ashok Mehta Committee', 'G.V.K. Rao Committee', 'L.M. Singhvi Committee'],
    correctAnswer: 'Balwant Rai Mehta Committee',
    explanation: 'The Balwant Rai Mehta Committee (1957) recommended the three-tier system of Panchayati Raj.'
  },

  // Bollywood Questions - Easy
  {
    category: 'bollywood',
    difficulty: 'easy',
    question: 'Which film won the first Filmfare Award for Best Film?',
    options: ['Do Bigha Zamin', 'Awaara', 'Mother India', 'Boot Polish'],
    correctAnswer: 'Do Bigha Zamin',
    explanation: 'Do Bigha Zamin (1953) won the first Filmfare Award for Best Film in 1954.'
  },
  {
    category: 'bollywood',
    difficulty: 'easy',
    question: 'Who was the first Indian to win an Oscar?',
    options: ['Satyajit Ray', 'Bhanu Athaiya', 'A.R. Rahman', 'Gulzar'],
    correctAnswer: 'Bhanu Athaiya',
    explanation: 'Bhanu Athaiya won the first Oscar for Best Costume Design for Gandhi (1982).'
  },

  // Bollywood Questions - Intermediate
  {
    category: 'bollywood',
    difficulty: 'intermediate',
    question: 'Who was the first Indian to win an Oscar?',
    options: ['Satyajit Ray', 'Bhanu Athaiya', 'A.R. Rahman', 'Gulzar'],
    correctAnswer: 'Bhanu Athaiya',
    explanation: 'Bhanu Athaiya won the first Oscar for Best Costume Design for Gandhi (1982).'
  },

  // Bollywood Questions - Expert
  {
    category: 'bollywood',
    difficulty: 'expert',
    question: 'Which was the first Indian talkie film?',
    options: ['Alam Ara', 'Raja Harishchandra', 'Pundalik', 'Kalidas'],
    correctAnswer: 'Alam Ara',
    explanation: 'Alam Ara (1931) was India\'s first talkie film, directed by Ardeshir Irani.'
  },

  // Science Questions - Easy
  {
    category: 'science',
    difficulty: 'easy',
    question: 'What is the chemical symbol for gold?',
    options: ['Au', 'Ag', 'Fe', 'Cu'],
    correctAnswer: 'Au',
    explanation: 'Au comes from the Latin word for gold, "aurum".'
  },
  {
    category: 'science',
    difficulty: 'easy',
    question: 'Which is the nearest planet to the Sun?',
    options: ['Mercury', 'Venus', 'Earth', 'Mars'],
    correctAnswer: 'Mercury',
    explanation: 'Mercury is the first planet from the Sun and the smallest planet in our solar system.'
  },
  {
    category: 'science',
    difficulty: 'easy',
    question: 'What is the hardest natural substance on Earth?',
    options: ['Diamond', 'Gold', 'Iron', 'Platinum'],
    correctAnswer: 'Diamond',
    explanation: 'Diamond is the hardest known natural material on the Mohs scale of mineral hardness.'
  },

  // Science Questions - Intermediate
  {
    category: 'science',
    difficulty: 'intermediate',
    question: 'Who discovered the Raman Effect?',
    options: ['C.V. Raman', 'Homi Bhabha', 'S.N. Bose', 'Meghnad Saha'],
    correctAnswer: 'C.V. Raman',
    explanation: 'C.V. Raman discovered the Raman Effect in 1928 and won the Nobel Prize in Physics in 1930.'
  },

  // Science Questions - Expert
  {
    category: 'science',
    difficulty: 'expert',
    question: 'What is the Chandrasekhar limit in astronomy?',
    options: [
      '1.4 times the mass of the Sun',
      '2.4 times the mass of the Sun',
      '3.4 times the mass of the Sun',
      '4.4 times the mass of the Sun'
    ],
    correctAnswer: '1.4 times the mass of the Sun',
    explanation: 'The Chandrasekhar limit is approximately 1.4 solar masses, above which a white dwarf star will collapse into a neutron star.'
  }
];

interface QuestionCount {
  easy: number;
  intermediate: number;
  expert: number;
}

interface CategoryCounts {
  [key: string]: QuestionCount;
}

export const initializeQuestions = async () => {
  try {
    const questionsRef = collection(db, 'questions');
    
    // Check if questions already exist
    const existingQuestions = await getDocs(questionsRef);
    if (existingQuestions.size > 0) {
      console.log('Questions already initialized');
      return;
    }

    console.log('Initializing questions...');
    
    // Add new questions
    console.log('Adding sample questions to database...');
    const addPromises = sampleQuestions.map(question => {
      console.log(`Adding question for ${question.category} - ${question.difficulty}`);
      return addDoc(questionsRef, question);
    });
    await Promise.all(addPromises);
    
    // Verify questions were added
    const verifyQuestions = await getDocs(questionsRef);
    console.log(`Successfully added ${verifyQuestions.size} questions to database`);
    
    // Log questions by category and difficulty
    const questionsByCategory: { [key: string]: { [key: string]: number } } = {};
    verifyQuestions.forEach(doc => {
      const q = doc.data() as Question;
      if (!questionsByCategory[q.category]) {
        questionsByCategory[q.category] = {
          easy: 0,
          intermediate: 0,
          expert: 0
        };
      }
      questionsByCategory[q.category][q.difficulty]++;
    });
    console.log('Questions by category:', questionsByCategory);
    
  } catch (error) {
    console.error('Error initializing questions:', error);
    throw error;
  }
}; 