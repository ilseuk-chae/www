-- user_sessions 테이블 구조 변경
-- UNIQUE KEY 제거: 강제 로그아웃된 레코드와 새 세션이 공존해야 하므로
ALTER TABLE user_sessions DROP INDEX uk_user_device;

-- 활성 세션 조회 성능을 위한 인덱스 추가
ALTER TABLE user_sessions ADD INDEX idx_user_device_active (user_no, user_type, device_type, is_forced_logout);

-- 오래된 강제 로그아웃 레코드 자동 정리를 위한 인덱스
ALTER TABLE user_sessions ADD INDEX idx_last_activity (last_activity);
