-- ============================================================
-- 부동산 개발 컨설팅 신청 테이블
-- 생성일: 2026-05-13
-- ============================================================

CREATE TABLE IF NOT EXISTS `consulting_listings` (
  `idx`           INT UNSIGNED    NOT NULL AUTO_INCREMENT  COMMENT '접수번호',
  `purpose`       VARCHAR(20)     NOT NULL                  COMMENT '개발목적 코드 (feasibility/devpermit/district/tourism/housing/industrial/urban/other)',
  `location`      VARCHAR(500)    NOT NULL                  COMMENT '소재지',
  `area`          VARCHAR(100)    NOT NULL DEFAULT ''       COMMENT '면적',
  `phone`         VARCHAR(20)     NOT NULL                  COMMENT '연락처',
  `name`          VARCHAR(50)     NOT NULL                  COMMENT '성명',
  `message`       TEXT            NOT NULL DEFAULT ''       COMMENT '기타 문의사항',
  `agree_fg`      CHAR(1)         NOT NULL DEFAULT 'N'      COMMENT '개인정보 동의 여부 (Y/N)',
  `status`        VARCHAR(20)     NOT NULL DEFAULT 'received' COMMENT '처리상태 (received/reviewing/completed/rejected)',
  `memo`          TEXT            NOT NULL DEFAULT ''       COMMENT '내부 메모',
  `email_sent_at` DATETIME            NULL DEFAULT NULL     COMMENT '이메일 발송일시',
  `ip_address`    VARCHAR(45)     NOT NULL DEFAULT ''       COMMENT '신청자 IP',
  `user_agent`    VARCHAR(255)    NOT NULL DEFAULT ''       COMMENT '신청자 브라우저',
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '신청일시',
  `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  `active_fg`     CHAR(1)         NOT NULL DEFAULT 'Y'              COMMENT '활성 여부 (Y/N)',
  PRIMARY KEY (`idx`),
  KEY `idx_status`    (`status`),
  KEY `idx_purpose`   (`purpose`),
  KEY `idx_created`   (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='부동산 개발 컨설팅 신청';
