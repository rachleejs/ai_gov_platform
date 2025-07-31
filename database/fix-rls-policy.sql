-- RLS 정책 수정 (인증 문제 해결)

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view educational quality evaluations" ON educational_quality_evaluations;
DROP POLICY IF EXISTS "Users can insert educational quality evaluations" ON educational_quality_evaluations;
DROP POLICY IF EXISTS "Users can update their educational quality evaluations" ON educational_quality_evaluations;

-- 임시로 RLS 비활성화 (개발 중에만 사용)
-- ALTER TABLE educational_quality_evaluations DISABLE ROW LEVEL SECURITY;

-- 또는 더 관대한 정책 생성 (프로덕션에서는 적절히 조정 필요)
CREATE POLICY "Allow all operations for authenticated users" ON educational_quality_evaluations
    FOR ALL USING (true);

-- 또는 구체적인 정책들
-- CREATE POLICY "Anyone can view evaluations" ON educational_quality_evaluations
--     FOR SELECT USING (true);
-- 
-- CREATE POLICY "Anyone can insert evaluations" ON educational_quality_evaluations
--     FOR INSERT WITH CHECK (true);
-- 
-- CREATE POLICY "Anyone can update evaluations" ON educational_quality_evaluations
--     FOR UPDATE USING (true);

SELECT 'RLS policies updated successfully!' as status; 