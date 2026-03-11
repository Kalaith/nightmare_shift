ALTER TABLE `passengers`
ADD COLUMN `tip_profile` JSON DEFAULT NULL
COMMENT 'Tip offer configuration object'
AFTER `state_profile`;
