-- =========================================================================
-- SEED DATA: READING PASSAGE 1 ("The Return of Urban Wetlands")
-- Run this script inside the Supabase SQL Editor.
-- =========================================================================

DO $$
DECLARE
    test_id UUID;
    passage_id UUID;
BEGIN
    -- 1. Insert Reading Test (Practice Module - 20 minutes)
    INSERT INTO public.reading_tests (title, test_type, difficulty, duration_minutes, is_active)
    VALUES (
        'Practice Passage 1: The Return of Urban Wetlands', 
        'academic', 
        'easy', 
        20, 
        true
    )
    RETURNING id INTO test_id;

    -- 2. Insert Reading Passage
    INSERT INTO public.reading_passages (reading_test_id, passage_number, title, sub_title, content_html)
    VALUES (
        test_id,
        1,
        'The Return of Urban Wetlands',
        'How restored water ecosystems are cleaning water, reducing flood risks, and reviving communities.',
        '<p>For many years, wetlands were viewed as empty areas that served little purpose. As cities expanded, these marshes, ponds, and shallow lakes were often drained to create space for roads, housing, and factories. However, scientists now recognise that wetlands are among the most valuable ecosystems on Earth. Around the world, governments and environmental organisations are investing in projects to restore urban wetlands because of the many benefits they provide to both nature and people.</p>' ||
        '<p>A wetland is an area of land where water covers the soil for part or all of the year. Some wetlands remain flooded throughout every season, while others become wet only after heavy rainfall or during particular months. Although wetlands differ in size and appearance, they all support plants and animals that have adapted to living in these watery environments. Reeds, grasses, frogs, fish, insects, and water birds are commonly found there.</p>' ||
        '<p>One of the most important roles of wetlands is improving water quality. Rainwater often washes dirt, chemicals, and small pieces of waste from streets into nearby rivers. Before reaching larger waterways, this water may pass through wetlands. The plants growing there slow the movement of water, allowing mud and other particles to settle naturally. At the same time, microorganisms living in the wet soil break down many harmful substances. As a result, cleaner water eventually flows into rivers, lakes, or the sea.</p>' ||
        '<p>Wetlands also play an important part in reducing floods. During periods of heavy rain, large amounts of water can quickly collect in cities because roads, pavements, and buildings prevent the ground from absorbing it. Wetlands act like giant natural sponges by temporarily storing excess water. Instead of flooding nearby neighbourhoods immediately, the water is released gradually over time. This natural process reduces pressure on drainage systems and lowers the risk of severe flooding.</p>' ||
        '<p>Another significant benefit is the support wetlands provide for wildlife. Even small wetlands located within busy cities can become homes for many different species. Birds may stop there during long migrations, insects find breeding areas among the plants, and fish use shallow water as a safe place to grow. In some cities, rare animals have returned after wetlands were restored, surprising both scientists and local residents.</p>' ||
        '<p>Beyond their environmental value, wetlands improve people''s daily lives. Many restored wetlands include walking paths, viewing platforms, and educational centres where visitors can learn about local ecosystems. Schools often organise field trips to these areas because students can observe wildlife directly rather than simply reading about it in textbooks. Families also use these parks for exercise, photography, or quiet relaxation away from crowded streets.</p>' ||
        '<p>Urban wetlands may even help reduce the effects of climate change. Wetland plants absorb carbon dioxide from the atmosphere during photosynthesis. Part of this carbon becomes stored in the soil beneath the water, where it can remain for many years. Although forests usually receive greater attention for storing carbon, scientists have discovered that healthy wetlands can also make an important contribution.</p>' ||
        '<p>Restoring wetlands is not always simple. Some polluted sites require years of cleaning before plants and animals can safely return. Engineers sometimes need to redesign rivers or remove concrete channels that were built decades earlier. Local communities may also need convincing that restoring a wetland is more beneficial than using the land for construction projects. Despite these challenges, many restoration programmes have proved highly successful.</p>' ||
        '<p>For example, several cities in Europe and Asia have transformed abandoned industrial land into thriving wetland parks. Within only a few years, water quality improved, bird populations increased, and nearby residents reported enjoying the new green spaces. These projects demonstrate that environmental protection and urban development do not always have to compete. With careful planning, cities can become healthier places for both people and wildlife.</p>' ||
        '<p>Experts believe that the future of urban wetlands depends largely on public awareness. When local communities understand the importance of these ecosystems, they are more likely to support conservation projects and avoid activities that cause pollution. As climate change continues to create new environmental challenges, wetlands are expected to become an increasingly valuable part of sustainable cities around the world.</p>'
    )
    RETURNING id INTO passage_id;

    -- 3. Insert Questions (Q1-Q5: TRUE / FALSE / NOT GIVEN)
    INSERT INTO public.reading_questions (passage_id, question_number, question_type, instruction_text, question_data, correct_answers, explanation, citation_excerpt)
    VALUES
    (
        passage_id, 1, 'tfng', 
        'Write TRUE if the statement agrees with the passage, FALSE if the statement contradicts the passage, NOT GIVEN if there is no information.',
        '{"text": "Wetlands were once considered unsuitable for urban development."}', 
        ARRAY['FALSE'],
        'The passage states that wetlands were drained to create space for urban development (roads, housing, factories), meaning they were considered suitable for construction rather than being considered unsuitable.',
        'As cities expanded, these marshes, ponds, and shallow lakes were often drained to create space for roads, housing, and factories.'
    ),
    (
        passage_id, 2, 'tfng', 
        'Write TRUE if the statement agrees with the passage, FALSE if the statement contradicts the passage, NOT GIVEN if there is no information.',
        '{"text": "All wetlands remain covered by water throughout the entire year."}', 
        ARRAY['FALSE'],
        'The passage explicitly mentions that while some wetlands remain flooded throughout every season, others become wet only after rainfall or during particular months.',
        'Some wetlands remain flooded throughout every season, while others become wet only after heavy rainfall or during particular months.'
    ),
    (
        passage_id, 3, 'tfng', 
        'Write TRUE if the statement agrees with the passage, FALSE if the statement contradicts the passage, NOT GIVEN if there is no information.',
        '{"text": "Wetland plants help remove some pollutants from rainwater."}', 
        ARRAY['TRUE'],
        'The passage notes that the plants slow water movement so mud settles, and soil microorganisms break down harmful substances, cleaning the street runoff.',
        'The plants growing there slow the movement of water, allowing mud and other particles to settle naturally. At the same time, microorganisms living in the wet soil break down many harmful substances.'
    ),
    (
        passage_id, 4, 'tfng', 
        'Write TRUE if the statement agrees with the passage, FALSE if the statement contradicts the passage, NOT GIVEN if there is no information.',
        '{"text": "Urban wetlands completely eliminate flooding during heavy rainfall."}', 
        ARRAY['FALSE'],
        'The passage says wetlands act like giant sponges to reduce and gradually release excess water, which "lowers the risk of severe flooding," not that they completely eliminate it.',
        'This natural process reduces pressure on drainage systems and lowers the risk of severe flooding.'
    ),
    (
        passage_id, 5, 'tfng', 
        'Write TRUE if the statement agrees with the passage, FALSE if the statement contradicts the passage, NOT GIVEN if there is no information.',
        '{"text": "Scientists were surprised when certain rare animals returned to restored wetlands."}', 
        ARRAY['TRUE'],
        'The text states that rare animals returned after restoration, surprising both scientists and local residents.',
        'In some cities, rare animals have returned after wetlands were restored, surprising both scientists and local residents.'
    );

    -- 4. Insert Questions (Q6-Q10: Sentence Completion)
    INSERT INTO public.reading_questions (passage_id, question_number, question_type, instruction_text, question_data, correct_answers, explanation, citation_excerpt)
    VALUES
    (
        passage_id, 6, 'sentence_completion', 
        'Complete each sentence using NO MORE THAN TWO WORDS from the passage.',
        '{"text": "Roads and buildings reduce the ground''s ability to [blank] water."}', 
        ARRAY['absorb'],
        'The passage explains that paved areas prevent the ground from absorbing rainwater, contributing to rapid city runoff.',
        'large amounts of water can quickly collect in cities because roads, pavements, and buildings prevent the ground from absorbing it.'
    ),
    (
        passage_id, 7, 'sentence_completion', 
        'Complete each sentence using NO MORE THAN TWO WORDS from the passage.',
        '{"text": "Wetlands temporarily store [blank] during periods of heavy rainfall."}', 
        ARRAY['excess water'],
        'The passage explains that wetlands act like sponges by temporarily storing excess water.',
        'Wetlands act like giant natural sponges by temporarily storing excess water.'
    ),
    (
        passage_id, 8, 'sentence_completion', 
        'Complete each sentence using NO MORE THAN TWO WORDS from the passage.',
        '{"text": "Many schools arrange [blank] so students can observe wildlife."}', 
        ARRAY['field trips'],
        'The passage states schools organise field trips so students can directly observe local ecosystems and wildlife.',
        'Schools often organise field trips to these areas because students can observe wildlife directly'
    ),
    (
        passage_id, 9, 'sentence_completion', 
        'Complete each sentence using NO MORE THAN TWO WORDS from the passage.',
        '{"text": "Some carbon remains stored beneath wetland water in the [blank]."}', 
        ARRAY['soil'],
        'According to the passage, the carbon absorbed by wetland plants is stored in the soil beneath the water.',
        'Part of this carbon becomes stored in the soil beneath the water, where it can remain for many years.'
    ),
    (
        passage_id, 10, 'sentence_completion', 
        'Complete each sentence using NO MORE THAN TWO WORDS from the passage.',
        '{"text": "Some polluted wetlands require years of [blank] before restoration can succeed."}', 
        ARRAY['cleaning'],
        'The text explains that restoring wetlands can be difficult and some polluted sites require years of cleaning.',
        'Some polluted sites require years of cleaning before plants and animals can safely return.'
    );

    -- 5. Insert Questions (Q11-Q13: Short Answer)
    INSERT INTO public.reading_questions (passage_id, question_number, question_type, instruction_text, question_data, correct_answers, explanation, citation_excerpt)
    VALUES
    (
        passage_id, 11, 'short_answer', 
        'Answer using NO MORE THAN THREE WORDS.',
        '{"text": "What type of land has been converted into wetland parks in several cities?"}', 
        ARRAY['abandoned industrial land'],
        'The passage mentions that several cities in Europe and Asia have transformed abandoned industrial land into wetland parks.',
        'several cities in Europe and Asia have transformed abandoned industrial land into thriving wetland parks.'
    ),
    (
        passage_id, 12, 'short_answer', 
        'Answer using NO MORE THAN THREE WORDS.',
        '{"text": "According to the passage, what has become healthier alongside wildlife because of wetland restoration?"}', 
        ARRAY['cities'],
        'The passage states that through careful planning, cities can become healthier places for both people and wildlife.',
        'These projects demonstrate that environmental protection and urban development do not always have to compete. With careful planning, cities can become healthier places for both people and wildlife.'
    ),
    (
        passage_id, 13, 'short_answer', 
        'Answer using NO MORE THAN THREE WORDS.',
        '{"text": "What do experts believe is essential for the future protection of urban wetlands?"}', 
        ARRAY['public awareness'],
        'The final paragraph says experts believe that the future of urban wetlands depends largely on public awareness.',
        'Experts believe that the future of urban wetlands depends largely on public awareness.'
    );

    RAISE NOTICE 'Passage 1 populated successfully! Test ID: %, Passage ID: %', test_id, passage_id;
END $$;
