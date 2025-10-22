-- 컬럼의 모든 상세 정보 확인
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable,
  is_generated,
  generation_expression,
  is_updatable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_notification_settings'
  AND column_name = 'push_subscription';

-- CHECK 제약 확인
SELECT
  conname,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'user_notification_settings'::regclass
  AND contype = 'c';  -- CHECK constraint

-- 컬럼 속성 상세 확인
SELECT
  attname,
  atttypid::regtype,
  attnotnull,
  atthasdef,
  attidentity,
  attgenerated
FROM pg_attribute
WHERE attrelid = 'user_notification_settings'::regclass
  AND attname = 'push_subscription';
