-- 중복 접속 방지를 위한 사용자 세션 관리 테이블
-- 사용자별 PC/모바일 각 1개 세션만 허용
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_no       VARCHAR(100)               NOT NULL COMMENT '실제 DB user_no',
    user_type     ENUM('FRONT', 'ADMIN')     NOT NULL DEFAULT 'FRONT',
    device_type   ENUM('PC', 'MOBILE')       NOT NULL DEFAULT 'PC',
    session_token VARCHAR(100)               NOT NULL,
    ip_address    VARCHAR(50),
    is_forced_logout TINYINT(1)              NOT NULL DEFAULT 0 COMMENT '강제 로그아웃 여부 (1=강제종료됨)',
    created_at    DATETIME                   NOT NULL DEFAULT NOW(),
    last_activity DATETIME                   NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    UNIQUE KEY uk_user_device (user_no, user_type, device_type),
    INDEX idx_session_token (session_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='중복 접속 방지 세션 관리';
