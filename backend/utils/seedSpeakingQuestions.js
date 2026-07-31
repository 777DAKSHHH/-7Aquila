import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabaseAdmin } from "../config/supabaseAdmin.js";

const speakingTopics = [
  {
    topic: "Public Park / Shopping Centre",
    category: "Travel, Media & Leisure",
    difficulty: "medium",
    phase1: [
      "Do you often visit public parks or shopping centres?",
      "Which do you visit more frequently?",
      "What do you usually do there?",
      "Do you prefer going alone or with others?",
      "Are there enough parks in your hometown?",
      "Have shopping centres changed in recent years?",
      "Which place is more relaxing for you?"
    ],
    phase2: "Describe a public park or shopping centre that you enjoy visiting. You should say: Where it is, How often you visit it, What you usually do there, and explain why you enjoy visiting this place.",
    phase3: [
      "Why are public spaces important for communities?",
      "How have shopping centres changed people's lifestyles?",
      "Should cities invest more in parks than malls?",
      "What makes a public place attractive to visitors?"
    ]
  },
  {
    topic: "Positive Experience from Your Childhood",
    category: "Personal Life",
    difficulty: "medium",
    phase1: [
      "Do you often think about your childhood?",
      "Did you have a happy childhood?",
      "What activities did you enjoy most?",
      "Did you spend more time indoors or outdoors?",
      "Who did you spend most of your childhood with?",
      "Do children today have similar experiences?",
      "What is your happiest childhood memory?"
    ],
    phase2: "Describe a positive experience from your childhood. You should say: What happened, Where it happened, Who was with you, and explain why you still remember it.",
    phase3: [
      "Why are childhood memories important?",
      "Do children today have less free time than before?",
      "How do childhood experiences shape personality?",
      "Should parents create more memorable experiences for children?"
    ]
  },
  {
    topic: "Skills You Have Learned",
    category: "Education",
    difficulty: "medium",
    phase1: [
      "Do you enjoy learning new skills?",
      "What skill have you learned recently?",
      "Do you prefer learning independently or with a teacher?",
      "Is learning practical skills important?",
      "Which skill would you like to learn next?",
      "Can technology help people learn skills?",
      "Do schools teach enough practical skills?"
    ],
    phase2: "Describe a useful skill you have learned. You should say: What the skill is, How you learned it, How long it took to learn, and explain how it has benefited you.",
    phase3: [
      "Which skills will be most valuable in the future?",
      "Should schools teach more life skills?",
      "Why do adults continue learning new skills?",
      "How has online learning changed skill development?"
    ]
  },
  {
    topic: "The Person You Admire",
    category: "Personal Life",
    difficulty: "medium",
    phase1: [
      "Do you admire anyone?",
      "Is the person someone you know personally?",
      "What qualities do you admire in people?",
      "Do role models influence young people?",
      "Have your role models changed over time?",
      "Can famous people be good role models?",
      "Do children need role models?"
    ],
    phase2: "Describe a person you admire. You should say: Who the person is, How you know them, What qualities they have, and explain why you admire this person.",
    phase3: [
      "Why do people admire successful individuals?",
      "Should celebrities be role models?",
      "How can parents influence children's values?",
      "Do people admire different qualities today compared to the past?"
    ]
  },
  {
    topic: "Concert",
    category: "Travel, Media & Leisure",
    difficulty: "medium",
    phase1: [
      "Do you enjoy listening to live music?",
      "Have you ever attended a concert?",
      "What kind of music do you enjoy?",
      "Do you prefer live performances or recorded music?",
      "Are concerts popular in your country?",
      "Would you like to attend more concerts?",
      "Do concerts bring people together?"
    ],
    phase2: "Describe a concert you attended or would like to attend. You should say: Where it was, Who performed, Who you went with, and explain why it was or would be memorable.",
    phase3: [
      "Why are live performances still popular?",
      "How has technology changed the music industry?",
      "Should concert tickets be affordable?",
      "Can music promote cultural understanding?"
    ]
  },
  {
    topic: "Good Law in Your Country",
    category: "Society & Culture",
    difficulty: "hard",
    phase1: [
      "Do you know many laws in your country?",
      "Should everyone understand basic laws?",
      "Do laws make society safer?",
      "Are traffic rules followed in your area?",
      "Should penalties be stricter?",
      "Have any laws changed recently?",
      "Do young people respect the law?"
    ],
    phase2: "Describe a law in your country that you think is beneficial. You should say: What the law is, Why it was introduced, Who benefits from it, and explain why you think it is a good law.",
    phase3: [
      "Why do societies need laws?",
      "Should laws change over time?",
      "How can governments ensure people follow laws?",
      "What happens if laws are too strict?"
    ]
  },
  {
    topic: "Historical Place",
    category: "Travel, Media & Leisure",
    difficulty: "hard",
    phase1: [
      "Do you enjoy visiting historical places?",
      "Have you visited any famous monuments?",
      "Are there historical sites near your hometown?",
      "Should children visit museums?",
      "Do you enjoy learning history?",
      "How are historical places protected?",
      "Would you visit another historical site?"
    ],
    phase2: "Describe a historical place you have visited or would like to visit. You should say: Where it is, What it looks like, What you learned about it, and explain why it is important.",
    phase3: [
      "Why should historical places be preserved?",
      "How does tourism affect heritage sites?",
      "Should governments spend more on preservation?",
      "Can technology improve historical education?"
    ]
  },
  {
    topic: "Website",
    category: "Technology",
    difficulty: "medium",
    phase1: [
      "Which websites do you visit most often?",
      "How often do you browse the internet?",
      "Do you use websites for learning?",
      "Are websites more useful than mobile apps?",
      "Do you trust information on websites?",
      "Have your browsing habits changed?",
      "What makes a website easy to use?"
    ],
    phase2: "Describe a website that you find useful. You should say: What the website is, How you discovered it, What you use it for, and explain why you like it.",
    phase3: [
      "How have websites changed education?",
      "Should websites verify their information?",
      "Are websites replacing traditional services?",
      "What makes a website successful?"
    ]
  },
  {
    topic: "Memorable Gifts",
    category: "Personal Life",
    difficulty: "medium",
    phase1: [
      "Do you enjoy giving gifts?",
      "Do you like receiving gifts?",
      "What kinds of gifts do you prefer?",
      "Do you celebrate birthdays with gifts?",
      "Are handmade gifts special?",
      "Is the price of a gift important?",
      "Do gifts strengthen relationships?"
    ],
    phase2: "Describe a memorable gift you received. You should say: What it was, Who gave it to you, On what occasion, and explain why it was memorable.",
    phase3: [
      "Why do people exchange gifts?",
      "Should gifts always be practical?",
      "How have gift-giving traditions changed?",
      "Are expensive gifts more meaningful?"
    ]
  },
  {
    topic: "Unusual Food",
    category: "Travel, Media & Leisure",
    difficulty: "medium",
    phase1: [
      "Do you enjoy trying new foods?",
      "Have you ever eaten unusual food?",
      "Do you like spicy food?",
      "Is traditional food popular in your country?",
      "Would you try food from another culture?",
      "Do people become more adventurous with food?",
      "Is eating out common where you live?"
    ],
    phase2: "Describe an unusual food you have tried or would like to try. You should say: What it is, Where you found it, What it tasted like or what you expect, and explain your opinion about it.",
    phase3: [
      "Why do people enjoy trying unusual food?",
      "How has globalization influenced eating habits?",
      "Should traditional recipes be preserved?",
      "How does food reflect culture?"
    ]
  },
  {
    topic: "Mail You Have Received",
    category: "Technology",
    difficulty: "medium",
    phase1: [
      "Do you often receive emails?",
      "Do you still receive handwritten letters?",
      "Which do you prefer, email or traditional mail?",
      "How often do you check your inbox?",
      "Have you ever received unexpected mail?",
      "Is postal mail still important?",
      "Do you keep old messages?"
    ],
    phase2: "Describe an important mail or email you received. You should say: When you received it, Who sent it, What it was about, and explain why it was important.",
    phase3: [
      "Will traditional mail disappear?",
      "What are the advantages of email?",
      "How has digital communication changed society?",
      "Should important documents still be sent by post?"
    ]
  },
  {
    topic: "Dream House",
    category: "Personal Life",
    difficulty: "medium",
    phase1: [
      "What kind of house do you live in?",
      "Would you like to own a house one day?",
      "Do you prefer a house or an apartment?",
      "What is the most important room in a home?",
      "Do you enjoy decorating your home?",
      "Would you like to live in the countryside?",
      "What features would your ideal home have?"
    ],
    phase2: "Describe your dream house. You should say: Where it would be, What it would look like, Who would live there, and explain why it would be your ideal home.",
    phase3: [
      "Why do housing preferences differ?",
      "How has modern architecture changed homes?",
      "Should governments provide affordable housing?",
      "What makes a house feel like a home?"
    ]
  },
  {
    topic: "Project You Did at School/College",
    category: "Education",
    difficulty: "medium",
    phase1: [
      "Do you enjoy working on projects?",
      "Have you done group projects?",
      "Which subject required the most projects?",
      "Do projects help students learn?",
      "Do you prefer individual or group work?",
      "Were your projects practical?",
      "Should projects carry more marks than exams?"
    ],
    phase2: "Describe a project you completed at school or college. You should say: What the project was, Who worked with you, What challenges you faced, and explain what you learned from it.",
    phase3: [
      "Why are projects important in education?",
      "Should practical work replace some examinations?",
      "How do projects improve teamwork?",
      "Can technology improve project-based learning?"
    ]
  },
  {
    topic: "Favourite Magazine",
    category: "Travel, Media & Leisure",
    difficulty: "easy",
    phase1: [
      "Do you enjoy reading magazines?",
      "What type of magazines interest you?",
      "Do you prefer printed or digital magazines?",
      "How often do you read magazines?",
      "Are magazines still popular today?",
      "Did you read magazines as a child?",
      "Can magazines be educational?"
    ],
    phase2: "Describe your favourite magazine. You should say: What it is called, What it is mainly about, How often you read it, and explain why you enjoy reading it.",
    phase3: [
      "Are magazines losing popularity because of the internet?",
      "What makes a magazine successful?",
      "Should magazines focus more on education or entertainment?",
      "How have readers' preferences changed over time?"
    ]
  }
];

const seed = async () => {
  console.log("🚀 Starting database seeding for 16 Speaking Topics...");

  try {
    // 1. Get Categories
    const { data: categories, error: catError } = await supabaseAdmin
      .from("categories")
      .select("id, name");

    if (catError) throw new Error(`Failed to fetch categories: ${catError.message}`);

    const categoryMap = {};
    categories.forEach(c => {
      categoryMap[c.name] = c.id;
    });

    console.log("✅ Fetched categories successfully.");

    // Loop through each topic
    for (const t of speakingTopics) {
      const categoryId = categoryMap[t.category];
      if (!categoryId) {
        console.error(`❌ Category not found: ${t.category} for topic: ${t.topic}`);
        continue;
      }

      console.log(`\nProcessing Topic: "${t.topic}" under category "${t.category}"...`);

      // Check if test set already exists
      let { data: existingSet, error: findError } = await supabaseAdmin
        .from("test_sets")
        .select("id")
        .eq("name", t.topic)
        .eq("category_id", categoryId)
        .maybeSingle();

      if (findError) throw findError;

      let testSetId;

      if (existingSet) {
        testSetId = existingSet.id;
        console.log(`ℹ️ Test Set already exists with ID: ${testSetId}. Skipping test set creation.`);
      } else {
        // Query next set_number for this category
        const { data: maxSetData, error: maxSetError } = await supabaseAdmin
          .from("test_sets")
          .select("set_number")
          .eq("category_id", categoryId)
          .order("set_number", { ascending: false })
          .limit(1);

        if (maxSetError) throw maxSetError;

        const nextSetNum = maxSetData && maxSetData.length > 0 ? (maxSetData[0].set_number + 1) : 1;

        // Insert new test set
        const { data: newSet, error: insertSetError } = await supabaseAdmin
          .from("test_sets")
          .insert([
            {
              name: t.topic,
              description: null,
              set_number: nextSetNum,
              difficulty: t.difficulty,
              category_id: categoryId,
              is_active: true
            }
          ])
          .select()
          .single();

        if (insertSetError) throw insertSetError;

        testSetId = newSet.id;
        console.log(`🟢 Created new Test Set: "${t.topic}" (Set Number: ${nextSetNum}) with ID: ${testSetId}`);
      }

      // Now prepare questions for insertion
      const questionsToInsert = [];

      // Part 1 Questions
      t.phase1.forEach((qText, idx) => {
        questionsToInsert.push({
          part: 1,
          question_text: qText,
          difficulty: "easy",
          topic: t.topic,
          test_set_id: testSetId,
          order_number: idx + 1,
          is_active: true
        });
      });

      // Part 2 Question
      questionsToInsert.push({
        part: 2,
        question_text: t.phase2,
        difficulty: "medium",
        topic: t.topic,
        test_set_id: testSetId,
        order_number: 1,
        is_active: true
      });

      // Part 3 Questions
      t.phase3.forEach((qText, idx) => {
        questionsToInsert.push({
          part: 3,
          question_text: qText,
          difficulty: "hard",
          topic: t.topic,
          test_set_id: testSetId,
          order_number: idx + 1,
          is_active: true
        });
      });

      // Check if questions already exist for this test set to prevent duplicates
      const { data: existingQuestions, error: checkQError } = await supabaseAdmin
        .from("speaking_questions")
        .select("question_text")
        .eq("test_set_id", testSetId);

      if (checkQError) throw checkQError;

      const existingTexts = new Set(existingQuestions.map(q => q.question_text));

      const finalQuestionsToInsert = questionsToInsert.filter(q => !existingTexts.has(q.question_text));

      if (finalQuestionsToInsert.length === 0) {
        console.log(`ℹ️ All questions for "${t.topic}" already exist in the database. Skipping question inserts.`);
      } else {
        const { data: insertedQs, error: insertQsError } = await supabaseAdmin
          .from("speaking_questions")
          .insert(finalQuestionsToInsert)
          .select("id");

        if (insertQsError) throw insertQsError;

        console.log(`🟢 Successfully inserted ${insertedQs.length} new questions for topic: "${t.topic}"`);
      }
    }

    console.log("\n🎉 Database seeding completed successfully!");
  } catch (err) {
    console.error("\n❌ Database seeding failed:", err.message);
    process.exit(1);
  }
};

seed();
