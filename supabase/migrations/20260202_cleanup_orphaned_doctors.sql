-- Clean up orphaned doctor records (doctors without a profile)

-- 1. Count orphans
SELECT COUNT(*) as orphaned_doctors_count
FROM doctors d
LEFT JOIN profiles p ON d.user_id = p.id
WHERE p.id IS NULL;

-- 2. Delete orphans
DELETE FROM doctors
WHERE user_id IN (
    SELECT d.user_id
    FROM doctors d
    LEFT JOIN profiles p ON d.user_id = p.id
    WHERE p.id IS NULL
);
