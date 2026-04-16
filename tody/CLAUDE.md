# 프로젝트: Tody

## 작업 디렉토리
메인 프로젝트 경로: `E:\source\Tody\www\tody`

---

## 디렉토리 구조

```
E:\source\Tody\www\tody\
├── html/                        # 웹 루트 (서비스 파일 전체)
│   ├── index.html               # 메인 진입점
│   ├── admin/                   # 관리자 페이지
│   │   ├── index.html
│   │   ├── list.html
│   │   ├── setting.html
│   │   ├── header.html
│   │   ├── footer.html
│   │   ├── back/                # 관리자 백엔드(PHP 등)
│   │   ├── js/                  # 관리자 전용 JS
│   │   └── views/               # 관리자 뷰 템플릿
│   ├── front/                   # 프론트 사용자 페이지
│   │   ├── back/                # 프론트 백엔드(PHP 등)
│   │   ├── css/
│   │   ├── js/
│   │   ├── plugin/
│   │   ├── views/               # 프론트 뷰 템플릿
│   │   └── assets/
│   ├── todyloan/                # 대출 서비스 섹션
│   │   ├── html/
│   │   ├── css/
│   │   └── js/
│   ├── todypurchas/             # 구매대행 서비스 섹션
│   │   ├── css/
│   │   └── js/
│   ├── src/                     # 소스 파일
│   ├── assets/                  # 공통 자산
│   │   ├── css/
│   │   ├── js/
│   │   ├── images/
│   │   ├── fonts/
│   │   ├── json/
│   │   ├── lang/
│   │   └── libs/
│   ├── vendor/                  # Composer 패키지 (수정 금지)
│   ├── .env                     # 환경변수 (DB, API 키 등)
│   ├── .htaccess
│   ├── composer.json
│   ├── robots.txt
│   └── sitemap.xml
├── logs/                        # 서버 로그
│   ├── access.log               # 접속 로그
│   ├── error.log                # 에러 로그
│   └── email_log.txt            # 이메일 발송 로그
├── migration/                   # DB 마이그레이션
├── todyMariaDB.sql              # MariaDB 스키마/데이터
└── todyPostgreSQL.sql.gz        # PostgreSQL 백업
```

---

## 주요 파일 위치

| 목적 | 경로 |
|------|------|
| 메인 진입점 | `html/index.html` |
| 관리자 메인 | `html/admin/index.html` |
| 관리자 목록 | `html/admin/list.html` |
| 관리자 설정 | `html/admin/setting.html` |
| 환경변수 | `html/.env` |
| 에러 로그 | `logs/error.log` |
| 접속 로그 | `logs/access.log` |
| DB 스키마 | `todyMariaDB.sql` |

---

## 관련 데이터 경로 (E:\source\Tody)

```
E:\source\Tody\
├── www/                         # 웹 서비스 (위 구조)
├── AL_D002/                     # 연속지적도 데이터 (CSV)
├── GIS건물일반집합정보/           # GIS 건물 정보
├── 건축물대장/                   # 건축물대장 OpenAPI 문서
├── 건축물대장Title/
├── 건축물대장Total/
├── 경계data/                    # 행정/센서스 경계 데이터
├── 연속지적도형정보/              # 지적도형 데이터
├── 토지특성정보/                  # 토지특성 데이터
├── 법정동/
├── Key파일/
├── QGIS_query/                  # QGIS 쿼리 파일
├── 난독화이전 파일/html/          # 백업용 원본 HTML
└── 국토부API문서/                # 국토부 API 문서
```

---

## 코딩 규칙

- 작업 대상 기본 경로: `E:\source\Tody\www\tody\html\`
- 로그 확인 시: `E:\source\Tody\www\tody\logs\`
- vendor/ 폴더는 수정하지 않음 (Composer 관리)
- .env 파일에 민감 정보 포함 — 내용 노출 주의

## 파일 수정 규칙 (중요)

파일을 수정하기 전에 반드시 다음 형식으로 먼저 알려줄 것:

```
[수정 예정]
- 파일: html/admin/index.html
- 위치: 23번째 줄
- 변경 내용: 버튼 색상 red → blue
```

수정 후에도 다음 형식으로 알려줄 것:

```
[수정 완료]
- 파일: html/admin/index.html
- 변경한 줄: 23번째 줄
- 변경 내용: 버튼 색상 red → blue
```

여러 파일을 수정할 경우 각 파일마다 위 형식으로 모두 안내할 것.
