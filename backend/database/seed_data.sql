-- Nightmare Shift: Seed Data — Locations
-- Run AFTER game_content_schema.sql

INSERT INTO `locations` (`name`, `description`, `atmosphere`, `risk_level`) VALUES
('Downtown Apartments', 'Flickering streetlights illuminate empty sidewalks', 'Urban decay', 2),
('Riverside Cemetery', 'Ancient tombstones shrouded in fog', 'Haunted', 4),
('Office District', 'Glass towers with only a few lights on', 'Corporate desolation', 1),
('Industrial Warehouse', 'Loading docks and chain-link fences', 'Abandoned industry', 3),
('Forest Road', 'Tall trees block out the moonlight', 'Wilderness danger', 5),
('Abandoned Hospital', 'Broken windows and overgrown parking lot', 'Medical horror', 5),
('Elementary School', 'Empty playground with swings moving in windless air', 'Childhood terror', 3),
('Suburban House', 'Cookie-cutter homes with too-perfect lawns', 'False normalcy', 2),
('Old Theater District', 'Faded marquees and darkened stage doors', 'Forgotten glamour', 3),
('Downtown Hotel', 'Art deco lobby with no guests at the desk', 'Transient luxury', 2),
('Police Station', 'Harsh fluorescent lights and barred windows', 'Institutional authority', 1),
('General Hospital', 'Sterile corridors echoing with distant footsteps', 'Clinical dread', 2),
('Harbor District', 'Fog-shrouded docks with creaking piers', 'Maritime mystery', 4),
('Psychic Shop', 'Neon palm reader sign buzzing in the window', 'Occult commerce', 3),
('Music Hall', 'Grand concert hall with dust motes dancing in spotlight', 'Haunted artistry', 3),
('Old Cathedral', 'Gothic spires piercing the night sky', 'Sacred sanctuary', 2),
('Seminary', 'Ivy-covered religious institution with glowing windows', 'Theological study', 1),
('Crime Scene', 'Yellow tape fluttering around chalk outlines', 'Recent violence', 4),
('City Hall', 'Imposing government building with marble columns', 'Municipal power', 2),
('Private Estate', 'Gated mansion hidden behind ancient oak trees', 'Exclusive mystery', 4),
('Private Residence', 'Unremarkable house with secrets behind curtained windows', 'Hidden darkness', 3),
('Antique Shop', 'Cluttered storefront filled with objects from forgotten times', 'Temporal commerce', 3),
('Crossroads', 'Four paths meeting where streetlights fail to reach', 'Decision point', 5),
('End of the Line', 'The place where all journeys ultimately lead', 'Final destination', 5);

-- ─── Passengers (first 8 core passengers) ───────────────────────────

INSERT INTO `passengers` (`id`, `name`, `emoji`, `description`, `pickup`, `destination`, `personal_rule`, `supernatural`, `fare`, `rarity`, `items`, `dialogue`, `relationships`, `backstory_details`, `tells`, `guideline_exceptions`, `deception_level`, `stress_level`, `trust_required`, `route_preferences`, `state_profile`, `sort_order`) VALUES
(1, 'Mrs. Chen', '👵', 'Elderly woman, going to Riverside Cemetery', 'Downtown Apartments', 'Riverside Cemetery',
 'Hates bright lights - will ask you to dim dashboard', 'Ghost of former taxi passenger', 15.00, 'common',
 '["old locket","withered flowers"]',
 '["It''s so cold tonight, isn''t it?","I haven''t been home in so long...","Thank you for the ride, dear","Why won''t you look at me, dear?"]',
 '[]',
 'Mrs. Chen was a regular taxi passenger for 40 years before her accident on this very route...',
 '[{"type":"verbal","intensity":"moderate","description":"Asks why you won''t make eye contact","triggerPhrase":"Why won''t you look at me","reliability":0.8},{"type":"behavioral","intensity":"subtle","description":"Fidgets with old locket when ignored","animationCue":"fidget_locket","reliability":0.6}]',
 '["eye_contact_lonely"]', 0.1, 0.7, 0.3,
 '[{"route":"normal","preference":"fears","reason":"Too many memories on the main roads...","fareModifier":0.3,"stressModifier":0.3,"specialDialogue":"Please... not the main road. Too many memories there.","triggerChance":0.8},{"route":"scenic","preference":"loves","reason":"The quiet paths remind me of peaceful times","fareModifier":1.4,"stressModifier":-0.2,"specialDialogue":"Oh, the scenic route! How lovely... it reminds me of better days.","triggerChance":0.9},{"route":"shortcut","preference":"likes","reason":"Quick paths away from the crowds","fareModifier":1.1,"stressModifier":-0.1,"specialDialogue":"A quiet shortcut... yes, away from all the noise.","triggerChance":0.6},{"route":"police","preference":"dislikes","reason":"Uniformed officers make me nervous","fareModifier":0.9,"stressModifier":0.2,"specialDialogue":"So many police cars... it makes me anxious.","triggerChance":0.7}]',
 '{"needType":"loneliness","initialLevel":45,"thresholds":{"warning":60,"critical":80,"meltdown":92},"needChange":{"passive":4,"obey":8,"break":2,"exceptionRelief":28},"exceptionId":"eye_contact_lonely","tellIntensities":{"warning":["moderate"],"critical":["obvious"]},"dialogueByStage":{"warning":["Please... could you just look at me for a moment?","It gets so cold when no one sees me."],"critical":["Why won''t you acknowledge me? I''m right here!","If you keep ignoring me I might fade entirely."],"meltdown":["Look at me! I refuse to disappear again!"]},"confidenceImpact":{"warning":-0.05,"critical":-0.1},"trustImpact":{"warning":0.05,"critical":0.1}}',
 1),

(2, 'Jake Morrison', '👨‍💼', 'Young professional, unusual pale complexion', 'Office District', 'Industrial Warehouse',
 'Don''t ask about his work - becomes agitated', 'Vampire or undead worker', 22.00, 'common',
 '["strange coins","business card with no company name"]',
 '["Working late again...","Do you mind if I keep the windows up?","Some jobs you just can''t talk about"]',
 '[4]',
 'Jake works the night shift at a blood bank, though his employment records don''t seem to exist...',
 '[{"type":"behavioral","intensity":"moderate","description":"Checks his watch every minute as hunger builds","animationCue":"frantic_watch_check","reliability":0.7},{"type":"verbal","intensity":"obvious","description":"Mutters about needing to feed soon","triggerPhrase":"I need to feed","reliability":0.85}]',
 '["shortcut_time_critical"]', NULL, NULL, NULL,
 '[{"route":"police","preference":"fears","reason":"Police attention is... problematic for my kind","fareModifier":0.3,"stressModifier":0.4,"specialDialogue":"Not the police route! They ask too many questions...","triggerChance":0.9},{"route":"shortcut","preference":"loves","reason":"Dark alleys and back roads suit me","fareModifier":1.3,"stressModifier":-0.2,"specialDialogue":"Perfect. The shadows will hide us well.","triggerChance":0.7},{"route":"normal","preference":"dislikes","reason":"Too many streetlights and witnesses","fareModifier":0.9,"stressModifier":0.1,"specialDialogue":"So many lights... so many watching eyes.","triggerChance":0.5},{"route":"scenic","preference":"neutral","reason":"Acceptable as long as it''s not too bright","fareModifier":1.0,"stressModifier":0.0,"specialDialogue":"This route will do... peaceful enough.","triggerChance":0.3}]',
 '{"needType":"hunger","initialLevel":55,"thresholds":{"warning":65,"critical":82,"meltdown":96},"needChange":{"passive":5,"obey":11,"break":3,"exceptionRelief":35},"exceptionId":"shortcut_time_critical","tellIntensities":{"warning":["moderate"],"critical":["obvious"]},"dialogueByStage":{"warning":["We really should pick up the pace... daylight is unforgiving.","I can feel the hunger gnawing. Please, a faster route."],"critical":["If we don''t hurry I might lose control.","The thirst is unbearable. Take the alleys—now."],"meltdown":["Too late. I can''t promise your safety any longer!"]},"confidenceImpact":{"warning":-0.08,"critical":-0.12},"trustImpact":{"warning":0.05,"critical":0.1}}',
 2),

(3, 'Sarah Woods', '👩‍🦰', 'Young woman with dirt under her fingernails', 'Forest Road', 'Downtown Hotel',
 'Gets nervous if you take highway - prefers back roads', 'Escaped from something in the woods', 28.00, 'common',
 '["muddy branch","torn fabric","cash with soil on it"]',
 '["I need to get back to civilization","Stay away from the woods tonight","They might still be following","Don''t take the highway, please - they use the main roads"]',
 '[8]',
 'Sarah was part of a hiking group that went missing three years ago. She was the only one who ''returned''...',
 '[{"type":"verbal","intensity":"obvious","description":"Warns against taking main roads","triggerPhrase":"Don''t take","reliability":0.9},{"type":"behavioral","intensity":"moderate","description":"Shows visible panic when approaching highway entrances","animationCue":"panic_approach","reliability":0.8}]',
 '["gps_passenger_warning"]', 0.2, 0.8, 0.4,
 '[{"route":"shortcut","preference":"loves","reason":"Back roads keep us hidden","fareModifier":1.4,"stressModifier":-0.3,"specialDialogue":"Yes! Take the back roads - they won''t find us!","triggerChance":0.9},{"route":"normal","preference":"fears","reason":"They watch the main roads!","fareModifier":0.6,"stressModifier":0.4,"specialDialogue":"Not the main road! They''ll see us!","triggerChance":0.8},{"route":"police","preference":"dislikes","reason":"Too many questions","fareModifier":0.8,"stressModifier":0.2,"specialDialogue":"Police... they ask too many questions.","triggerChance":0.6},{"route":"scenic","preference":"neutral","reason":"Acceptable if quiet","fareModifier":1.0,"stressModifier":0.0,"specialDialogue":"This route is quiet at least.","triggerChance":0.4}]',
 '{"needType":"fear","initialLevel":50,"thresholds":{"warning":65,"critical":83,"meltdown":94},"needChange":{"passive":6,"obey":9,"break":4,"exceptionRelief":24},"exceptionId":"gps_passenger_warning","tellIntensities":{"warning":["moderate"],"critical":["obvious"]},"dialogueByStage":{"warning":["Please, avoid the main roads—they know those paths.","They watch the highways. Take the back roads, I beg you."],"critical":["If you follow the GPS we are dead. Turn now!","I can hear them in the wires. We have to change course!"],"meltdown":["Too late—they found us through the lights!"]}}',
 3),

(4, 'Dr. Hollow', '👨‍⚕️', 'Doctor with old-fashioned medical bag', 'Abandoned Hospital', 'Suburban House',
 'Will offer medical advice - don''t accept treatment', 'Former doctor who lost license for unethical experiments', 35.00, 'uncommon',
 '["antique syringe","prescription pad","surgical tools"]',
 '["House calls are so rare these days","I can help with any pain you''re feeling","Medicine has come so far since my day","Please, I need to stop - someone might need medical attention!"]',
 '[2,9]',
 'Dr. Hollow lost his license in 1987 for conducting unauthorized experiments on terminal patients...',
 '[{"type":"verbal","intensity":"obvious","description":"Insists on stopping to help with medical emergencies","triggerPhrase":"need to stop","reliability":0.8},{"type":"behavioral","intensity":"moderate","description":"Constantly checking medical equipment in bag","animationCue":"check_medical_bag","reliability":0.7}]',
 '["stop_emergency_need"]', 0.3, 0.5, 0.6,
 '[{"route":"shortcut","preference":"likes","reason":"Discretion appreciated","fareModifier":1.2,"stressModifier":-0.1,"specialDialogue":"The back roads... yes, discretion is appreciated.","triggerChance":0.7},{"route":"police","preference":"fears","reason":"My license... complications","fareModifier":0.5,"stressModifier":0.5,"specialDialogue":"Not past the police station! My license... there are complications.","triggerChance":0.9},{"route":"normal","preference":"neutral","reason":"Standard route acceptable","fareModifier":1.0,"stressModifier":0.0,"specialDialogue":"The standard route will suffice.","triggerChance":0.4},{"route":"scenic","preference":"likes","reason":"Peaceful, contemplative","fareModifier":1.2,"stressModifier":-0.1,"specialDialogue":"Ah, the scenic route. Peaceful... contemplative.","triggerChance":0.6}]',
 NULL,
 4),

(5, 'The Collector', '🕴️', 'Well-dressed figure with multiple briefcases', 'Antique Shop', 'Private Residence',
 'Will try to buy things from your car - don''t sell anything', 'Trades in supernatural artifacts and souls', 50.00, 'rare',
 '["crystal pendant","ancient coin","contract paper"]',
 '["I see you have interesting items","Everything has a price","I make excellent deals"]',
 '[11,16]',
 'The Collector has been making deals in this city for over a century, always offering what people need most...',
 NULL, NULL, NULL, NULL, NULL,
 '[{"route":"scenic","preference":"loves","reason":"I appreciate the finer routes","fareModifier":1.4,"stressModifier":-0.2,"specialDialogue":"Ah yes, the scenic route. I do appreciate the finer things.","triggerChance":0.8},{"route":"normal","preference":"likes","reason":"Efficiency has value","fareModifier":1.1,"stressModifier":0.0,"specialDialogue":"The normal route. Efficiency has its value.","triggerChance":0.5},{"route":"shortcut","preference":"dislikes","reason":"Too crude for my taste","fareModifier":0.8,"stressModifier":0.1,"specialDialogue":"A shortcut? How... crude.","triggerChance":0.6},{"route":"police","preference":"neutral","reason":"They know better than to stop me","fareModifier":1.0,"stressModifier":0.0,"specialDialogue":"The police know better than to interfere with my business.","triggerChance":0.3}]',
 NULL,
 5),

(6, 'Tommy Sullivan', '👦', 'Child in school uniform, shouldn''t be out this late', 'Elementary School', 'Suburban House',
 'Don''t ask about his parents - becomes very quiet', 'Lost child who doesn''t realize he''s been missing for decades', 12.00, 'common',
 '["torn homework","old lunch box","class photo"]',
 '["Is mommy waiting for me?","I don''t like the dark","Teacher said I should go straight home","Why won''t anyone look at me? Am I being bad?"]',
 '[]',
 'Tommy went missing from school in 1982. His backpack was found, but he never was...',
 '[{"type":"verbal","intensity":"obvious","description":"Asks why no one will look at him","triggerPhrase":"Why won''t anyone look at me","reliability":0.9},{"type":"behavioral","intensity":"moderate","description":"Voice trembles with increasing distress","audioCue":"child_distress","reliability":0.7}]',
 '["eye_contact_lonely"]', 0.0, 0.6, 0.2,
 '[{"route":"shortcut","preference":"fears","reason":"Dark alleys scare children","fareModifier":0.3,"stressModifier":0.4,"specialDialogue":"I don''t like this way! It''s too scary and dark!","triggerChance":0.9},{"route":"normal","preference":"likes","reason":"Well-lit streets feel safer","fareModifier":1.2,"stressModifier":-0.1,"specialDialogue":"This is the way I usually go home from school.","triggerChance":0.6},{"route":"police","preference":"loves","reason":"Police officers make children feel safe","fareModifier":1.5,"stressModifier":-0.3,"specialDialogue":"Look! Police cars! They keep us safe from bad people!","triggerChance":0.8},{"route":"scenic","preference":"dislikes","reason":"Longer routes make children anxious to get home","fareModifier":0.8,"stressModifier":0.2,"specialDialogue":"This is taking too long... I want to go home to mommy.","triggerChance":0.7}]',
 NULL,
 6);

-- ─── Shift Rules ────────────────────────────────────────────────────

INSERT INTO `shift_rules` (`id`, `title`, `description`, `difficulty`, `type`, `visible`, `action_key`, `action_type`, `related_guideline_id`, `default_safety`, `default_outcome`, `follow_consequences`, `break_consequences`, `exception_rewards`, `exception_need_adjustment`, `follow_need_adjustment`, `break_need_adjustment`, `violation_message`, `sort_order`) VALUES
(1, 'No Eye Contact', 'Do not look directly at passengers tonight', 'medium', 'basic', 1,
 'eye_contact', 'forbidden', 1001, 'safe',
 'Averting your gaze keeps predatory spirits at bay and maintains cab stability.',
 '[{"type":"survival","value":1,"description":"You resisted the passenger''s pull and finished the ride unharmed.","probability":0.85}]',
 '[{"type":"death","value":1,"description":"Staring into a void-touched passenger shredded your sense of self.","probability":0.7}]',
 '[{"type":"reputation","value":8,"description":"Acknowledged a lonely spirit and earned supernatural goodwill.","probability":0.75},{"type":"story_unlock","value":1,"description":"Unlocked a heartfelt confession that opens a new narrative thread.","probability":0.5}]',
 -25, 5, 15, 'You locked eyes when you were warned not to. Something inside you unraveled.', 1),

(2, 'Silent Night', 'No radio or music allowed during rides', 'easy', 'basic', 1,
 'play_music', 'forbidden', 1011, 'safe',
 'Maintaining silence prevents the radio frequencies from attracting spirits.',
 '[{"type":"survival","value":1,"description":"Kept the cab quiet and avoided spectral interference.","probability":0.8}]',
 '[{"type":"death","value":1,"description":"The song acted as a beacon for the wrong audience.","probability":0.4},{"type":"fuel","value":-5,"description":"Equipment interference drained your cab''s power.","probability":0.5}]',
 '[{"type":"reputation","value":6,"description":"Calmed a trembling passenger with the perfect track.","probability":0.7},{"type":"item","value":1,"description":"Received a protective mixtape for future rides.","probability":0.35}]',
 -18, 8, 12, 'Breaking the silence invited a chorus of voices you cannot silence.', 2),

(3, 'Cash Only', 'Do not accept tips of any kind tonight', 'hard', 'basic', 1,
 'accept_tip', 'forbidden', 1003, 'safe',
 'Hard currency keeps cursed favors from binding to you.',
 '[{"type":"money","value":15,"description":"Collected predictable, clean payments.","probability":0.9}]',
 '[{"type":"death","value":1,"description":"A cursed coin latched onto your lifeline.","probability":0.5},{"type":"reputation","value":-10,"description":"Word spread that you accept forbidden currency.","probability":0.6}]',
 '[{"type":"reputation","value":7,"description":"Offered charity to a soul who could not pay otherwise.","probability":0.65},{"type":"story_unlock","value":1,"description":"Unlocked a spectral favor redeemable later in the night.","probability":0.45}]',
 -12, 4, 14, 'That payment was never meant for mortal hands. It stains everything it touches.', 3),

(4, 'Windows Sealed', 'Keep all windows closed at all times', 'medium', 'basic', 1,
 'open_window', 'forbidden', 1009, 'safe',
 'Closed windows keep whispers, ash, and hungry winds outside the cab.',
 '[{"type":"survival","value":1,"description":"Protected the cabin from invasive spirits.","probability":0.75}]',
 '[{"type":"death","value":1,"description":"The gale carried something inside that never left.","probability":0.5},{"type":"fuel","value":-3,"description":"Air drag cut into your efficiency.","probability":0.6}]',
 '[{"type":"reputation","value":9,"description":"Saved a suffocating passenger by cracking the seal just in time.","probability":0.7},{"type":"item","value":1,"description":"Received a sunlight talisman for your compassion.","probability":0.4}]',
 -20, 6, 16, 'You opened the cab to the storm and something new rode with you.', 4),

(5, 'Route Restriction', 'Do not deviate from GPS route for any reason', 'hard', 'basic', 1,
 'take_shortcut', 'forbidden', 1010, 'safe',
 'Following dispatch routes minimizes ambush chances and keeps dispatch happy.',
 '[{"type":"time","value":-5,"description":"Arrived on schedule without raising suspicion.","probability":0.8}]',
 '[{"type":"death","value":1,"description":"The shortcut led you straight into a supernatural trap.","probability":0.3},{"type":"fuel","value":-10,"description":"You burned fuel retracing your route through cursed alleys.","probability":0.6}]',
 '[{"type":"money","value":25,"description":"Passenger tipped big for getting them to safety in time.","probability":0.7},{"type":"reputation","value":10,"description":"Earned trust among nocturnal regulars for decisive driving.","probability":0.65}]',
 -30, 12, 18, 'Dispatch routes exist for a reason. The shadows were waiting off-grid.', 5);

-- Conditional rules
INSERT INTO `shift_rules` (`id`, `title`, `description`, `difficulty`, `type`, `visible`, `sort_order`) VALUES
(6, 'Midnight Curfew', 'No pickups after midnight from cemetery locations', 'medium', 'conditional', 1, 6),
(7, 'Living Passengers Only', 'Do not transport supernatural entities during thunderstorms', 'hard', 'conditional', 1, 7),
(8, 'Hospital Protocol', 'Medical personnel must exit at original pickup location', 'medium', 'conditional', 1, 8);

-- Conflicting rules
INSERT INTO `shift_rules` (`id`, `title`, `description`, `difficulty`, `type`, `visible`, `conflicts_with`, `sort_order`) VALUES
(9, 'Emergency Response', 'Always take the fastest route when passenger is in distress', 'hard', 'conflicting', 1, '[5]', 9),
(10, 'Customer Service', 'Always comply with reasonable passenger requests', 'medium', 'conflicting', 1, '[4]', 10),
(11, 'Safety First', 'Make eye contact with passengers to ensure they''re alert', 'hard', 'conflicting', 1, '[1]', 11);

-- Hidden rules
INSERT INTO `shift_rules` (`id`, `title`, `description`, `difficulty`, `type`, `visible`, `violation_message`, `sort_order`) VALUES
(12, 'The Counting Rule', 'Never pick up more than 3 passengers with the same supernatural type', 'expert', 'hidden', 0, 'You''ve transported too many of the same supernatural entities. They''re drawn to patterns...', 12),
(13, 'The Time Limit', 'No single ride should take longer than 45 minutes', 'expert', 'hidden', 0, 'You took too long with that passenger. Time has consequences in this job...', 13),
(14, 'The Silence Between', 'Never speak during the last 5 minutes of your shift', 'expert', 'hidden', 0, 'Words spoken in the final moments carry too much weight. You should have stayed quiet...', 14);

-- Weather rules
INSERT INTO `shift_rules` (`id`, `title`, `description`, `difficulty`, `type`, `visible`, `trigger`, `violation_message`, `sort_order`) VALUES
(101, 'Storm Silence', 'Don''t use windshield wipers during thunderstorms', 'hard', 'weather', 0, 'thunderstorm', 'The wipers disturbed something that feeds on electrical storms...', 101),
(102, 'Light in Darkness', 'Keep headlights on during heavy fog', 'medium', 'weather', 0, 'heavy_fog', 'In the fog, darkness means something different. You should have kept the lights on.', 102),
(103, 'Winter Caution', 'Drive under 25 mph in snow conditions', 'medium', 'weather', 0, 'snow', 'Speed in snow conditions attracted the attention of winter spirits...', 103),
(104, 'Shelter Protocol', 'No stops during late night bad weather', 'hard', 'weather', 0, 'latenight_badweather', 'Stopping in bad weather during the witching hour was a mistake...', 104),
(105, 'Clear Sight', 'Don''t use air conditioning when visibility drops below 30%', 'medium', 'weather', 0, 'low_visibility', 'The AC created condensation just when you needed clear vision most...', 105),
(106, 'Wind Whispers', 'Keep all windows closed during windstorms', 'easy', 'weather', 0, 'heavy_wind', 'The wind carried something in that you shouldn''t have let inside...', 106);

-- ─── Game Items ─────────────────────────────────────────────────────

INSERT INTO `game_items` (`name`, `type`, `rarity`, `description`, `effects`, `protective_properties`, `cursed_properties`, `max_durability`) VALUES
('Obsidian Mirror', 'protective', 'rare', 'Reflects supernatural gazes', NULL, '{"protectionType":"supernatural_immunity","protectionStrength":0.8,"usesRemaining":3}', NULL, NULL),
('Passenger Manifest', 'story', 'uncommon', 'A list of names that should never be spoken', NULL, NULL, NULL, NULL),
('Cold Coffee', 'consumable', 'common', 'Lukewarm at best', '[{"type":"fuel_bonus","value":5}]', NULL, NULL, NULL),
('Cursed Coin', 'cursed', 'uncommon', 'It keeps finding its way back', NULL, NULL, '{"penaltyType":"fuel_drain","penaltyValue":2,"triggersAfter":3,"canBeRemoved":true}', NULL),
('Lucky Dice', 'protective', 'rare', 'Always rolls in your favor', NULL, '{"protectionType":"lucky_encounters","protectionStrength":0.6,"usesRemaining":5}', NULL, NULL),
('Crystal Pendant', 'protective', 'rare', 'Glows in the presence of hostile entities', NULL, '{"protectionType":"entity_detection","protectionStrength":0.7,"usesRemaining":10}', NULL, 10),
('Ancient Coin', 'trade', 'uncommon', 'Currency from a forgotten era', NULL, NULL, NULL, NULL),
('Contract Paper', 'story', 'rare', 'The fine print seems to change when you look away', NULL, NULL, NULL, NULL),
('Old Locket', 'story', 'common', 'Contains a faded photograph of someone who looks like you', NULL, NULL, NULL, NULL),
('Withered Flowers', 'story', 'common', 'They smell faintly of a perfume you can''t place', NULL, NULL, NULL, NULL),
('Antique Syringe', 'story', 'uncommon', 'Pre-dates modern medicine by a century', NULL, NULL, NULL, NULL),
('Burned Dance Card', 'story', 'uncommon', 'Charred edges but the names remain legible', NULL, NULL, NULL, NULL),
('Protective Mixtape', 'protective', 'rare', 'Calming frequencies ward off spectral interference', NULL, '{"protectionType":"audio_ward","protectionStrength":0.5,"usesRemaining":3}', NULL, NULL);

-- ─── Skills (permanent upgrades / skill tree) ───────────────────────

INSERT INTO `skills` (`skill_id`, `name`, `description`, `cost`, `icon`, `category`, `prerequisites`, `effect_type`, `effect_target`, `effect_value`, `sort_order`) VALUES
-- Survival Branch
('fuel_efficiency_1', 'Hybrid Injection', 'Improves fuel efficiency by 10%.', 500, '⛽', 'survival', '[]', 'stat_boost', 'fuel_consumption', 0.9000, 1),
('fuel_tank_1', 'Expanded Tank', 'Increases maximum fuel capacity by 10.', 800, '🛢️', 'survival', '["fuel_efficiency_1"]', 'stat_boost', 'max_fuel', 10.0000, 2),
('hull_reinforcement', 'Reinforced Chassis', 'Reduces damage from environmental hazards.', 1200, '🛡️', 'survival', '["fuel_tank_1"]', 'passive_bonus', 'hazard_damage', 0.8000, 3),
-- Occult Branch
('third_eye_1', 'Glimpse', '5% chance to reveal a hidden rule at the start of a ride.', 600, '👁️', 'occult', '[]', 'mechanic_unlock', 'reveal_hidden_chance', 0.0500, 4),
('warding_charm', 'Basic Warding', 'Reduces the sanity drain from supernatural events.', 1000, '🧿', 'occult', '["third_eye_1"]', 'stat_boost', 'sanity_resistance', 0.1000, 5),
-- Efficiency Branch
('silver_tongue_1', 'Silver Tongue', 'Increases tips from passengers by 10%.', 400, '🗣️', 'efficiency', '[]', 'stat_boost', 'tip_multiplier', 1.1000, 6),
('negotiator', 'Negotiator', 'Reduces the cost of items in shops by 15%.', 900, '🤝', 'efficiency', '["silver_tongue_1"]', 'stat_boost', 'shop_discount', 0.1500, 7);
