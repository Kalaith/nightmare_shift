UPDATE `passengers`
SET `tip_profile` = '{"chanceByRoute":{"normal":35,"shortcut":25,"scenic":60,"police":15},"amountRange":{"min":2,"max":5},"currencyText":"a few careful bills","requiredActions":["stay_silent","keep_eyes_forward","focus_on_driving"]}'
WHERE `id` = 1;

UPDATE `passengers`
SET `tip_profile` = '{"chanceByRoute":{"normal":20,"shortcut":15,"scenic":10,"police":5},"amountRange":{"min":4,"max":7},"currencyText":"a velvet-folded note","requiredActions":["speak_first","play_music","eye_contact"]}'
WHERE `id` = 2;

UPDATE `passengers`
SET `tip_profile` = '{"chanceByRoute":{"normal":15,"shortcut":45,"scenic":20,"police":5},"amountRange":{"min":5,"max":9},"currencyText":"a tightly folded stack of old cash","requiredActions":["open_window","speak_first","take_shortcut"]}'
WHERE `id` = 3;

UPDATE `passengers`
SET `tip_profile` = '{"chanceByRoute":{"normal":25,"shortcut":20,"scenic":30,"police":10},"amountRange":{"min":1,"max":3},"currencyText":"a crumpled note from a tiny fist","requiredActions":["stay_silent","focus_on_driving","keep_eyes_forward"]}'
WHERE `id` = 6;
